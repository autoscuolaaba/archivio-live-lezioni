import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const COOKIE_NAME = 'aba-session'

const PUBLIC_PATHS = ['/login', '/api/auth']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME)

  if (!sessionCookie?.value) {
    return redirectToLogin(request)
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(sessionCookie.value, secret)
    // Invalida vecchie sessioni senza claims essenziali
    if (!payload.email || !payload.nome) {
      const response = redirectToLogin(request)
      response.cookies.delete(COOKIE_NAME)
      return response
    }

    // Verifica che l'utente esista ancora nel database
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: allievo } = await supabase
      .from('allievi')
      .select('id, password_hash')
      .eq('email', payload.email)
      .single()

    // Se l'utente non esiste più, invalida la sessione
    if (!allievo) {
      const response = redirectToLogin(request)
      response.cookies.delete(COOKIE_NAME)
      return response
    }

    // Invalida sessioni senza pwv (token vecchi) o con password cambiata
    const expectedPwv = allievo.password_hash
      ? createHmac('sha256', process.env.JWT_SECRET!).update(allievo.password_hash).digest('hex').slice(0, 16)
      : null
    if (!payload.pwv || !expectedPwv || payload.pwv !== expectedPwv) {
      const response = redirectToLogin(request)
      response.cookies.delete(COOKIE_NAME)
      return response
    }

    return NextResponse.next()
  } catch {
    const response = redirectToLogin(request)
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|logo-aba\\.png|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
