export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

type Options = { token?: string; signal?: AbortSignal; body?: unknown; form?: FormData; method?: string }

// Rotas em que a mensagem de erro da API (detail) já é escrita para o cliente final.
const detailPaths = ['/api/v1/orders', '/api/v1/orders/photos', '/api/v1/orders/assistant', '/api/v1/users/me/profile']

export function createApiClient(baseUrl: string, fetcher: typeof fetch = fetch) {
  const base = baseUrl.replace(/\/$/, '')
  return async (path: string, { token, signal, body, form, method = 'GET' }: Options = {}): Promise<unknown> => {
    let response: Response
    try {
      response = await fetcher(`${base}${path}`, {
        method, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000), cache: 'no-store',
        // Com FormData o navegador define o Content-Type multipart com o boundary.
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body === undefined || form ? {} : { 'Content-Type': 'application/json' }) },
        ...(form ? { body: form } : body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch (error) {
      if (signal?.aborted) throw error
      throw new ApiError(0, 'Não foi possível conectar à API. Verifique a conexão e tente novamente.')
    }
    if (!response.ok) {
      if (response.status === 401 && path === '/api/v1/auth/login') {
        let detail: unknown
        try { detail = (await response.json()).detail } catch { /* Some hosts return an empty 401. */ }
        const reasons: Record<string, string> = {
          'Usuário inativo.': 'Sua conta está inativa. Solicite a ativação ao responsável pelo projeto.',
        }
        throw new ApiError(401, typeof detail === 'string' && reasons[detail]
          ? reasons[detail]
          : 'Não foi possível autenticar. Confira o e-mail, a senha e se o e-mail da conta foi confirmado.')
      }
      if (response.status === 409 && path === '/api/v1/users/me/complete-registration') {
        let detail: unknown
        try { detail = (await response.json()).detail } catch { /* Some hosts return an empty body. */ }
        throw new ApiError(409, detail === 'Cadastro já finalizado.' ? 'Seu cadastro já foi finalizado.'
          : typeof detail === 'string' && detail.startsWith('Já existe um usuário com o CPF') ? 'Este CPF já está em uso por outra conta.'
          : 'Não foi possível finalizar o cadastro com os dados informados.')
      }
      if ([400, 429, 503].includes(response.status) && method !== 'GET' && detailPaths.includes(path)) {
        let detail: unknown
        try { detail = (await response.json()).detail } catch { /* Validation errors may come without detail. */ }
        if (typeof detail === 'string' && detail) throw new ApiError(response.status, detail)
        if (response.status === 400) throw new ApiError(400, path === '/api/v1/orders'
          ? 'Confira os dados do pedido e tente novamente.' : 'Confira os dados informados.')
      }
      const messages: Record<number, string> = {
        400: 'Confira os dados informados.',
        401: 'Sua sessão não foi aceita pela API. Entre novamente ou verifique se sua conta possui um perfil ativo.',
        403: 'Sua conta não tem permissão para esta consulta.',
        404: 'Pedido não encontrado ou indisponível para sua conta.',
        409: 'Já existe uma conta com os dados informados.',
        429: 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
        503: 'A API está indisponível. Verifique o endereço configurado e se o servidor está em execução.',
      }
      throw new ApiError(response.status, messages[response.status] ?? 'Não foi possível carregar os dados. Tente novamente.')
    }
    try { return await response.json() }
    catch { throw new ApiError(502, 'A API retornou uma resposta inválida.') }
  }
}

// Relative requests use the Vite development proxy or the production reverse proxy.
export const apiRequest = createApiClient(import.meta.env?.VITE_API_BASE_URL ?? '')
