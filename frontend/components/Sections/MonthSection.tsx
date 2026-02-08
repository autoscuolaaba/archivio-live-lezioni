import VideoGrid from '../VideoCard/VideoGrid'
import { MonthData } from '@/types/video'

interface MonthSectionProps {
  monthData: MonthData
  isWatched: (videoId: string) => boolean
  onWatch: (videoId: string) => void
  watchedIds: Set<string>
}

export default function MonthSection({ monthData, isWatched, onWatch, watchedIds }: MonthSectionProps) {
  const watchedInMonth = monthData.videos.filter(v => watchedIds.has(v.id)).length

  return (
    <div>
      {/* Month header */}
      <div className="flex items-baseline justify-between mb-3 md:mb-4">
        <h3 className="text-lg md:text-2xl font-poppins font-semibold text-netflix-text">
          {monthData.month_name}{' '}
          <span className="text-netflix-text-muted font-normal text-sm md:text-lg">
            ({monthData.total} {monthData.total === 1 ? 'lezione' : 'lezioni'})
          </span>
        </h3>

        {/* Watched counter for this month */}
        {watchedInMonth > 0 && (
          <span className="text-watched-green text-xs md:text-sm font-inter flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {watchedInMonth}/{monthData.total}
          </span>
        )}
      </div>

      {/* Video grid */}
      <VideoGrid
        videos={monthData.videos}
        isWatched={isWatched}
        onWatch={onWatch}
      />
    </div>
  )
}
