export interface Video {
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

export interface MonthData {
  month: number
  month_name: string
  total: number
  videos: Video[]
}

export interface YearData {
  year: number
  total: number
  months: MonthData[]
}

export interface ApiResponse {
  last_updated: string
  total_videos: number
  total_hours?: number
  years?: YearData[]
  videos?: Video[]
}
