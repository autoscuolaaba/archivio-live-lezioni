import PostItGrid from '../PostIt/PostItGrid'

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

interface MonthData {
  month: number
  month_name: string
  total: number
  videos: Video[]
}

interface MonthSectionProps {
  monthData: MonthData
}

export default function MonthSection({ monthData }: MonthSectionProps) {
  return (
    <div>
      {/* Header mese */}
      <h3 className="text-xl md:text-2xl font-poppins font-semibold text-gray-dark mb-4">
        {monthData.month_name}{' '}
        <span className="text-gray-500 font-normal text-lg">
          ({monthData.total} {monthData.total === 1 ? 'lezione' : 'lezioni'})
        </span>
      </h3>

      {/* Grid post-it */}
      <PostItGrid videos={monthData.videos} />
    </div>
  )
}
