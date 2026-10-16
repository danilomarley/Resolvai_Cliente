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
