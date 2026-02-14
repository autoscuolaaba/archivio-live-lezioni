'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import SearchBar from '@/components/Header/SearchBar'
import NotificationBell from '@/components/Header/NotificationBell'
import UserAvatar from '@/components/Header/UserAvatar'

interface Video {
  id: string
  title: string
  watch_url: string
  year: number
  month: number
  published_at: string
}

interface HeaderProps {
  allVideos?: Video[]
}

export default function Header({ allVideos = [] }: HeaderProps) {
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user info
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.nome) {
          setUserName(data.nome)
        }
      })
      .catch(() => {
        // Silent fail
      })
  }, [])

  return (
    <header className="bg-netflix-dark border-b border-netflix-border/30">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="relative flex items-center justify-end gap-4">
          {/* Logo - centered */}
          <div className="absolute left-1/2 -translate-x-1/2 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="ABAflix"
              width={1200}
              height={630}
              className="h-10 md:h-14 w-auto object-contain"
              priority
            />
          </div>

          {/* Right section: Search, Notifications, Avatar */}
          <div className="flex items-center gap-3 md:gap-5 relative z-10">
            <SearchBar allVideos={allVideos} />
            <NotificationBell />
            <UserAvatar userName={userName} />
          </div>
        </div>
      </div>
    </header>
  )
}
