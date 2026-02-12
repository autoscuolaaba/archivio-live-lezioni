interface StatsBarProps {
  totalVideos: number
  totalHours: number
  watchedCount: number
}

export default function StatsBar({ totalVideos, totalHours, watchedCount }: StatsBarProps) {
  const watchedPercentage = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0

  return (
    <div className="bg-netflix-dark/80 border-y border-netflix-border py-4 md:py-3">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 text-sm md:text-base">
          {/* Total videos */}
          <div className="text-center">
            <div className="font-inter font-bold text-white text-2xl md:text-3xl">
              {totalVideos.toLocaleString('it-IT')}
            </div>
            <div className="text-netflix-text-secondary text-xs md:text-sm mt-0.5">lezioni</div>
          </div>

          <div className="text-netflix-border/30 hidden md:block text-2xl">|</div>

          {/* Total hours */}
          <div className="text-center">
            <div className="font-inter font-bold text-white text-2xl md:text-3xl">
              ~{totalHours.toLocaleString('it-IT')}
            </div>
            <div className="text-netflix-text-secondary text-xs md:text-sm mt-0.5">ore totali</div>
          </div>

          {/* Watched progress */}
          {watchedCount > 0 && (
            <>
              <div className="text-netflix-border/30 hidden md:block text-2xl">|</div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <svg className="w-5 h-5 text-watched-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-inter font-bold text-watched-green text-2xl md:text-3xl">
                    {watchedCount}
                  </span>
                </div>
                <div className="text-netflix-text-secondary text-xs md:text-sm mt-0.5">
                  viste ({watchedPercentage}%)
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
