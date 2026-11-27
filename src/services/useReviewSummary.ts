import { useEffect, useState } from 'react'
import { getReviewSummary, type ReviewSummary } from './reviews'

export function useReviewSummary(token: string | null, revision: number) {
  const [state, setState] = useState<{ token: string; data?: ReviewSummary; error?: string }>()
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    setState({ token })
    getReviewSummary(token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ token, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ token, error: error instanceof Error ? error.message : 'Avaliações indisponíveis.' })
    })
    return () => controller.abort()
  }, [token, revision])
  const current = state?.token === token ? state : undefined
  return { data: current?.data, error: current?.error, loading: !!token && !current?.data && !current?.error }
}
