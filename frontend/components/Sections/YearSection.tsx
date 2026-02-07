import MonthSection from './MonthSection'

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

interface YearData {
  year: number
  total: number
  months: MonthData[]
}

interface YearSectionProps {
  yearData: YearData
}

export default function YearSection({ yearData }: YearSectionProps) {
  return (
    <section id={`year-${yearData.year}`} className="mb-12">
      {/* Divisore anno */}
      <div className="border-t-4 border-aba-red pt-4 mb-8">
        <h2 className="text-3xl md:text-4xl font-poppins font-bold text-gray-dark">
          {yearData.year}
        </h2>
        <p className="text-gray-600 font-inter mt-1">
          {yearData.total} lezioni
        </p>
      </div>

      {/* Mesi */}
      <div className="space-y-12">
        {yearData.months.map(monthData => (
          <MonthSection key={`${yearData.year}-${monthData.month}`} monthData={monthData} />
        ))}
      </div>
    </section>
  )
}
