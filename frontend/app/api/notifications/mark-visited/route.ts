import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, getSessionUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic'

// POST - Mark current time as last visit
export async function POST() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    const user = await getSessionUser(token)
    if (!user?.email) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
    }

    // Update last_visit to now
    const { error: updateError } = await supabaseAdmin
      .from('allievi')
      .update({ last_visit: new Date().toISOString() })
      .eq('email', user.email)

    if (updateError) {
      console.error('[MARK_VISITED] Database error:', updateError)
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[MARK_VISITED] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'aggiornamento' },
      { status: 500 }
    )
  }
}
