'use client'

import { useState, useEffect } from 'react'

interface YearNavBarProps {
  years: number[]
}

export default function YearNavBar({ years }: YearNavBarProps) {
  const [activeYear, setActiveYear] = useState<number | null>(null)

  const scrollToYear = (year: number) => {
    const element = document.getElementById(`year-${year}`)
    if (element) {
      const headerOffset = 160 // Offset per header + navbar sticky (80px mobile, 112px desktop + navbar)
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      setActiveYear(year)
    }
  }

  // Detect quale anno è visibile durante scroll
  useEffect(() => {
    const handleScroll = () => {
      const yearElements = years.map(year => ({
        year,
        element: document.getElementById(`year-${year}`)
      }))

      for (const { year, element } of yearElements) {
        if (!element) continue

        const rect = element.getBoundingClientRect()
        if (rect.top <= 200 && rect.bottom >= 200) {
          setActiveYear(year)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [years])

  if (years.length === 0) return null

  return (
    <nav className="bg-netflix-dark border-b border-netflix-border sticky top-[88px] md:top-[136px] z-40">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Description */}
        <div className="pt-3 pb-3">
          <p className="text-xs text-netflix-text-muted font-inter text-center">
            Seleziona un anno per navigare rapidamente alle lezioni
          </p>
        </div>

        {/* Year buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {years.map(year => (
            <button
              key={year}
              onClick={() => scrollToYear(year)}
              className={`
                px-6 py-2
                font-poppins font-semibold text-sm
                rounded-md
                transition-all duration-200 whitespace-nowrap
                min-w-[72px]
                ${activeYear === year
                  ? 'bg-aba-red text-white shadow-lg hover:bg-aba-red-dark'
                  : 'bg-netflix-surface text-netflix-text-secondary hover:text-white hover:bg-netflix-card'
                }
              `}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
