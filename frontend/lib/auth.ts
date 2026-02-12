import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'aba-session'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return new TextEncoder().encode(secret)
}

function getSessionDurationDays(): number {
  const days = process.env.SESSION_DURATION_DAYS
  return days ? parseInt(days, 10) : 14
}

export async function createSessionToken(user: { email: string; id: string; nome: string }): Promise<string> {
  const secret = getJwtSecret()
  const durationDays = getSessionDurationDays()

  const token = await new SignJWT({
    authorized: true,
    email: user.email,
    userId: user.id,
    nome: user.nome,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${durationDays}d`)
    .sign(secret)

  return token
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secret = getJwtSecret()
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export function getSessionCookieConfig(token: string) {
  const durationDays = getSessionDurationDays()
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: durationDays * 24 * 60 * 60,
  }
}
