import { NextResponse } from 'next/server'

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface YouTubeTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface YouTubeLiveBroadcast {
  id: string
  snippet: {
    title: string
    thumbnails: {
      high: {
        url: string
      }
    }
  }
}

interface YouTubeLiveBroadcastsResponse {
  items?: YouTubeLiveBroadcast[]
}

interface LiveStatusCache {
  data: {
    isLive: boolean
    videoId?: string
    title?: string
    thumbnail?: string
  }
  timestamp: number
}

// Server-side cache (in-memory)
let cache: LiveStatusCache | null = null
const CACHE_TTL = 60 * 1000 // 60 seconds

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID!,
        client_secret: YOUTUBE_CLIENT_SECRET!,
        refresh_token: YOUTUBE_REFRESH_TOKEN!,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      console.error('[LIVE STATUS] Failed to refresh token:', response.status)
      return null
    }

    const data: YouTubeTokenResponse = await response.json()
    return data.access_token
  } catch (error) {
    console.error('[LIVE STATUS] Error refreshing token:', error)
    return null
  }
}

export async function GET() {
  // Check if cache is valid
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    console.log('[LIVE STATUS] Returning cached result')
    return NextResponse.json(cache.data)
  }

  try {
    if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
      console.error('[LIVE STATUS] YouTube OAuth credentials not configured')
      return NextResponse.json({ isLive: false })
    }

    // Get fresh access token
    const accessToken = await refreshAccessToken()
    if (!accessToken) {
      console.error('[LIVE STATUS] Failed to obtain access token')
      return NextResponse.json({ isLive: false })
    }

    // Check for active live broadcasts using liveBroadcasts.list
    // This works with private/unlisted/public streams
    const broadcastsUrl = new URL('https://www.googleapis.com/youtube/v3/liveBroadcasts')
    broadcastsUrl.searchParams.set('part', 'snippet')
    broadcastsUrl.searchParams.set('broadcastStatus', 'active')
    broadcastsUrl.searchParams.set('maxResults', '1')

    const response = await fetch(broadcastsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      console.error('[LIVE STATUS] YouTube API error:', response.status)
      const errorText = await response.text()
      console.error('[LIVE STATUS] Error details:', errorText)
      return NextResponse.json({ isLive: false })
    }

    const data: YouTubeLiveBroadcastsResponse = await response.json()

    let result

    if (data.items && data.items.length > 0) {
      const liveBroadcast = data.items[0]
      console.log(`[LIVE STATUS] Live broadcast detected: ${liveBroadcast.snippet.title}`)

      result = {
        isLive: true,
        videoId: liveBroadcast.id,
        title: liveBroadcast.snippet.title,
        thumbnail: liveBroadcast.snippet.thumbnails.high.url,
      }
    } else {
      console.log('[LIVE STATUS] No active broadcasts found')
      result = { isLive: false }
    }

    // Update cache
    cache = {
      data: result,
      timestamp: Date.now(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[LIVE STATUS] Error:', error)

    // On error, return cached data if available, otherwise return false
    if (cache) {
      console.log('[LIVE STATUS] Error, returning stale cache')
      return NextResponse.json(cache.data)
    }

    return NextResponse.json({ isLive: false })
  }
}
