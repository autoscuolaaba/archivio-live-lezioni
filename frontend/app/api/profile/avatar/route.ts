import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, getSessionUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

const BUCKET_NAME = 'avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// GET - Retrieve user avatar URL
export async function GET() {
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

    // Get avatar URL from database
    const { data: allievo } = await supabaseAdmin
      .from('allievi')
      .select('avatar_url')
      .eq('email', user.email)
      .single()

    return NextResponse.json({ avatarUrl: allievo?.avatar_url || null })
  } catch (error) {
    console.error('[AVATAR GET] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero dell\'avatar' },
      { status: 500 }
    )
  }
}

// POST - Upload new avatar
export async function POST(request: NextRequest) {
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

    // Get user ID from database
    const { data: allievo } = await supabaseAdmin
      .from('allievi')
      .select('id, avatar_url')
      .eq('email', user.email)
      .single()

    if (!allievo) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Il file deve essere un\'immagine' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Il file deve essere inferiore a 5MB' },
        { status: 400 }
      )
    }

    // Delete old avatar if exists
    if (allievo.avatar_url) {
      const oldFilePath = allievo.avatar_url.split('/').pop()
      if (oldFilePath) {
        await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .remove([`${allievo.id}/${oldFilePath}`])
      }
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${allievo.id}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[AVATAR UPLOAD] Storage error:', uploadError)
      return NextResponse.json(
        {
          error: 'Errore durante l\'upload dell\'immagine',
          details: uploadError.message,
          code: uploadError.name
        },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from('allievi')
      .update({ avatar_url: avatarUrl })
      .eq('id', allievo.id)

    if (updateError) {
      console.error('[AVATAR UPDATE] Database error:', updateError)
      return NextResponse.json(
        { error: 'Errore durante l\'aggiornamento del profilo' },
        { status: 500 }
      )
    }

    console.log(`[AVATAR] Avatar aggiornato per: ${user.email}`)

    return NextResponse.json({ avatarUrl })
  } catch (error) {
    console.error('[AVATAR POST] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante l\'upload dell\'avatar' },
      { status: 500 }
    )
  }
}

// DELETE - Remove avatar
export async function DELETE() {
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

    // Get user ID and avatar URL
    const { data: allievo } = await supabaseAdmin
      .from('allievi')
      .select('id, avatar_url')
      .eq('email', user.email)
      .single()

    if (!allievo) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Delete from storage if exists
    if (allievo.avatar_url) {
      const oldFilePath = allievo.avatar_url.split('/').pop()
      if (oldFilePath) {
        await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .remove([`${allievo.id}/${oldFilePath}`])
      }
    }

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from('allievi')
      .update({ avatar_url: null })
      .eq('id', allievo.id)

    if (updateError) {
      console.error('[AVATAR DELETE] Database error:', updateError)
      return NextResponse.json(
        { error: 'Errore durante la rimozione dell\'avatar' },
        { status: 500 }
      )
    }

    console.log(`[AVATAR] Avatar rimosso per: ${user.email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AVATAR DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante la rimozione dell\'avatar' },
      { status: 500 }
    )
  }
}
