/** @type {import('next').NextConfig} */
const nextConfig = {
  // Per deploy come static export (opzionale, commenta se usi server mode)
  // output: 'export',
  // basePath: '/lezioni-live',

  // Permetti immagini da YouTube
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
    // Se usi static export, decomment questa riga
    // unoptimized: true,
  },

  // Variabili ambiente pubbliche
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig
