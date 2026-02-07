/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colori brand ABA
        'aba-red': '#D32F2F',
        'aba-red-dark': '#B71C1C',
        // Post-it colors
        'postit': '#FFEB3B',
        'postit-hover': '#FDD835',
        'postit-light': '#FFF8E1',
        'postit-yellow-1': '#FFEB3B',
        'postit-yellow-2': '#FFF176',
        'postit-yellow-3': '#FFE082',
        'postit-yellow-4': '#FFECB3',
        'postit-yellow-5': '#FFF9C4',
        // Grigi
        'gray-dark': '#2D2D2D',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'postit': '2px 2px 6px rgba(0,0,0,0.1), 4px 4px 12px rgba(0,0,0,0.05)',
        'postit-hover': '4px 4px 12px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
