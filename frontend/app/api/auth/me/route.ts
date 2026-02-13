import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, getSessionUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

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

  // Verifica che l'utente esista ancora nel database
  const { data: allievo } = await supabaseAdmin
    .from('allievi')
    .select('id, nome, password_hash')
    .eq('email', user.email)
    .single()

  if (!allievo) {
    return NextResponse.json({ nome: null }, { status: 401 })
  }

  // Invalida sessioni senza pwv (token vecchi) o con password cambiata
  if (!user.pwv || !allievo.password_hash || user.pwv !== allievo.password_hash.slice(-8)) {
    return NextResponse.json({ nome: null }, { status: 401 })
  }

  return NextResponse.json({ nome: allievo.nome })
}
