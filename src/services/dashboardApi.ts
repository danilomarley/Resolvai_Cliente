import { apiRequest, ApiError } from './api'
import type { Order } from '../data/dashboard'

export type OrderStatusDto = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled'
export type OrderDto = { id: string; title: string; status: OrderStatusDto; createdAt: string; updatedAt?: string; description?: string }
export type HomeSummary = {
  orders: { total: number; pending: number; inProgress: number; completed: number; cancelled: number }
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
  if (!['total', 'pending', 'inProgress', 'completed', 'cancelled'].every((key) => Number.isSafeInteger(counts[key]) && Number(counts[key]) >= 0)
    || value.recentOrders.length > 5 || value.recentOrders.length > Number(counts.total) || !value.recentOrders.every(isOrder)
    || counts.total !== Number(counts.pending) + Number(counts.inProgress) + Number(counts.completed) + Number(counts.cancelled)) throw invalid()
  return value as HomeSummary
}
export function parseUser(value: unknown): UserDto {
  if (!object(value) || typeof value.id !== 'string' || !isUuid(value.id)
    || typeof value.name !== 'string' || typeof value.email !== 'string' || typeof value.role !== 'string'
    || typeof value.isActive !== 'boolean' || !date(value.createdAt)
    || value.cpf !== undefined && value.cpf !== null && typeof value.cpf !== 'string') throw invalid()
  return value as UserDto
}
export function parseDetail(value: unknown): OrderDto & { description: string } {
  if (!isOrder(value) || typeof value.description !== 'string') throw invalid()
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
  return { id: dto.id, customerId, title: dto.title, status: statuses[dto.status], createdAt: dto.createdAt,
    description: dto.description ?? 'Abra os detalhes para consultar a descrição.',
    category: 'Pedido', location: 'Localização não informada', proposals: 0, deadline: 'Não informado', icon: 'bag', source: 'api' }
}
