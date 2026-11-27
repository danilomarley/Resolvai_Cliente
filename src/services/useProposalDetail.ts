import { useEffect, useState } from 'react'
import { ApiError } from './api'
import { getProposalDetail, type ProposalDetailDto } from './proposalsApi'

type State = { key: string; data?: ProposalDetailDto; error?: ApiError }

/** Detalhe de uma proposta (GET /orders/{id}/proposals/{proposalId}), com o resumo do prestador. */
export function useProposalDetail(orderId: string | undefined, proposalId: string | undefined, token: string | null | undefined) {
  const [state, setState] = useState<State>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = `${token}:${orderId}:${proposalId}`
  useEffect(() => {
    if (!orderId || !proposalId || !token) return
    const controller = new AbortController()
    getProposalDetail(orderId, proposalId, token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, error: error instanceof ApiError ? error : new ApiError(0, 'Não foi possível carregar a proposta. Tente novamente.') })
    })
    return () => controller.abort()
  }, [orderId, proposalId, token, key, attempt])
  const current = state.key === key ? state : undefined
  return { data: current?.data, error: current?.error, loading: !!orderId && !!proposalId && !!token && !current?.data && !current?.error,
    retry: () => { setState({ key: '' }); setAttempt((value) => value + 1) } }
}
