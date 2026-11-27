import { apiRequest, ApiError } from './api'
import { isUuid } from './dashboardApi'

/** Contrato de prestação de serviços do pedido (#95). Pending até o contratante e o prestador assinarem. */
export type Contract = {
  id: string
  orderId: string
  proposalId: string
  status: 'Pending' | 'Signed'
  templateVersion: string
  text: string
  textHash: string
  value: number
  customerName: string
  providerName: string
  customerSignedAt?: string
  providerSignedAt?: string
  createdAt: string
}

const invalid = () => new ApiError(502, 'A API retornou dados incompatíveis com o contrato esperado.')
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const date = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const optionalDate = (value: unknown) => value === undefined || value === null || date(value)

export function parseContract(value: unknown): Contract {
  if (!object(value) || !text(value.id) || !isUuid(value.id) || !text(value.orderId) || !isUuid(value.orderId)
    || !text(value.proposalId) || !isUuid(value.proposalId) || !['Pending', 'Signed'].includes(String(value.status))
    || !text(value.templateVersion) || !text(value.text) || !/^[0-9a-f]{64}$/i.test(String(value.textHash))
    || typeof value.value !== 'number' || !Number.isFinite(value.value) || !text(value.customerName) || !text(value.providerName)
    || !optionalDate(value.customerSignedAt) || !optionalDate(value.providerSignedAt) || !date(value.createdAt)) throw invalid()
  // O status precisa bater com as assinaturas: Signed só com as duas datas.
  const both = !!value.customerSignedAt && !!value.providerSignedAt
  if ((value.status === 'Signed') !== both) throw invalid()
  return value as Contract
}

export async function getContract(orderId: string, token: string, signal?: AbortSignal) {
  if (!isUuid(orderId)) throw new ApiError(404, 'Pedido não encontrado ou indisponível para sua conta.')
  const contract = parseContract(await apiRequest(`/api/v1/orders/${orderId}/contract`, { token, signal }))
  if (contract.orderId.toLowerCase() !== orderId.toLowerCase()) throw invalid()
  return contract
}

/** A assinatura vale para o texto lido: `textHash` é o hash devolvido junto com o texto. */
export async function signContract(orderId: string, textHash: string, token: string, signal?: AbortSignal) {
  if (!isUuid(orderId)) throw new ApiError(404, 'Pedido não encontrado ou indisponível para sua conta.')
  return parseContract(await apiRequest(`/api/v1/orders/${orderId}/contract/sign`, { method: 'POST', token, signal, body: { textHash } }))
}
