import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lezioni Live - Autoscuola ABA',
  description: 'Tutte le lezioni live di teoria patente dal 2020 ad oggi',
  keywords: 'autoscuola, patente, lezioni, teoria, youtube, bassano, cartigliano',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
