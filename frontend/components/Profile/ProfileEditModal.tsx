'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string | null
  currentAvatarUrl: string | null
  onAvatarUpdate: (newAvatarUrl: string | null) => void
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  userName,
  currentAvatarUrl,
  onAvatarUpdate,
}: ProfileEditModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync preview when modal opens or avatar changes
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentAvatarUrl)
      setSelectedFile(null)
      setError(null)
    }
  }, [isOpen, currentAvatarUrl])

  if (!isOpen) return null

  // Get initials for preview
  const getInitials = (name: string | null): string => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine valido')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'immagine deve essere inferiore a 5MB')
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('avatar', selectedFile)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'upload')
      }

      onAvatarUpdate(data.avatarUrl)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    setIsUploading(true)
    setError(null)

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Errore durante la rimozione')
      }

      setPreviewUrl(null)
      setSelectedFile(null)
      onAvatarUpdate(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-netflix-card border border-netflix-border rounded-lg shadow-card max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-netflix-border flex items-center justify-between">
            <h2 className="font-poppins font-semibold text-white text-xl">
              Modifica Profilo
            </h2>
            <button
              onClick={onClose}
              className="text-netflix-text-muted hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Avatar preview */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {previewUrl ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-aba-red shadow-lg">
                    <Image
                      src={previewUrl}
                      alt="Avatar"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-aba-red to-aba-red-dark flex items-center justify-center border-4 border-netflix-border shadow-lg">
                    <span className="font-poppins font-bold text-white text-4xl">
                      {getInitials(userName)}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-netflix-text-secondary text-sm font-inter text-center">
                {userName}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-lg px-4 py-3">
                <p className="text-red-200 font-inter text-sm">{error}</p>
              </div>
            )}

            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-3 bg-aba-red hover:bg-aba-red-dark text-white font-poppins font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedFile ? 'Scegli un\'altra immagine' : 'Carica foto profilo'}
              </button>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-poppins font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Caricamento...' : 'Salva foto'}
                </button>
              )}

              {currentAvatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="w-full py-3 bg-netflix-surface hover:bg-netflix-border text-white font-poppins font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Rimuovi foto (usa iniziali)
                </button>
              )}
            </div>

            <p className="text-netflix-text-muted text-xs font-inter text-center">
              Formati supportati: JPG, PNG, GIF. Max 5MB
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
