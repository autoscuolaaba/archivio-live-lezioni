import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, getSessionUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface Video {
  id: string
  title: string
  published_at: string
  watch_url: string
  year: number
  month: number
}

interface VideoCacheData {
  videos: Video[]
  last_updated: string
}

const MAX_NOTIFICATIONS = 10

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

    // Get last_visit from database
    const { data: allievo, error: dbError } = await supabaseAdmin
      .from('allievi')
      .select('last_visit')
      .eq('email', user.email)
      .single()

    if (dbError || !allievo) {
      console.error('[NOTIFICATIONS] Error fetching user:', dbError)
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // If last_visit is null, return empty array (first visit)
    if (!allievo.last_visit) {
      return NextResponse.json({ notifications: [], count: 0 })
    }

    // Load videos from cache
    const videoCachePath = join(process.cwd(), 'public', 'data', 'videos_cache.json')
    const fileContent = await readFile(videoCachePath, 'utf-8')
    const cacheData: VideoCacheData = JSON.parse(fileContent)

    const lastVisit = new Date(allievo.last_visit)

    // Filter videos published after last_visit
    const newVideos = cacheData.videos
      .filter(video => {
        const publishedAt = new Date(video.published_at)
        return publishedAt > lastVisit
      })
      .sort((a, b) => b.published_at.localeCompare(a.published_at))
      .slice(0, MAX_NOTIFICATIONS)
      .map(video => ({
        id: video.id,
        title: video.title,
        publishedAt: video.published_at,
        watchUrl: video.watch_url,
        year: video.year,
        month: video.month,
      }))

    return NextResponse.json({
      notifications: newVideos,
      count: newVideos.length,
    })
  } catch (error) {
    console.error('[NOTIFICATIONS] Error:', error)
    return NextResponse.json(
      { error: 'Errore durante il recupero delle notifiche' },
      { status: 500 }
    )
  }
}
