import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

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
