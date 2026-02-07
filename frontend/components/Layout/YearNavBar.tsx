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
      const headerOffset = 150 // Offset per sticky headers
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
    <nav className="bg-white border-b-2 border-gray-200 sticky top-[73px] z-40">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
          {years.map(year => (
            <button
              key={year}
              onClick={() => scrollToYear(year)}
              className={`
                px-5 py-2 font-poppins font-semibold text-sm rounded-lg
                transition-all duration-200 whitespace-nowrap
                ${activeYear === year
                  ? 'bg-aba-red text-white border-b-3 border-aba-red-dark'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  )
}
