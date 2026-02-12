import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, getSessionUser } from '@/lib/auth'

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ nome: null }, { status: 401 })
  }

  const user = await getSessionUser(token)

  if (!user) {
    return NextResponse.json({ nome: null }, { status: 401 })
  }

  return NextResponse.json({ nome: user.nome })
}
