import { useEffect, useState } from 'react'
import { customerSession, sessionKey, type CustomerSession } from './session'

export function useCustomerSession() {
  const [session, setSession] = useState<CustomerSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    function sync() {
      clearTimeout(timeout)
      try {
        const current = customerSession.read()
        setSession(current)
        setError('')
        if (current) {
          // Recheck after expiration, browser sleep or a long-lived session.
          timeout = setTimeout(sync, Math.min(Date.parse(current.expiresAtUtc) - Date.now() + 1, 2147483647))
        }
      } catch {
        setSession(null)
        setError('Não foi possível consultar sua sessão. Permita o armazenamento nesta aba e tente novamente.')
      }
      setLoading(false)
    }
    function onStorage(event: StorageEvent) { if (event.key === sessionKey || event.key === null) sync() }
    const unsubscribe = customerSession.subscribe(sync)
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => {
      clearTimeout(timeout)
      unsubscribe()
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [attempt])

  return { customerId: session?.customerId ?? null, accessToken: session?.accessToken ?? null,
    loading, error, retry: () => setAttempt((current) => current + 1) }
}
