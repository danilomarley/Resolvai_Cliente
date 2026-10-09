import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useCustomerSession() {
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    let revision = 0
    setLoading(true)
    setError('')
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      revision += 1
      if (!active) return
      setCustomerId(session?.user.id ?? null)
      setLoading(false)
      setError('')
    })
    const requestRevision = revision
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active || requestRevision !== revision) return
      if (sessionError) {
        setCustomerId(null)
        setError('Não foi possível consultar sua sessão. Tente novamente.')
      } else setCustomerId(data.session?.user.id ?? null)
      setLoading(false)
    }).catch(() => {
      if (!active || requestRevision !== revision) return
      setCustomerId(null)
      setError('Não foi possível consultar sua sessão. Tente novamente.')
      setLoading(false)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [attempt])

  return { customerId, loading, error, retry: () => setAttempt((current) => current + 1) }
}
