import { useEffect, useState } from 'react'
import { getProposalAlerts, type ProposalAlerts } from './alertsApi'

/** Intervalo da atualização em segundo plano; além dele, o contador recarrega ao navegar e ao voltar para a aba. */
export const alertsRefreshMs = 60_000

type State = { token: string; data?: ProposalAlerts; failed?: boolean }

/**
 * Propostas novas do contratante (#90). `refreshKey` muda a cada navegação, então o contador acompanha
 * o que o usuário abriu sem recarregar a página. Uma falha não apaga o último valor conhecido.
 */
export function useProposalAlerts(token: string | null, refreshKey: string) {
  const [state, setState] = useState<State>()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!token) return
    const timer = setInterval(() => setTick((value) => value + 1), alertsRefreshMs)
    const onVisible = () => { if (document.visibilityState === 'visible') setTick((value) => value + 1) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [token])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    getProposalAlerts(token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ token, data })
    }).catch(() => {
      if (!controller.signal.aborted) setState((current) => ({ token, data: current?.token === token ? current.data : undefined, failed: true }))
    })
    return () => controller.abort()
  }, [token, refreshKey, tick])

  const current = state?.token === token ? state : undefined
  return { data: current?.data, failed: !!current?.failed, loading: !!token && !current }
}
