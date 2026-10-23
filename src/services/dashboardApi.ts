import { apiRequest, ApiError } from './api'
import type { Order, OrderProposal } from '../types/orders'
import type { NewOrder } from '../types/orders'

export type OrderStatusDto = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled'
export type ProposalDto = Omit<OrderProposal, 'providerName'> & { providerId: string; providerName: string }
export type OrderDto = {
  id: string; title: string; status: OrderStatusDto; createdAt: string; updatedAt?: string; description?: string
  category?: string; location?: string; proposalsCount?: number; chosenProposalValue?: number
  scope?: Record<string, unknown>; photos?: { id: string; url: string; description?: string }[]; proposals?: ProposalDto[]
}
export type OrdersPage = { items: OrderDto[]; page: number; pageSize: number; totalItems: number; totalPages: number }
export type HomeSummary = {
  orders: { total: number; pending: number; inProgress: number; completed: number; cancelled: number
    active?: number; createdLast7Days?: number }
  proposals?: { total: number; awaitingDecision: number; unviewed: number }
  recentOrders: OrderDto[]
}
export type UserDto = { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string; cpf?: string | null }
export type LoginDto = { accessToken: string; refreshToken?: string | null; tokenType: string; expiresAtUtc: string; user: UserDto }

const invalid = () => new ApiError(502, 'A API retornou dados incompatíveis com o contrato esperado.')
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
const date = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))
function isOrder(value: unknown): value is OrderDto {
  return object(value) && typeof value.id === 'string' && isUuid(value.id) && typeof value.title === 'string'
    && ['Pending', 'InProgress', 'Completed', 'Cancelled'].includes(String(value.status))
    && date(value.createdAt) && (value.updatedAt === undefined || date(value.updatedAt))
}
export function parseSummary(value: unknown): HomeSummary {
  if (!object(value) || !object(value.orders) || !Array.isArray(value.recentOrders)) throw invalid()
  const counts = value.orders
  const count = (source: Record<string, unknown>, key: string) => Number.isSafeInteger(source[key]) && Number(source[key]) >= 0
  // Campos dos cards (#50): opcionais para manter compatibilidade, mas validados quando presentes.
  if (['active', 'createdLast7Days'].some((key) => counts[key] !== undefined && !count(counts, key))
    || value.proposals !== undefined && (!object(value.proposals)
      || !['total', 'awaitingDecision', 'unviewed'].every((key) => count(value.proposals as Record<string, unknown>, key)))) throw invalid()
  if (!['total', 'pending', 'inProgress', 'completed', 'cancelled'].every((key) => count(counts, key))
    || value.recentOrders.length > 5 || value.recentOrders.length > Number(counts.total) || !value.recentOrders.every(isOrder)
    || counts.total !== Number(counts.pending) + Number(counts.inProgress) + Number(counts.completed) + Number(counts.cancelled)) throw invalid()
  return value as HomeSummary
}
const isProposal = (value: unknown) => object(value) && typeof value.id === 'string' && typeof value.providerName === 'string'
  && ['Sent', 'Viewed', 'Chosen'].includes(String(value.status)) && typeof value.value === 'number'
export function parsePage(value: unknown): OrdersPage {
  if (!object(value) || !Array.isArray(value.items) || !value.items.every(isOrder)
    || !['page', 'pageSize', 'totalItems', 'totalPages'].every((key) => Number.isSafeInteger(value[key]) && Number(value[key]) >= 0)) throw invalid()
  return value as OrdersPage
}
export function parseUser(value: unknown): UserDto {
  if (!object(value) || typeof value.id !== 'string' || !isUuid(value.id)
    || typeof value.name !== 'string' || typeof value.email !== 'string' || typeof value.role !== 'string'
    || typeof value.isActive !== 'boolean' || !date(value.createdAt)
    || value.cpf !== undefined && value.cpf !== null && (typeof value.cpf !== 'string' || !/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(value.cpf))) throw invalid()
  return value as UserDto
}
export function parseDetail(value: unknown): OrderDto & { description: string } {
  if (!isOrder(value) || typeof value.description !== 'string'
    || value.proposals !== undefined && (!Array.isArray(value.proposals) || !value.proposals.every(isProposal))) throw invalid()
  return value as OrderDto & { description: string }
}
export function parseLogin(value: unknown): LoginDto {
  if (!object(value) || typeof value.accessToken !== 'string' || !value.accessToken
    || value.refreshToken !== undefined && value.refreshToken !== null && typeof value.refreshToken !== 'string'
    || value.tokenType !== 'bearer' && value.tokenType !== 'Bearer' || !date(value.expiresAtUtc)) throw invalid()
  parseUser(value.user)
  return value as LoginDto
}
export const getSummary = async (token: string, signal?: AbortSignal) => parseSummary(await apiRequest('/api/v1/home/summary', { token, signal }))
export const getCurrentUser = async (token: string, signal?: AbortSignal) => parseUser(await apiRequest('/api/v1/users/me', { token, signal }))
export async function getOrders(token: string, query: { status?: OrderStatusDto; page?: number; pageSize?: number } = {}, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(query.page ?? 1), pageSize: String(query.pageSize ?? 10) })
  if (query.status) params.set('status', query.status)
  return parsePage(await apiRequest(`/api/v1/orders?${params}`, { token, signal }))
}
export async function getOrder(id: string, token: string, signal?: AbortSignal) {
  if (!isUuid(id)) throw new ApiError(404, 'Pedido não encontrado ou indisponível para sua conta.')
  const detail = parseDetail(await apiRequest(`/api/v1/orders/${id}`, { token, signal }))
  if (detail.id.toLowerCase() !== id.toLowerCase()) throw invalid()
  return detail
}
export const login = async (email: string, password: string) => parseLogin(await apiRequest('/api/v1/auth/login', { method: 'POST', body: { email, password } }))
export const register = async (name: string, email: string, password: string) => parseUser(await apiRequest('/api/v1/auth/register', { method: 'POST', body: { name, email, password } }))
export type ContactType = 'telefone' | 'whatsapp' | 'email_alt'
export type CompleteRegistrationPayload = {
  name: string
  cpf: string
  endereco: { logradouro: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; cep: string }
  contato: { tipo: ContactType; valor: string }
}
export const completeRegistration = async (token: string, payload: CompleteRegistrationPayload, signal?: AbortSignal) =>
  parseUser(await apiRequest('/api/v1/users/me/complete-registration', { method: 'POST', token, body: payload, signal }))

export function toOrder(dto: OrderDto, customerId: string): Order {
  const statuses = { Pending: 'waiting', InProgress: 'progress', Completed: 'completed', Cancelled: 'cancelled' } as const
  const text = (key: string) => typeof dto.scope?.[key] === 'string' ? dto.scope[key] : ''
  return { id: dto.id, customerId, title: dto.title, status: statuses[dto.status], createdAt: dto.createdAt,
    updatedAt: dto.updatedAt, description: dto.description ?? 'Abra os detalhes para consultar a descrição.',
    category: dto.category ?? 'Pedido', location: dto.location ?? 'Localização não informada',
    proposals: dto.proposalsCount ?? dto.proposals?.length ?? 0, chosenProposalValue: dto.chosenProposalValue,
    proposalList: dto.proposals, photoUrls: dto.photos?.map((photo) => photo.url),
    scope: dto.scope && { details: text('detalhes'), urgency: text('urgencia'), specifications: text('especificacoes') },
    icon: 'bag' }
}

export const createOrder = async (token: string, order: NewOrder, photoUrls: string[], signal?: AbortSignal) =>
  parseDetail(await apiRequest('/api/v1/orders', {
    method: 'POST', token, signal,
    body: {
      titulo: order.title, categoria: order.category, descricao: order.description, localizacao: order.location,
      detalhes: order.scope.details, urgencia: order.scope.urgency, especificacoes: order.scope.specifications,
      fotos: photoUrls.map((url) => ({ url })),
    },
  }))

// Fotos do pedido (#67): cada foto é enviada à API antes da criação do pedido; a URL devolvida vai em fotos[].
export const photoTypes = ['image/jpeg', 'image/png', 'image/webp']
export const maxPhotoBytes = 5 * 1024 * 1024
export const maxPhotos = 4

export async function uploadOrderPhoto(token: string, photo: File, signal?: AbortSignal) {
  const form = new FormData()
  form.append('foto', photo, photo.name)
  const value = await apiRequest('/api/v1/orders/photos', { method: 'POST', token, form, signal })
  if (!object(value) || typeof value.url !== 'string' || !/^https:\/\//.test(value.url)) throw invalid()
  return value.url
}

// Chat de criação de pedido (#69): as chaves de scope são as mesmas do corpo de POST /api/v1/orders.
export type AssistantMessage = { role: 'user' | 'assistant'; content: string }
export type AssistantScope = Partial<Record<'titulo' | 'categoria' | 'descricao' | 'localizacao' | 'detalhes' | 'urgencia' | 'especificacoes', string>>
export type AssistantReply = { reply: string; scope: AssistantScope; complete: boolean }

export function parseAssistantReply(value: unknown): AssistantReply {
  if (!object(value) || typeof value.reply !== 'string' || !value.reply.trim() || typeof value.complete !== 'boolean'
    || !object(value.scope) || !Object.values(value.scope).every((item) => typeof item === 'string')) throw invalid()
  return value as AssistantReply
}

export const askAssistant = async (token: string, messages: AssistantMessage[], signal?: AbortSignal) =>
  parseAssistantReply(await apiRequest('/api/v1/orders/assistant', { method: 'POST', token, body: { messages }, signal }))
