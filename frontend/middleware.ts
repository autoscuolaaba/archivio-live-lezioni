import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

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

    // Se la password è cambiata dopo il login, invalida la sessione
    if (payload.pwv && allievo.password_hash) {
      const currentPwv = allievo.password_hash.slice(-8)
      if (payload.pwv !== currentPwv) {
        const response = redirectToLogin(request)
        response.cookies.delete(COOKIE_NAME)
        return response
      }
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
