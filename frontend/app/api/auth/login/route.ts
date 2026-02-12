import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getSessionCookieConfig } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  try {
    // 1. Rate limiting
    const rateLimit = checkRateLimit(ip)
    if (!rateLimit.allowed) {
      console.warn(`[LOGIN] Rate limit raggiunto per IP: ${ip}`)
      return NextResponse.json(
        { error: `Troppi tentativi. Riprova tra ${Math.ceil((rateLimit.retryAfterSeconds || 900) / 60)} minuti.` },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds || 900),
            'X-Content-Type-Options': 'nosniff',
          }
        }
      )
    }

    // 2. Parsing e validazione input
    const body = await request.json()
    const { email, password } = body

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email e password sono richiesti' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'Formato email non valido' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    if (password.length > 100) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // 3. Query tabella allievi su Supabase
    const { data: allievo, error: dbError } = await supabaseAdmin
      .from('allievi')
      .select('id, email, password_hash, nome, attivo, data_teoria_passata')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (dbError || !allievo) {
      console.warn(`[LOGIN] Utente non trovato: ${email} da IP: ${ip}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // 4. Verifica che l'allievo sia attivo
    if (!allievo.attivo) {
      console.warn(`[LOGIN] Utente disattivato: ${email} da IP: ${ip}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return NextResponse.json(
        { error: 'Account non attivo. Contatta l\'autoscuola.' },
        { status: 401, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // 4b. Verifica che l'allievo non abbia già passato la teoria
    if (allievo.data_teoria_passata) {
      console.warn(`[LOGIN] Teoria già passata per: ${email} da IP: ${ip}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return NextResponse.json(
        { error: 'Hai già superato l\'esame di teoria! L\'accesso alle lezioni non è più disponibile.' },
        { status: 401, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // 5. Verifica password
    let passwordValid = false

    if (allievo.password_hash.startsWith('$2a$') || allievo.password_hash.startsWith('$2b$')) {
      const bcrypt = await import('bcryptjs')
      passwordValid = await bcrypt.compare(password, allievo.password_hash)
    } else {
      passwordValid = password === allievo.password_hash
    }

    if (!passwordValid) {
      console.warn(`[LOGIN] Password errata per: ${email} da IP: ${ip} - Tentativi rimasti: ${rateLimit.remainingAttempts}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // 6. Aggiorna ultimo_accesso
    await supabaseAdmin
      .from('allievi')
      .update({ ultimo_accesso: new Date().toISOString() })
      .eq('id', allievo.id)

    // 7. Login riuscito - crea sessione con dati utente
    const token = await createSessionToken({
      email: allievo.email,
      id: allievo.id,
      nome: allievo.nome,
    })
    const cookieConfig = getSessionCookieConfig(token)

    console.log(`[LOGIN] Accesso riuscito per: ${allievo.nome} (${email}) da IP: ${ip}`)

    const response = NextResponse.json(
      { success: true },
      { headers: { 'X-Content-Type-Options': 'nosniff' } }
    )
    response.cookies.set(cookieConfig)

    return response
  } catch (error) {
    console.error(`[LOGIN] Errore interno per IP: ${ip}`, error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500, headers: { 'X-Content-Type-Options': 'nosniff' } }
    )
  }
}
