import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accedi - Lezioni Live Autoscuola ABA',
  description: 'Accedi con le tue credenziali all\'archivio lezioni',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
