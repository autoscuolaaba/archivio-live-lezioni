import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getSessionCookieConfig } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  try {
    // 1. Rate limiting - controlla prima di tutto
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
    const { password } = body

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password richiesta' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    if (password.length > 100) {
      return NextResponse.json(
        { error: 'Password non valida' },
        { status: 400, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // 3. Verifica configurazione server
    const accessPassword = process.env.ACCESS_PASSWORD
    if (!accessPassword) {
      console.error('ACCESS_PASSWORD environment variable is not set')
      return NextResponse.json(
        { error: 'Errore di configurazione del server' },
        { status: 500, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // 4. Confronto password
    if (password !== accessPassword) {
      console.warn(`[LOGIN] Tentativo fallito da IP: ${ip} - Tentativi rimasti: ${rateLimit.remainingAttempts}`)
      // Delay artificiale per rallentare brute force
      await new Promise(resolve => setTimeout(resolve, 1000))
      return NextResponse.json(
        { error: 'Password non valida' },
        { status: 401, headers: { 'X-Content-Type-Options': 'nosniff' } }
      )
    }

    // 5. Login riuscito - crea sessione
    const token = await createSessionToken()
    const cookieConfig = getSessionCookieConfig(token)

    console.log(`[LOGIN] Accesso riuscito da IP: ${ip}`)

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
