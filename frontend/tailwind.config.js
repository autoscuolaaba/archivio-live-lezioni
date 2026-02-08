/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand ABA (unchanged)
        'aba-red': '#D32F2F',
        'aba-red-dark': '#B71C1C',
        'aba-red-light': '#EF5350',
        // Netflix-style dark theme
        'netflix-black': '#141414',
        'netflix-dark': '#181818',
        'netflix-card': '#1F1F1F',
        'netflix-card-hover': '#2A2A2A',
        'netflix-surface': '#252525',
        'netflix-border': '#333333',
        // Text colors for dark theme
        'netflix-text': '#E5E5E5',
        'netflix-text-secondary': '#999999',
        'netflix-text-muted': '#666666',
        // Watched state
        'watched-green': '#46D369',
        // Legacy post-it (kept for login page)
        'postit-light': '#FFF8E1',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.6)',
        'glow-red': '0 0 20px rgba(211,47,47,0.3)',
        // Legacy (kept for login)
        'postit': '2px 2px 6px rgba(0,0,0,0.1), 4px 4px 12px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
