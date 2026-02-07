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
    <div className="min-h-screen bg-postit-light flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo e titolo */}
        <div className="text-center mb-8">
          <Image
            src="/logo-aba.png"
            alt="Autoscuola ABA Logo"
            width={280}
            height={168}
            className="h-20 w-auto object-contain mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-poppins font-bold text-gray-dark">
            Archivio Lezioni Teoria
          </h1>
          <p className="text-gray-600 font-inter text-sm mt-2">
            Inserisci la password per accedere
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-lg shadow-postit p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-inter font-medium text-gray-700 mb-1.5"
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
                  border border-gray-300 rounded-lg
                  font-inter text-gray-900
                  placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-aba-red focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-aba-red px-4 py-3 rounded-lg text-sm font-inter">
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

        <p className="text-center text-xs text-gray-400 font-inter mt-6">
          Accesso riservato agli allievi di Autoscuola ABA
        </p>
      </div>
    </div>
  )
}
