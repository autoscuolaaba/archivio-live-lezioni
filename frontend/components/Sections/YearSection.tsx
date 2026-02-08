import MonthSection from './MonthSection'
import { YearData } from '@/types/video'

interface YearSectionProps {
  yearData: YearData
  isWatched: (videoId: string) => boolean
  onWatch: (videoId: string) => void
  watchedIds: Set<string>
}

export default function YearSection({ yearData, isWatched, onWatch, watchedIds }: YearSectionProps) {
  // Count watched videos in this year
  const watchedInYear = yearData.months.reduce((sum, month) => {
    return sum + month.videos.filter(v => watchedIds.has(v.id)).length
  }, 0)

  return (
    <section id={`year-${yearData.year}`} className="mb-10 md:mb-12">
      {/* Year divider */}
      <div className="border-t-2 border-aba-red pt-3 md:pt-4 mb-6 md:mb-8">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-2xl md:text-4xl font-poppins font-bold text-white">
              {yearData.year}
            </h2>
            <p className="text-netflix-text-secondary font-inter mt-1 text-sm md:text-base">
              {yearData.total} lezioni
            </p>
          </div>
          {/* Watched counter for this year */}
          {watchedInYear > 0 && (
            <div className="flex items-center gap-1.5 text-watched-green text-sm font-inter">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{watchedInYear} di {yearData.total} viste</span>
            </div>
          )}
        </div>
      </div>

      {/* Months */}
      <div className="space-y-8 md:space-y-12">
        {yearData.months.map(monthData => (
          <MonthSection
            key={`${yearData.year}-${monthData.month}`}
            monthData={monthData}
            isWatched={isWatched}
            onWatch={onWatch}
            watchedIds={watchedIds}
          />
        ))}
      </div>
    </section>
  )
}
