import { NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_ID = 'UC18Pm8LKXwtK2uUSoif5RVw'

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface YouTubeSearchResponse {
  items?: Array<{
    id: {
      videoId: string
    }
    snippet: {
      title: string
      thumbnails: {
        high: {
          url: string
        }
      }
    }
  }>
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

export async function GET() {
  // Check if cache is valid
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    console.log('[LIVE STATUS] Returning cached result')
    return NextResponse.json(cache.data)
  }
  try {
    if (!YOUTUBE_API_KEY) {
      console.error('[LIVE STATUS] YouTube API key not configured')
      return NextResponse.json({ isLive: false })
    }

    // Search for live broadcasts on the channel
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('channelId', CHANNEL_ID)
    searchUrl.searchParams.set('eventType', 'live')
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', '1')
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY)

    const response = await fetch(searchUrl.toString(), {
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      console.error('[LIVE STATUS] YouTube API error:', response.status)
      return NextResponse.json({ isLive: false })
    }

    const data: YouTubeSearchResponse = await response.json()

    let result

    if (data.items && data.items.length > 0) {
      const liveVideo = data.items[0]
      console.log(`[LIVE STATUS] Live broadcast detected: ${liveVideo.snippet.title}`)

      result = {
        isLive: true,
        videoId: liveVideo.id.videoId,
        title: liveVideo.snippet.title,
        thumbnail: liveVideo.snippet.thumbnails.high.url,
      }
    } else {
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
