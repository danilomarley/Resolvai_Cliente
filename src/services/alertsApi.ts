import { apiRequest, ApiError } from './api'
import { isUuid } from './dashboardApi'

/** Proposta ainda não visualizada, mostrada nos alertas da navbar (#90). */
export type ProposalAlert = {
  id: string
  orderId: string
  orderTitle: string
  providerName: string
  value: number
  createdAt: string
}
export type ProposalAlerts = { total: number; items: ProposalAlert[] }

const invalid = () => new ApiError(502, 'A API retornou dados incompatíveis com o contrato esperado.')
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isAlert = (value: unknown): value is ProposalAlert => object(value)
  && typeof value.id === 'string' && isUuid(value.id) && typeof value.orderId === 'string' && isUuid(value.orderId)
  && typeof value.orderTitle === 'string' && typeof value.providerName === 'string'
  && typeof value.value === 'number' && Number.isFinite(value.value)
  && typeof value.createdAt === 'string' && !Number.isNaN(Date.parse(value.createdAt))

export function parseAlerts(value: unknown): ProposalAlerts {
  if (!object(value) || !Number.isSafeInteger(value.total) || Number(value.total) < 0
    || !Array.isArray(value.items) || !value.items.every(isAlert) || value.items.length > Number(value.total)) throw invalid()
  return value as ProposalAlerts
}

export const getProposalAlerts = async (token: string, signal?: AbortSignal, limit = 5) =>
  parseAlerts(await apiRequest(`/api/v1/proposals/unviewed?limit=${limit}`, { token, signal }))
