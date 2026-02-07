interface StatsBarProps {
  totalVideos: number
  totalHours: number
  firstVideoDate: string
}

export default function StatsBar({ totalVideos, totalHours, firstVideoDate }: StatsBarProps) {
  return (
    <div className="bg-postit-light border-y border-gray-200 py-4">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 text-sm md:text-base">
          {/* Totale video */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">📺</span>
            <div>
              <span className="font-inter font-medium text-gray-dark">
                {totalVideos.toLocaleString('it-IT')}
              </span>
              <span className="text-gray-600 ml-1">lezioni</span>
            </div>
          </div>

          <div className="text-gray-400 hidden md:block">|</div>

          {/* Dal 2020 */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <span className="text-gray-600">
                Dal <span className="font-medium text-gray-dark">{firstVideoDate}</span>
              </span>
            </div>
          </div>

          <div className="text-gray-400 hidden md:block">|</div>

          {/* Ore totali */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏱️</span>
            <div>
              <span className="font-inter font-medium text-gray-dark">
                ~{totalHours.toLocaleString('it-IT')} ore
              </span>
              <span className="text-gray-600 ml-1">di lezione</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
