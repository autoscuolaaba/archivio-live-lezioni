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

export async function GET() {
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

    if (data.items && data.items.length > 0) {
      const liveVideo = data.items[0]
      console.log(`[LIVE STATUS] Live broadcast detected: ${liveVideo.snippet.title}`)

      return NextResponse.json({
        isLive: true,
        videoId: liveVideo.id.videoId,
        title: liveVideo.snippet.title,
        thumbnail: liveVideo.snippet.thumbnails.high.url,
      })
    }

    return NextResponse.json({ isLive: false })
  } catch (error) {
    console.error('[LIVE STATUS] Error:', error)
    return NextResponse.json({ isLive: false })
  }
}
