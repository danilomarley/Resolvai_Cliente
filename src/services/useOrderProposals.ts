import { useEffect, useState } from 'react'
import { ApiError } from './api'
import { getOrderProposals, type ProposalDto, type ProposalSort } from './proposalsApi'

type State = { key: string; data?: ProposalDto[]; error?: ApiError }

/** Propostas do pedido vindas de GET /orders/{id}/proposals; a ordenação é feita pela API. */
export function useOrderProposals(orderId: string | undefined, token: string | null | undefined, sort: ProposalSort) {
  const [state, setState] = useState<State>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = `${token}:${orderId}:${sort}`
  useEffect(() => {
    if (!orderId || !token) return
    const controller = new AbortController()
    getOrderProposals(orderId, token, sort, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, error: error instanceof ApiError ? error : new ApiError(0, 'Não foi possível carregar as propostas. Tente novamente.') })
    })
    return () => controller.abort()
  }, [orderId, token, sort, key, attempt])
  // Mantém a lista anterior na tela enquanto a nova ordenação carrega.
  const current = state.key === key ? state : undefined
  const previous = state.key.startsWith(`${token}:${orderId}:`) ? state.data : undefined
  return { data: current?.data ?? previous, error: current?.error, loading: !!orderId && !!token && !current?.data && !current?.error,
    retry: () => { setState({ key: '' }); setAttempt((value) => value + 1) } }
}
