'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'aba-watched-videos'

export interface UseWatchedVideosReturn {
  watchedIds: Set<string>
  isWatched: (videoId: string) => boolean
  markAsWatched: (videoId: string) => void
  unmarkAsWatched: (videoId: string) => void
  toggleWatched: (videoId: string) => void
  clearAll: () => void
  watchedCount: number
}

export function useWatchedVideos(): UseWatchedVideosReturn {
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: string[] = JSON.parse(stored)
        setWatchedIds(new Set(parsed))
      }
    } catch (err) {
      console.error('Error reading watched videos from localStorage:', err)
    }
    setIsInitialized(true)
  }, [])

  // Persist to localStorage whenever watchedIds changes
  useEffect(() => {
    if (!isInitialized) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...watchedIds]))
    } catch (err) {
      console.error('Error saving watched videos to localStorage:', err)
    }
  }, [watchedIds, isInitialized])

  const isWatched = useCallback(
    (videoId: string) => watchedIds.has(videoId),
    [watchedIds]
  )

  const markAsWatched = useCallback((videoId: string) => {
    setWatchedIds(prev => {
      const next = new Set(prev)
      next.add(videoId)
      return next
    })
  }, [])

  const unmarkAsWatched = useCallback((videoId: string) => {
    setWatchedIds(prev => {
      const next = new Set(prev)
      next.delete(videoId)
      return next
    })
  }, [])

  const toggleWatched = useCallback((videoId: string) => {
    setWatchedIds(prev => {
      const next = new Set(prev)
      if (next.has(videoId)) {
        next.delete(videoId)
      } else {
        next.add(videoId)
      }
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setWatchedIds(new Set())
  }, [])

  return {
    watchedIds,
    isWatched,
    markAsWatched,
    unmarkAsWatched,
    toggleWatched,
    clearAll,
    watchedCount: watchedIds.size,
  }
}
