import { useEffect, useState } from 'react'
import { ApiError } from './api'
import { getPayment, type Payment } from './paymentApi'

/** Com o Pix pendente, a tela confere o status a cada 5 s: não depende do webhook chegar à API. */
export const paymentRefreshMs = 5_000

type State = { key: string; data?: Payment; error?: ApiError }

/** Pagamento do pedido (GET /orders/{id}/payment). 404 significa que ainda não há cobrança. */
export function usePayment(orderId: string | undefined, token: string | null | undefined) {
  const [state, setState] = useState<State>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = `${token}:${orderId}`
  const pending = state.key === key && state.data?.status === 'Pending'

  useEffect(() => {
    if (!orderId || !token) return
    const controller = new AbortController()
    getPayment(orderId, token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        const failure = error instanceof ApiError ? error : new ApiError(0, 'Não foi possível carregar o pagamento. Tente novamente.')
        // Uma falha passageira da consulta automática não apaga o QR Code que já está na tela.
        setState((current) => current.key === key && current.data && failure.status !== 404 ? current : { key, error: failure })
      }
    })
    return () => controller.abort()
  }, [orderId, token, key, attempt])

  useEffect(() => {
    if (!pending) return
    const timer = setInterval(() => setAttempt((value) => value + 1), paymentRefreshMs)
    return () => clearInterval(timer)
  }, [pending])

  const current = state.key === key ? state : undefined
  return {
    data: current?.data, error: current?.error, loading: !!orderId && !!token && !current?.data && !current?.error,
    retry: () => { setState({ key: '' }); setAttempt((value) => value + 1) },
    refresh: () => setAttempt((value) => value + 1),
    /** Troca o pagamento mostrado por um já atualizado (resposta de gerar ou simular), sem nova consulta. */
    replace: (data: Payment) => setState({ key, data }),
  }
}
