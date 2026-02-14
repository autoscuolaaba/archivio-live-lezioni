'use client'

import { useState, useEffect, useRef } from 'react'

interface Video {
  id: string
  title: string
  watch_url: string
  year: number
  month: number
  published_at: string
}

interface SearchBarProps {
  allVideos: Video[]
}

const MONTH_NAMES: { [key: number]: string } = {
  1: 'Gennaio', 2: 'Febbraio', 3: 'Marzo', 4: 'Aprile',
  5: 'Maggio', 6: 'Giugno', 7: 'Luglio', 8: 'Agosto',
  9: 'Settembre', 10: 'Ottobre', 11: 'Novembre', 12: 'Dicembre'
}

export default function SearchBar({ allVideos }: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<Video[]>([])
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allVideos
      .filter(video => {
        const titleMatch = video.title.toLowerCase().includes(query)
        const yearMatch = video.year.toString().includes(query)
        const monthMatch = MONTH_NAMES[video.month].toLowerCase().includes(query)
        return titleMatch || yearMatch || monthMatch
      })
      .slice(0, 8)

    setResults(filtered)
    setShowResults(filtered.length > 0)
  }, [searchQuery, allVideos])

  // Close everything when clicking outside the container
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleVideoClick = (video: Video) => {
    window.open(video.watch_url, '_blank', 'noopener,noreferrer')
    setSearchQuery('')
    setShowResults(false)
    setIsOpen(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (results.length > 0) {
      handleVideoClick(results[0])
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {!isOpen ? (
        /* Search icon button */
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-full hover:bg-netflix-surface transition-colors duration-200"
          aria-label="Cerca"
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      ) : (
        /* Search input */
        <div className="relative">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca lezioni..."
                autoFocus
                className="
                  w-48 md:w-64 pl-10 pr-4 py-2
                  bg-netflix-surface border border-netflix-border
                  rounded-md
                  text-white placeholder:text-netflix-text-muted
                  font-inter text-sm
                  focus:outline-none focus:ring-2 focus:ring-aba-red focus:border-transparent
                  transition-all duration-200
                "
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-netflix-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Results dropdown */}
          {showResults && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-netflix-card border border-netflix-border rounded-lg shadow-card overflow-hidden z-50 max-h-96 overflow-y-auto">
              {results.map(video => (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className="w-full px-4 py-3 text-left hover:bg-netflix-surface transition-colors duration-200 border-b border-netflix-border last:border-b-0"
                >
                  <p className="text-white font-inter text-sm line-clamp-2 mb-1">
                    {video.title}
                  </p>
                  <p className="text-netflix-text-muted text-xs font-inter">
                    {MONTH_NAMES[video.month]} {video.year}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
