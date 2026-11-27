import { useEffect, useState } from 'react'
import { ApiError } from './api'
import { getContract, type Contract } from './contractApi'

/** Com o contrato pendente, a tela confere a cada 30 s se o prestador já assinou. */
export const contractRefreshMs = 30_000

type State = { key: string; data?: Contract; error?: ApiError }

/** Contrato do pedido (GET /orders/{id}/contract). `refresh` recarrega sem apagar o que já está na tela. */
export function useOrderContract(orderId: string | undefined, token: string | null | undefined) {
  const [state, setState] = useState<State>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = `${token}:${orderId}`
  const pending = state.key === key && state.data?.status === 'Pending'

  useEffect(() => {
    if (!orderId || !token) return
    const controller = new AbortController()
    getContract(orderId, token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        const failure = error instanceof ApiError ? error : new ApiError(0, 'Não foi possível carregar o contrato. Tente novamente.')
        setState((current) => current.key === key && current.data && failure.status !== 404 ? current : { key, error: failure })
      }
    })
    return () => controller.abort()
  }, [orderId, token, key, attempt])

  useEffect(() => {
    if (!pending) return
    const timer = setInterval(() => setAttempt((value) => value + 1), contractRefreshMs)
    return () => clearInterval(timer)
  }, [pending])

  const current = state.key === key ? state : undefined
  return {
    data: current?.data, error: current?.error, loading: !!orderId && !!token && !current?.data && !current?.error,
    retry: () => { setState({ key: '' }); setAttempt((value) => value + 1) },
    refresh: () => setAttempt((value) => value + 1),
    /** Troca o contrato mostrado por um já atualizado (resposta da assinatura), sem nova consulta. */
    replace: (data: Contract) => setState({ key, data }),
  }
}
