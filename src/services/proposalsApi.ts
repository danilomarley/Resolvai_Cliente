import { apiRequest, ApiError } from './api'
import { isUuid, parseDetail } from './dashboardApi'
import type { Order, OrderProposal } from '../types/orders'
import { hasChosenProposal } from './orders'

export type ProposalSort = 'rating' | 'price' | 'deadline'
export type ProposalDto = OrderProposal & { providerId: string }
export type ProviderProfile = { memberSince: string; completedServices: number }
export type ProposalDetailDto = ProposalDto & { providerProfile: ProviderProfile }

export const proposalSorts: { value: ProposalSort; label: string }[] = [
  { value: 'rating', label: 'Melhor avaliação' },
  { value: 'price', label: 'Menor preço' },
  { value: 'deadline', label: 'Menor prazo' },
]
/** Máximo de propostas na comparação lado a lado (#87). */
export const maxCompared = 3
export const minCompared = 2

const invalid = () => new ApiError(502, 'A API retornou dados incompatíveis com o contrato esperado.')
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const optional = (value: unknown, type: 'string' | 'number') => value === undefined || value === null || typeof value === type

function isProposal(value: unknown): value is ProposalDto {
  if (!object(value) || typeof value.id !== 'string' || typeof value.providerName !== 'string'
    || !['Sent', 'Viewed', 'Chosen', 'NotChosen'].includes(String(value.status))
    || typeof value.value !== 'number' || !Number.isFinite(value.value)
    || !optional(value.deadline, 'string') || !optional(value.deadlineDays, 'number')
    || !optional(value.description, 'string') || !optional(value.warranty, 'string')) return false
  const rating = value.providerRating
  return rating === undefined || rating === null || object(rating)
    && (rating.average === null || typeof rating.average === 'number') && Number.isSafeInteger(rating.count)
}

export function parseProposals(value: unknown): ProposalDto[] {
  if (!Array.isArray(value) || !value.every(isProposal)) throw invalid()
  return value
}

export async function getOrderProposals(orderId: string, token: string, sort: ProposalSort, signal?: AbortSignal) {
  if (!isUuid(orderId)) throw new ApiError(404, 'Pedido não encontrado ou indisponível para sua conta.')
  return parseProposals(await apiRequest(`/api/v1/orders/${orderId}/proposals?sort=${sort}`, { token, signal }))
}

/** Ids com o menor valor e o menor prazo (em dias) entre as propostas comparadas; vazio se não houver o que comparar. */
export function bestIds(proposals: ProposalDto[]) {
  const lowest = (pick: (proposal: ProposalDto) => number | undefined) => {
    const values = proposals.map(pick).filter((item): item is number => item !== undefined)
    const min = Math.min(...values)
    return new Set(values.length > 1 ? proposals.filter((proposal) => pick(proposal) === min).map((proposal) => proposal.id) : [])
  }
  return { price: lowest((proposal) => proposal.value), deadline: lowest((proposal) => proposal.deadlineDays) }
}

export const ratingLabel = (rating?: ProposalDto['providerRating']) =>
  rating?.average != null && rating.count > 0
    ? `${rating.average.toFixed(1).replace('.', ',')} ★ (${rating.count} ${rating.count === 1 ? 'avaliação' : 'avaliações'})`
    : 'Sem avaliações'

export function parseProposalDetail(value: unknown): ProposalDetailDto {
  const profile = object(value) ? value.providerProfile : undefined
  if (!isProposal(value) || !object(profile)
    || typeof profile.memberSince !== 'string' || Number.isNaN(Date.parse(profile.memberSince))
    || !Number.isSafeInteger(profile.completedServices) || Number(profile.completedServices) < 0) throw invalid()
  return value as ProposalDetailDto
}

/** Abrir o detalhe marca a proposta como visualizada na API. */
export async function getProposalDetail(orderId: string, proposalId: string, token: string, signal?: AbortSignal) {
  if (!isUuid(orderId) || !isUuid(proposalId)) throw new ApiError(404, 'Pedido não encontrado ou indisponível para sua conta.')
  const detail = parseProposalDetail(await apiRequest(`/api/v1/orders/${orderId}/proposals/${proposalId}`, { token, signal }))
  if (detail.id.toLowerCase() !== proposalId.toLowerCase()) throw invalid()
  return detail
}

/** Aceita a proposta e devolve o pedido atualizado. O pedido segue aberto até o pagamento. */
export async function acceptProposal(orderId: string, proposalId: string, token: string, signal?: AbortSignal) {
  if (!isUuid(orderId) || !isUuid(proposalId)) throw new ApiError(404, 'Pedido não encontrado ou indisponível para sua conta.')
  return parseDetail(await apiRequest(`/api/v1/orders/${orderId}/proposals/${proposalId}/accept`, { method: 'POST', token, signal }))
}

/** Motivo pelo qual a proposta não pode ser aceita agora; undefined quando pode. */
export function acceptBlock(order: Order, proposal: Pick<ProposalDto, 'id' | 'status'>): string | undefined {
  if (proposal.status === 'Chosen') return 'Você já aceitou esta proposta.'
  if (order.status === 'cancelled') return 'Este pedido foi cancelado.'
  if (order.status !== 'waiting') return 'Este pedido já está em andamento ou foi concluído.'
  if (hasChosenProposal(order)) return 'Outra proposta já foi aceita para este pedido.'
  if (proposal.status === 'NotChosen') return 'Esta proposta não está mais disponível.'
  return undefined
}
