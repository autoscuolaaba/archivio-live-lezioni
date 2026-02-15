'use client'

import { useState, useEffect } from 'react'

interface LiveStatus {
  isLive: boolean
  videoId?: string
  title?: string
  thumbnail?: string
}

export default function LiveBanner() {
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ isLive: false })
  const [showPlayer, setShowPlayer] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const res = await fetch('/api/live-status')
        if (res.ok) {
          const data = await res.json()
          setLiveStatus(data)
        }
      } catch (error) {
        console.error('[LIVE BANNER] Error checking live status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    // Check immediately
    checkLiveStatus()

    // Check every 30 seconds
    const interval = setInterval(checkLiveStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  // Mark live video as watched when user opens player
  const handleOpenPlayer = async () => {
    setShowPlayer(true)

    // Mark as watched in background
    if (liveStatus.videoId) {
      try {
        await fetch('/api/videos/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: liveStatus.videoId }),
        })
        console.log('[LIVE BANNER] Marked live video as watched:', liveStatus.videoId)
      } catch (error) {
        console.error('[LIVE BANNER] Error marking as watched:', error)
      }
    }
  }

  // Don't render anything while checking for the first time
  if (isChecking) return null

  // Don't render if no live
  if (!liveStatus.isLive) return null

  return (
    <>
      {/* Live Banner */}
      <div
        onClick={handleOpenPlayer}
        className="bg-red-600 hover:bg-red-700 cursor-pointer px-6 py-4 flex items-center justify-center gap-3 transition-all shadow-lg"
      >
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <span className="text-white font-poppins font-bold text-base sm:text-lg inline-flex items-center gap-2">
            {/* Pallino rosso con pulsante bianco sovrapposto */}
            <span className="relative inline-flex h-4 w-4 shrink-0">
              <span className="absolute inset-0 rounded-full bg-white/60 animate-ping"></span>
              <span className="relative inline-flex h-4 w-4 rounded-full bg-white"></span>
            </span>
            DIRETTA IN CORSO
          </span>
          <span className="text-white/90 font-inter text-sm sm:text-base">
            Clicca per guardare
          </span>
        </div>
      </div>

      {/* Live Player Modal */}
      {showPlayer && liveStatus.videoId && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPlayer(false)}
        >
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowPlayer(false)}
              className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors"
              aria-label="Chiudi player"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            {liveStatus.title && (
              <div className="mb-4">
                <h2 className="text-white font-poppins font-semibold text-lg sm:text-xl">
                  🔴 {liveStatus.title}
                </h2>
              </div>
            )}

            {/* YouTube iframe */}
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${liveStatus.videoId}?autoplay=1&rel=0&modestbranding=1`}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Live Stream"
              />
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-netflix-text-muted font-inter text-sm">
                Premi ESC o clicca fuori per chiudere
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
