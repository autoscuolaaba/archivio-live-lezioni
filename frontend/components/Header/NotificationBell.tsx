'use client'

import { useState, useEffect } from 'react'

interface Notification {
  id: string
  title: string
  publishedAt: string
  watchUrl: string
  year: number
  month: number
}

const MONTH_NAMES: { [key: number]: string } = {
  1: 'Gennaio', 2: 'Febbraio', 3: 'Marzo', 4: 'Aprile',
  5: 'Maggio', 6: 'Giugno', 7: 'Luglio', 8: 'Agosto',
  9: 'Settembre', 10: 'Ottobre', 11: 'Novembre', 12: 'Dicembre'
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const hasNotifications = notificationCount > 0

  // Fetch notifications from API
  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setNotifications(data.notifications || [])
          setNotificationCount(data.count || 0)
        }
      })
      .catch(() => {
        // Silent fail
      })
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    window.open(notification.watchUrl, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = MONTH_NAMES[date.getMonth() + 1]
    return `${day} ${month}`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-netflix-surface transition-colors duration-200"
        aria-label="Notifiche"
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Notification badge */}
        {hasNotifications && (
          <span className="absolute -top-0.5 -right-0.5 bg-aba-red text-white text-[10px] font-poppins font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-netflix-dark">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
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
          <div className="absolute right-0 mt-2 w-80 bg-netflix-card border border-netflix-border rounded-lg shadow-card overflow-hidden z-50">
            <div className="p-4 border-b border-netflix-border">
              <h3 className="font-poppins font-semibold text-white text-base">
                Notifiche
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {hasNotifications ? (
                <div className="divide-y divide-netflix-border">
                  {notifications.map(notification => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full p-4 text-left hover:bg-netflix-surface transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <svg
                            className="w-5 h-5 text-aba-red"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-inter text-sm font-medium mb-1 line-clamp-2">
                            {notification.title}
                          </p>
                          <p className="text-netflix-text-muted text-xs">
                            {formatDate(notification.publishedAt)} • {MONTH_NAMES[notification.month]} {notification.year}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-netflix-text-muted font-inter text-sm">
                    Nessuna notifica
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
