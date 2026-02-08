'use client'

import { useState, useEffect } from 'react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  // Mostra il bottone quando si scrolla > 500px
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 500) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className="
        fixed bottom-5 right-5 md:bottom-6 md:right-6
        w-14 h-14 md:w-12 md:h-12
        bg-aba-red hover:bg-aba-red-dark active:bg-aba-red-dark
        text-white
        rounded-full
        shadow-lg hover:shadow-xl active:shadow-md
        transition-all duration-200
        flex items-center justify-center
        z-50
        hover:scale-110 active:scale-95
        border border-white/10
      "
      aria-label="Torna su"
    >
      <svg
        className="w-7 h-7 md:w-6 md:h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  )
}
