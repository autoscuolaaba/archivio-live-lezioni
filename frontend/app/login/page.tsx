'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Password non valida')
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
              src="/logo-abatflix.png"
              alt="ABAtflix - Il vostro Netflix per la Scuola Guida"
              width={1200}
              height={630}
              className="h-32 md:h-40 w-auto object-contain mx-auto"
              priority
            />
          </div>
          <p className="text-netflix-text-muted font-inter text-xs">
            Inserisci la password per accedere
          </p>
        </div>

        {/* Form card */}
        <div className="bg-netflix-card rounded-lg shadow-card border border-netflix-border p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Inserisci la password"
                required
                autoFocus
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
              <div className="bg-aba-red/10 border border-aba-red/30 text-aba-red-light px-4 py-3 rounded-lg text-sm font-inter">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
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
          <p className="text-center text-xs text-aba-red-light font-inter">
            ⚠️ La divulgazione della password è severamente vietata
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
