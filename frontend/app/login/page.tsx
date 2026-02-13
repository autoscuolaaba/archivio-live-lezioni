'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  // Se l'utente è già autenticato, redirect alla home
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          router.push('/')
        } else {
          setCheckingAuth(false)
        }
      })
      .catch(() => {
        setCheckingAuth(false)
      })
  }, [router])

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-netflix-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aba-red"></div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Credenziali non valide')
        setPassword('')
      }
    } catch {
      setError('Errore di connessione. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image
              src="/logo.png"
              alt="ABAflix"
              width={1200}
              height={630}
              className="h-24 md:h-32 w-auto object-contain mx-auto"
              priority
            />
          </div>
          <p className="text-netflix-text-muted font-inter text-sm">
            Usa le stesse credenziali della tua Area Riservata
          </p>
        </div>

        {/* Form card */}
        <div className="bg-netflix-card rounded-lg shadow-card border border-netflix-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-inter font-medium text-netflix-text mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email"
                required
                autoFocus
                autoComplete="email"
                disabled={loading}
                className="
                  w-full px-4 py-3
                  bg-netflix-surface border border-netflix-border rounded-lg
                  font-inter text-white
                  placeholder:text-netflix-text-muted
                  focus:outline-none focus:ring-2 focus:ring-aba-red focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-inter font-medium text-netflix-text mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="La tua password"
                required
                autoComplete="current-password"
                disabled={loading}
                className="
                  w-full px-4 py-3
                  bg-netflix-surface border border-netflix-border rounded-lg
                  font-inter text-white
                  placeholder:text-netflix-text-muted
                  focus:outline-none focus:ring-2 focus:ring-aba-red focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              />
            </div>

            {error && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl px-5 py-4 text-center">
                <span className="text-2xl block mb-2">⚠️</span>
                <p className="text-amber-200 font-inter text-sm font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="
                w-full py-3
                bg-aba-red hover:bg-aba-red-dark active:bg-aba-red-dark
                text-white font-poppins font-semibold
                rounded-lg
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:shadow-md active:scale-[0.98]
              "
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Accesso in corso...
                </span>
              ) : (
                'Accedi'
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-6 space-y-3">
          <p className="text-center text-sm text-netflix-text-secondary font-inter font-medium">
            🔒 Accesso riservato agli allievi di Autoscuola ABA
          </p>
          <div className="text-center text-xs text-netflix-text-muted font-inter">
            <p>&copy; {new Date().getFullYear()} Autoscuola ABA - Tutti i diritti riservati</p>
            <p className="mt-1">Bassano del Grappa &bull; Cartigliano</p>
          </div>
        </div>
      </div>
    </div>
  )
}
