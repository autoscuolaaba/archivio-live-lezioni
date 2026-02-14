'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import ProfileEditModal from '@/components/Profile/ProfileEditModal'

interface UserAvatarProps {
  userName: string | null
}

export default function UserAvatar({ userName }: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    // Fetch avatar URL
    fetch('/api/profile/avatar')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.avatarUrl) {
          setAvatarUrl(data.avatarUrl)
        }
      })
      .catch(() => {
        // Silent fail
      })
  }, [])

  // Get initials from name
  const getInitials = (name: string | null): string => {
    if (!name) return '?'

    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }

    // First letter of first name + first letter of last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(userName)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  const handleAvatarUpdate = (newAvatarUrl: string | null) => {
    setAvatarUrl(newAvatarUrl)
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group"
          aria-label="Menu utente"
        >
          {/* Avatar circle */}
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-white transition-all duration-200 shadow-md">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={userName || 'Avatar'}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-aba-red to-aba-red-dark flex items-center justify-center">
                <span className="font-poppins font-bold text-white text-sm md:text-base">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Dropdown arrow */}
          <svg
            className={`absolute -bottom-1 -right-1 w-3 h-3 text-white transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown content */}
            <div className="absolute right-0 mt-2 w-56 bg-netflix-card border border-netflix-border rounded-lg shadow-card overflow-hidden z-50">
              {/* User info */}
              <div className="p-4 border-b border-netflix-border">
                <p className="font-poppins font-semibold text-white text-sm truncate">
                  {userName || 'Utente'}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-2">
                {/* Edit profile */}
                <button
                  className="w-full px-4 py-2.5 text-left hover:bg-netflix-surface transition-colors duration-200 flex items-center gap-3"
                  onClick={() => {
                    setIsOpen(false)
                    setIsModalOpen(true)
                  }}
                >
                  <svg
                    className="w-5 h-5 text-netflix-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-white font-inter text-sm">
                    Modifica Profilo
                  </span>
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-2.5 text-left hover:bg-netflix-surface transition-colors duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-5 h-5 text-netflix-text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="text-white font-inter text-sm">
                    {isLoggingOut ? 'Disconnessione...' : 'Esci'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userName={userName}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </>
  )
}
