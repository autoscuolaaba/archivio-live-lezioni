'use client'

interface Video {
  id: string
  title: string
  published_at: string
  year: number
  month: number
  duration_seconds: number
  duration_formatted: string
  thumbnail_url: string
  watch_url: string
}

interface PostItCardProps {
  video: Video
}

// Colori post-it (5 varianti)
const POSTIT_COLORS = [
  'bg-postit-yellow-1',
  'bg-postit-yellow-2',
  'bg-postit-yellow-3',
  'bg-postit-yellow-4',
  'bg-postit-yellow-5',
]

// Funzione hash deterministico per assegnare colore e rotazione
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export default function PostItCard({ video }: PostItCardProps) {
  // Assegna colore deterministicamente basato su ID
  const colorIndex = hashString(video.id) % POSTIT_COLORS.length
  const bgColor = POSTIT_COLORS[colorIndex]

  // Assegna rotazione deterministicamente (-3° a +3°)
  const rotation = (hashString(video.id) % 7) - 3 // Range: -3 a +3

  const handleClick = () => {
    window.open(video.watch_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <article
      onClick={handleClick}
      className={`
        ${bgColor}
        relative
        rounded-sm
        shadow-postit
        cursor-pointer
        transition-all duration-200
        overflow-hidden
        group
      `}
      style={{
        transform: `rotate(${rotation}deg)`,
        minHeight: '260px',
      }}
    >
      {/* Hover effect: raddrizza e solleva */}
      <div className="group-hover:scale-105 group-hover:shadow-postit-hover transition-all duration-200">
        <div
          className="relative"
          style={{
            transform: 'translateZ(0)', // GPU acceleration
          }}
        >
          {/* Thumbnail */}
          <div className="relative w-full aspect-video bg-gray-200 rounded-t-sm overflow-hidden">
            <img
              src={video.thumbnail_url}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback immagine se thumbnail non carica
                const target = e.target as HTMLImageElement
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%23ddd" width="320" height="180"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-family="Arial"%3EVideo%3C/text%3E%3C/svg%3E'
              }}
            />

            {/* Overlay scuro al hover */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
          </div>

          {/* Contenuto */}
          <div className="p-4 flex flex-col justify-between" style={{ minHeight: '120px' }}>
            {/* Titolo */}
            <h4 className="font-inter font-medium text-sm leading-tight text-gray-900 mb-2 line-clamp-2">
              {video.title}
            </h4>

            {/* Durata */}
            <div className="flex items-center gap-1.5 text-gray-600 text-xs mt-auto">
              <span className="text-base">🕐</span>
              <span className="font-inter">{video.duration_formatted}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Effetto angolino piegato (opzionale) */}
      <div
        className="absolute top-0 right-0 w-0 h-0 border-t-[16px] border-r-[16px] opacity-30"
        style={{
          borderTopColor: 'transparent',
          borderRightColor: '#f5f5f5',
        }}
      />

      {/* Reset rotazione al hover */}
      <style jsx>{`
        article:hover {
          transform: rotate(0deg) !important;
        }
      `}</style>
    </article>
  )
}
