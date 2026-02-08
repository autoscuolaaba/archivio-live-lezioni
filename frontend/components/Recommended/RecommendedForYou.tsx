import { Video } from '@/types/video'

interface RecommendedForYouProps {
  allVideos: Video[]
  watchedIds: Set<string>
  isWatched: (videoId: string) => boolean
  onWatch: (videoId: string) => void
}

export default function RecommendedForYou({ allVideos, watchedIds, isWatched, onWatch }: RecommendedForYouProps) {
  // Filter unwatched videos, sort by date (most recent first), take top 10
  const recommendedVideos = allVideos
    .filter(video => !watchedIds.has(video.id))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 10)

  // Don't show if no recommendations
  if (recommendedVideos.length === 0) {
    return null
  }

  return (
    <section className="mb-10 md:mb-12">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-poppins font-bold text-white">
          Consigliate per Te
        </h2>
        <p className="text-netflix-text-secondary font-inter text-sm md:text-base mt-1">
          Le {recommendedVideos.length} lezioni più recenti che non hai ancora visto
        </p>
      </div>

      {/* Horizontal scrollable grid */}
      <div className="relative">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {recommendedVideos.map((video, index) => (
            <div
              key={video.id}
              className="flex-shrink-0 w-[280px] md:w-[320px] snap-start group cursor-pointer"
              onClick={() => onWatch(video.id)}
            >
              {/* Card */}
              <div className="relative bg-netflix-card rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-105 hover:z-10">
                {/* Rank badge - Netflix style */}
                <div className="absolute -left-3 bottom-0 z-20 h-full flex items-end pb-2">
                  <div className="relative">
                    {/* Multiple shadow layers for depth */}
                    <div className="absolute inset-0 text-[140px] md:text-[180px] font-poppins font-black text-black opacity-100 leading-none translate-x-[3px] translate-y-[3px]">
                      {index + 1}
                    </div>
                    <div className="absolute inset-0 text-[140px] md:text-[180px] font-poppins font-black text-black opacity-70 leading-none translate-x-[2px] translate-y-[2px]">
                      {index + 1}
                    </div>
                    {/* Main number with thick white stroke */}
                    <div className="relative text-[140px] md:text-[180px] font-poppins font-black leading-none" style={{
                      color: '#E5E5E5',
                      WebkitTextStroke: '6px #1A1A1A',
                      paintOrder: 'stroke fill'
                    }}>
                      {index + 1}
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="relative aspect-video bg-netflix-surface">
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 group-hover:opacity-70 transition-opacity duration-300" />

                  {/* Play button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 rounded-full p-3 md:p-4 transform group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 md:w-8 md:h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-inter font-semibold text-white">
                    {video.duration_formatted}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 md:p-4">
                  <h3 className="font-poppins font-semibold text-white text-sm md:text-base line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-netflix-text-muted text-xs font-inter">
                    {new Date(video.published_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
