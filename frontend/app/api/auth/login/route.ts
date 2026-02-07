import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, getSessionCookieConfig } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password richiesta' },
        { status: 400 }
      )
    }

    const accessPassword = process.env.ACCESS_PASSWORD
    if (!accessPassword) {
      console.error('ACCESS_PASSWORD environment variable is not set')
      return NextResponse.json(
        { error: 'Errore di configurazione del server' },
        { status: 500 }
      )
    }

    if (password !== accessPassword) {
      return NextResponse.json(
        { error: 'Password non valida' },
        { status: 401 }
      )
    }

    const token = await createSessionToken()
    const cookieConfig = getSessionCookieConfig(token)

    const response = NextResponse.json({ success: true })
    response.cookies.set(cookieConfig)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
