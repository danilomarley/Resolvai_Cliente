import { apiRequest, ApiError } from './api'
import { parseUser } from './dashboardApi'

export type CompleteRegistration = {
  name: string
  cpf: string
  endereco: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    estado: string
    cep: string
    apelido?: string
  }
  contato: { tipo: 'telefone' | 'whatsapp' | 'email_alt'; valor: string }
}

export async function completeRegistration(body: CompleteRegistration, token: string, customerId: string, signal?: AbortSignal) {
  let response: unknown
  try {
    response = await apiRequest('/api/v1/users/me/complete-registration', { method: 'POST', body, token, signal })
  } catch (error) {
    if (error instanceof ApiError) {
      const messages: Record<number, string> = {
        400: 'Confira o CPF, o endereço e o contato informados.',
        404: 'A finalização de cadastro ainda não está disponível neste servidor.',
        409: 'O cadastro já foi finalizado ou este CPF já está em uso. Atualize os dados da conta antes de tentar novamente.',
      }
      if (messages[error.status]) throw new ApiError(error.status, messages[error.status])
    }
    throw error
  }
  const user = parseUser(response)
  if (user.id.toLowerCase() !== customerId.toLowerCase() || !user.isActive || !user.cpf
    || user.cpf.replace(/\D/g, '') !== body.cpf.replace(/\D/g, '')) {
    throw new ApiError(502, 'Não foi possível confirmar a finalização do cadastro. Atualize os dados da conta para verificar.')
  }
  return user
}

// Configurações da conta (#61): endereço e contato principais, editáveis depois da finalização do cadastro.
export type ProfileAddress = Omit<CompleteRegistration['endereco'], 'complemento' | 'apelido'> & { complemento?: string; apelido?: string }
export type ProfileContact = CompleteRegistration['contato']
export type Profile = { user: ReturnType<typeof parseUser>; endereco?: ProfileAddress; contato?: ProfileContact }
export type ProfileUpdate = { name?: string; endereco?: ProfileAddress; contato?: ProfileContact }

const text = (value: unknown) => typeof value === 'string'
export function parseProfile(value: unknown): Profile {
  if (typeof value !== 'object' || value === null) throw new ApiError(502, 'A API retornou dados incompatíveis com o contrato esperado.')
  const body = value as Record<string, unknown>
  const user = parseUser(body.user)
  const address = body.endereco as Record<string, unknown> | undefined
  const contact = body.contato as Record<string, unknown> | undefined
  if (address !== undefined && (typeof address !== 'object' || address === null
    || !['logradouro', 'cidade', 'estado', 'cep'].every((key) => text(address[key]))))
    throw new ApiError(502, 'A API retornou dados incompatíveis com o contrato esperado.')
  if (contact !== undefined && (typeof contact !== 'object' || contact === null || !text(contact.tipo) || !text(contact.valor)))
    throw new ApiError(502, 'A API retornou dados incompatíveis com o contrato esperado.')
  return { user, endereco: address as ProfileAddress | undefined, contato: contact as ProfileContact | undefined }
}

export const getProfile = async (token: string, signal?: AbortSignal) =>
  parseProfile(await apiRequest('/api/v1/users/me/profile', { token, signal }))

export const updateProfile = async (token: string, changes: ProfileUpdate, signal?: AbortSignal) =>
  parseProfile(await apiRequest('/api/v1/users/me/profile', { method: 'PATCH', token, body: changes, signal }))
