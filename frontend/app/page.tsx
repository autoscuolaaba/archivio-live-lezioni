'use client'

import { useEffect, useState, useCallback } from 'react'
import Header from '@/components/Layout/Header'
import Footer from '@/components/Layout/Footer'
import YearNavBar from '@/components/Layout/YearNavBar'
import StatsBar from '@/components/Stats/StatsBar'
import YearSection from '@/components/Sections/YearSection'
import ScrollToTop from '@/components/UI/ScrollToTop'
import NewVideosNotification from '@/components/UI/NewVideosNotification'
import RecommendedForYou from '@/components/Recommended/RecommendedForYou'
import { useWatchedVideos } from '@/hooks/useWatchedVideos'
import { Video, MonthData, YearData, ApiResponse } from '@/types/video'

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 13) {
    const emojis = ['☀️', '🌅', '☕', '🌞', '🫶']
    return { text: 'Buongiorno', emoji: emojis[Math.floor(Math.random() * emojis.length)] }
  }
  if (hour >= 13 && hour < 18) {
    const emojis = ['📚', '💪', '🎯', '🚀', '✨']
    return { text: 'Buon pomeriggio', emoji: emojis[Math.floor(Math.random() * emojis.length)] }
  }
  const emojis = ['🌙', '🌟', '🦉', '✨', '💫']
  return { text: 'Buonasera', emoji: emojis[Math.floor(Math.random() * emojis.length)] }
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [greeting] = useState(() => getGreeting())

  // Watched videos hook
  const { watchedIds, isWatched, markAsWatched, watchedCount } = useWatchedVideos()

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      const response = await fetch('/data/videos_cache.json', {
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const jsonData = await response.json()

      if (jsonData.videos && !jsonData.years) {
        const grouped = groupVideosByYearMonth(jsonData.videos)
        jsonData.years = grouped
        jsonData.total_hours = calculateTotalHours(jsonData.videos)
      }

      setData(jsonData)
      setLastUpdated(jsonData.last_updated)
      setLoading(false)
      setError(null)
    } catch (err) {
      console.error('Errore fetch video:', err)
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto')
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    // Verifica autenticazione prima di caricare i dati
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          window.location.href = '/login'
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data) {
          if (data.nome) setUserName(data.nome)
          fetchData()
        }
      })
      .catch(() => {
        window.location.href = '/login'
      })
  }, [fetchData])

  useEffect(() => {
    const CHECK_INTERVAL = 5 * 60 * 1000

    const checkForUpdates = async () => {
      try {
        const response = await fetch('/data/videos_cache.json', {
          cache: 'no-store'
        })

        if (response.ok) {
          const jsonData = await response.json()
          if (lastUpdated && jsonData.last_updated !== lastUpdated) {
            console.log('🎉 Nuovi video rilevati!')
            window.dispatchEvent(new Event('newVideosAvailable'))
          }
        }
      } catch (err) {
        console.error('Errore check aggiornamenti:', err)
      }
    }

    const interval = setInterval(checkForUpdates, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [lastUpdated])

  const handleReload = () => {
    fetchData()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-netflix-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-aba-red mx-auto mb-4"></div>
          <p className="text-netflix-text-secondary font-inter">Caricamento lezioni...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-netflix-black">
        <div className="text-center max-w-md p-8">
          <h2 className="text-2xl font-poppins font-bold text-aba-red mb-4">
            Errore
          </h2>
          <p className="text-netflix-text-secondary mb-4">
            {error || 'Impossibile caricare i video'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-aba-red text-white px-6 py-2 rounded-lg hover:bg-aba-red-dark transition"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  const years = data.years || []
  const totalVideos = data.total_videos || 0
  const totalHours = data.total_hours || 0

  // Flatten all videos for recommendations
  const allVideos: Video[] = years.flatMap(year =>
    year.months.flatMap(month => month.videos)
  )

  return (
    <div className="min-h-screen bg-netflix-black">
      <div className="sticky top-0 z-50 bg-netflix-dark">
        <Header />
        <YearNavBar years={years.map(y => y.year)} />
      </div>

      {userName && (
        <div className="bg-netflix-dark/60 border-b border-netflix-border py-5 md:py-6">
          <div className="container mx-auto px-4 max-w-7xl text-center">
            <p className="text-netflix-text-secondary font-poppins text-xl md:text-2xl">
              {greeting.text}, <span className="font-bold text-white">{userName}</span>! {greeting.emoji}
            </p>
          </div>
        </div>
      )}

      <StatsBar
        totalVideos={totalVideos}
        totalHours={totalHours}
        watchedCount={watchedCount}
      />

      {/* Recommended section */}
      <div className="container mx-auto px-4 pt-8 max-w-7xl">
        <RecommendedForYou
          allVideos={allVideos}
          watchedIds={watchedIds}
          isWatched={isWatched}
          onWatch={markAsWatched}
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {years.length === 0 ? (
          <p className="text-center text-netflix-text-muted py-12">
            Nessuna lezione disponibile
          </p>
        ) : (
          years.map(yearData => (
            <YearSection
              key={yearData.year}
              yearData={yearData}
              isWatched={isWatched}
              onWatch={markAsWatched}
              watchedIds={watchedIds}
            />
          ))
        )}
      </main>

      <Footer />
      <ScrollToTop />
      <NewVideosNotification onReload={handleReload} />
    </div>
  )
}

function groupVideosByYearMonth(videos: Video[]): YearData[] {
  const MONTH_NAMES: { [key: number]: string } = {
    1: 'Gennaio', 2: 'Febbraio', 3: 'Marzo', 4: 'Aprile',
    5: 'Maggio', 6: 'Giugno', 7: 'Luglio', 8: 'Agosto',
    9: 'Settembre', 10: 'Ottobre', 11: 'Novembre', 12: 'Dicembre'
  }

  const grouped: { [year: number]: { [month: number]: Video[] } } = {}

  videos.forEach(video => {
    if (!grouped[video.year]) grouped[video.year] = {}
    if (!grouped[video.year][video.month]) grouped[video.year][video.month] = []
    grouped[video.year][video.month].push(video)
  })

  const years: YearData[] = Object.keys(grouped)
    .map(y => parseInt(y))
    .sort((a, b) => b - a)
    .map(year => {
      const months: MonthData[] = Object.keys(grouped[year])
        .map(m => parseInt(m))
        .sort((a, b) => b - a)
        .map(month => ({
          month,
          month_name: MONTH_NAMES[month],
          total: grouped[year][month].length,
          videos: grouped[year][month].sort((a, b) =>
            b.published_at.localeCompare(a.published_at)
          )
        }))

      return {
        year,
        total: months.reduce((sum, m) => sum + m.total, 0),
        months
      }
    })

  return years
}

function calculateTotalHours(videos: Video[]): number {
  const totalSeconds = videos.reduce((sum, v) => sum + v.duration_seconds, 0)
  return Math.floor(totalSeconds / 3600)
}
