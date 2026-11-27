import { apiRequest, ApiError } from './api'
import { isUuid } from './dashboardApi'

/** Cobrança Pix do pedido (#97). Pending até a confirmação; Paid leva o pedido a "Em andamento". */
export type Payment = {
  id: string
  orderId: string
  method: 'Pix'
  status: 'Pending' | 'Paid' | 'Expired' | 'Cancelled'
  /** Valor em reais. */
  amount: number
  /** Pix copia e cola. */
  brCode: string
  /** QR Code como data URI de imagem. */
  qrCodeBase64?: string
  expiresAt?: string
  paidAt?: string
  /** Cobrança gerada com a chave de teste da AbacatePay: só então o pagamento pode ser simulado. */
  testMode: boolean
  createdAt: string
}

const invalid = () => new ApiError(502, 'A API retornou dados incompatíveis com o contrato esperado.')
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const date = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const optionalDate = (value: unknown) => value === undefined || value === null || date(value)
// O QR Code vira o src de uma imagem: só aceita imagem embutida, nunca outro tipo de endereço.
const imageData = (value: unknown) => typeof value === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)

export function parsePayment(value: unknown): Payment {
  if (!object(value) || !text(value.id) || !isUuid(value.id) || !text(value.orderId) || !isUuid(value.orderId) || value.method !== 'Pix'
    || !['Pending', 'Paid', 'Expired', 'Cancelled'].includes(String(value.status))
    || typeof value.amount !== 'number' || !Number.isFinite(value.amount) || value.amount < 0 || !text(value.brCode)
    || value.qrCodeBase64 !== undefined && value.qrCodeBase64 !== null && !imageData(value.qrCodeBase64)
    || !optionalDate(value.expiresAt) || !optionalDate(value.paidAt) || typeof value.testMode !== 'boolean' || !date(value.createdAt)) throw invalid()
  // Paga só com a data do pagamento.
  if ((value.status === 'Paid') !== !!value.paidAt) throw invalid()
  return value as Payment
}

const notFound = () => new ApiError(404, 'Pedido não encontrado ou indisponível para sua conta.')

async function request(orderId: string, token: string, method: 'GET' | 'POST', suffix = '', signal?: AbortSignal) {
  if (!isUuid(orderId)) throw notFound()
  const payment = parsePayment(await apiRequest(`/api/v1/orders/${orderId}/payment${suffix}`, { method, token, signal }))
  if (payment.orderId.toLowerCase() !== orderId.toLowerCase()) throw invalid()
  return payment
}

/** Estado do pagamento; 404 quando o pedido ainda não tem cobrança. */
export const getPayment = (orderId: string, token: string, signal?: AbortSignal) => request(orderId, token, 'GET', '', signal)

/** Gera o Pix. Se já há um válido, a API devolve o mesmo (não cobra duas vezes). */
export const createPayment = (orderId: string, token: string, signal?: AbortSignal) => request(orderId, token, 'POST', '', signal)

/** Paga o Pix de teste sem dinheiro; a API recusa fora do modo de teste. */
export const simulatePayment = (orderId: string, token: string, signal?: AbortSignal) => request(orderId, token, 'POST', '/simulate', signal)
