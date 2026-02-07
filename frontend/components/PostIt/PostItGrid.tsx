import PostItCard from './PostItCard'

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

interface PostItGridProps {
  videos: Video[]
}

export default function PostItGrid({ videos }: PostItGridProps) {
  if (videos.length === 0) {
    return (
      <p className="text-gray-500 italic py-8">
        Nessuna lezione in questo mese
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
      {videos.map(video => (
        <PostItCard key={video.id} video={video} />
      ))}
    </div>
  )
}
