const attempts = new Map<string, { count: number; firstAttempt: number }>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minuti
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000 // 30 minuti

// Auto-pulizia delle entries scadute
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of attempts.entries()) {
    if (now - value.firstAttempt > WINDOW_MS) {
      attempts.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS)

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now()
  const record = attempts.get(ip)

  // Nessun tentativo precedente o finestra scaduta
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attempts.set(ip, { count: 1, firstAttempt: now })
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 }
  }

  // Dentro la finestra temporale
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.firstAttempt + WINDOW_MS - now) / 1000)
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds }
  }

  record.count++
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count }
}
