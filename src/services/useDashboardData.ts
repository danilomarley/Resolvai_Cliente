import { useEffect, useState } from 'react'
import { ApiError } from './api'
import { getCurrentUser, getOrder, getOrders, getSummary, type HomeSummary, type OrderDto, type OrdersPage, type OrderStatusDto, type UserDto } from './dashboardApi'

type State<T> = { key: string; data?: T; error?: ApiError }
const asError = (error: unknown) => error instanceof ApiError ? error : new ApiError(0, 'Não foi possível carregar os dados. Tente novamente.')

export function useDashboardData(token: string | null, customerId: string | null) {
  const [state, setState] = useState<State<{ summary: HomeSummary; user: UserDto }>>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = `${customerId}:${token}`
  useEffect(() => {
    if (!token || !customerId) return
    const controller = new AbortController()
    setState({ key })
    Promise.all([getSummary(token, controller.signal), getCurrentUser(token, controller.signal)])
      .then(([summary, user]) => {
        if (controller.signal.aborted) return
        if (user.id !== customerId || !user.isActive) throw new ApiError(401, 'Sua conta não possui um perfil ativo na API.')
        setState({ key, data: { summary, user } })
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ key, error: asError(error) })
      })
    return () => controller.abort()
  }, [token, customerId, key, attempt])
  const current = state.key === key ? state : undefined
  return { data: current?.data, error: current?.error, loading: !!token && !current?.data && !current?.error,
    retry: () => setAttempt((value) => value + 1) }
}

export function useOrderDetail(id: string | undefined, token: string | null) {
  const [state, setState] = useState<State<OrderDto>>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = `${token}:${id}`
  useEffect(() => {
    if (!id || !token) return
    const controller = new AbortController()
    setState({ key })
    getOrder(id, token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, error: asError(error) })
    })
    return () => controller.abort()
  }, [id, token, key, attempt])
  const current = state.key === key ? state : undefined
  return { data: current?.data, error: current?.error, loading: !!id && !!token && !current?.data && !current?.error,
    retry: () => setAttempt((value) => value + 1) }
}

export function useOrdersList(token: string | null, enabled: boolean, status: OrderStatusDto | undefined, page: number) {
  const [state, setState] = useState<State<OrdersPage>>({ key: '' })
  const [attempt, setAttempt] = useState(0)
  const key = `${token}:${status}:${page}`
  useEffect(() => {
    if (!token || !enabled) return
    const controller = new AbortController()
    setState({ key })
    getOrders(token, { status, page }, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ key, data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, error: asError(error) })
    })
    return () => controller.abort()
  }, [token, enabled, status, page, key, attempt])
  const current = state.key === key ? state : undefined
  return { data: current?.data, error: current?.error, loading: enabled && !!token && !current?.data && !current?.error,
    retry: () => setAttempt((value) => value + 1) }
}
