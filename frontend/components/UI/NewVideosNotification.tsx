'use client'

import { useState, useEffect } from 'react'

interface NewVideosNotificationProps {
  onReload: () => void
}

export default function NewVideosNotification({ onReload }: NewVideosNotificationProps) {
  const [showNotification, setShowNotification] = useState(false)

  const handleReload = () => {
    setShowNotification(false)
    onReload()
  }

  // Mostra notifica (chiamata dal parent)
  useEffect(() => {
    const handleNewVideos = () => setShowNotification(true)
    window.addEventListener('newVideosAvailable', handleNewVideos)
    return () => window.removeEventListener('newVideosAvailable', handleNewVideos)
  }, [])

  if (!showNotification) return null

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in">
      <div className="bg-aba-red text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-4 max-w-md">
        <div className="flex-1">
          <p className="font-poppins font-semibold mb-1">
            🎉 Nuove lezioni disponibili!
          </p>
          <p className="text-sm opacity-90">
            Sono stati aggiunti nuovi video. Clicca per ricaricare.
          </p>
        </div>
        <button
          onClick={handleReload}
          className="bg-white text-aba-red px-4 py-2 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          Ricarica
        </button>
        <button
          onClick={() => setShowNotification(false)}
          className="text-white opacity-70 hover:opacity-100 ml-2"
          aria-label="Chiudi"
        >
          ✕
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
