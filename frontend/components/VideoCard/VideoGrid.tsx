import VideoCard from './VideoCard'
import { Video } from '@/types/video'

interface VideoGridProps {
  videos: Video[]
  isWatched: (videoId: string) => boolean
  onWatch: (videoId: string) => void
}

export default function VideoGrid({ videos, isWatched, onWatch }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <p className="text-netflix-text-muted italic py-8">
        Nessuna lezione in questo mese
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {videos.map(video => (
        <VideoCard
          key={video.id}
          video={video}
          isWatched={isWatched(video.id)}
          onWatch={onWatch}
        />
      ))}
    </div>
  )
}
