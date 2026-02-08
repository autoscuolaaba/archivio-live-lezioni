'use client'

import { Video } from '@/types/video'

interface VideoCardProps {
  video: Video
  isWatched: boolean
  onWatch: (videoId: string) => void
}

export default function VideoCard({ video, isWatched, onWatch }: VideoCardProps) {
  const handleClick = () => {
    onWatch(video.id)
    window.open(video.watch_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <article
      onClick={handleClick}
      className={`
        relative rounded-md overflow-hidden cursor-pointer
        bg-netflix-card
        transition-all duration-300 ease-out
        group
        hover:scale-105 hover:z-10 hover:shadow-card-hover
        active:scale-100
        ${isWatched ? 'ring-1 ring-netflix-border' : ''}
      `}
    >
      {/* Thumbnail container */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="relative w-full aspect-video overflow-hidden bg-netflix-surface">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          loading="lazy"
          className={`
            absolute inset-0 w-full h-full object-cover
            transition-all duration-300
            ${isWatched ? 'opacity-50 saturate-50' : 'opacity-100'}
            group-hover:opacity-100 group-hover:saturate-100
          `}
        />

        {/* Dark gradient overlay */}
        <div className="
          absolute inset-0
          bg-gradient-to-t from-black/80 via-transparent to-transparent
          opacity-60 group-hover:opacity-80
          transition-opacity duration-300
        " />

        {/* Play button overlay */}
        <div className="
          absolute inset-0 flex items-center justify-center
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        ">
          <div className="
            w-12 h-12 md:w-14 md:h-14
            bg-white/90 rounded-full
            flex items-center justify-center
            shadow-lg
            transform group-hover:scale-100 scale-75
            transition-transform duration-300
          ">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-netflix-black ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        <span className="
          absolute bottom-2 right-2
          bg-black/80 text-white
          text-xs font-inter font-medium
          px-1.5 py-0.5 rounded
        ">
          {video.duration_formatted}
        </span>

        {/* VISTA badge */}
        {isWatched && (
          <div className="
            absolute top-2 right-2
            flex items-center gap-1
            bg-watched-green/90 text-white
            text-[10px] font-inter font-semibold uppercase tracking-wider
            px-2 py-0.5 rounded-sm
          ">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Vista
          </div>
        )}

        {/* Watched progress bar */}
        {isWatched && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-watched-green" />
        )}
      </div>

      {/* Text content */}
      <div className="p-3">
        <h4 className={`
          font-inter text-sm leading-snug line-clamp-2
          transition-colors duration-200
          ${isWatched
            ? 'text-netflix-text-muted group-hover:text-netflix-text'
            : 'text-netflix-text group-hover:text-white'
          }
        `}>
          {video.title}
        </h4>
      </div>
    </article>
  )
}
