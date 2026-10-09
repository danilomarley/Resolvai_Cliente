export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

type Options = { token?: string; signal?: AbortSignal; body?: unknown; method?: string }

export function createApiClient(baseUrl: string, fetcher: typeof fetch = fetch) {
  const base = baseUrl.replace(/\/$/, '')
  return async (path: string, { token, signal, body, method = 'GET' }: Options = {}): Promise<unknown> => {
    let response: Response
    try {
      response = await fetcher(`${base}${path}`, {
        method, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000), cache: 'no-store',
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
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
          'Usuário autenticado no Supabase sem perfil local.': 'Sua conta foi autenticada, mas não possui um perfil no backend. Solicite a regularização do cadastro ao responsável pelo projeto.',
          'Usuário inativo.': 'Sua conta está inativa. Solicite a ativação ao responsável pelo projeto.',
        }
        throw new ApiError(401, typeof detail === 'string' && reasons[detail]
          ? reasons[detail]
          : 'Não foi possível autenticar. Confira o e-mail, a senha e se o e-mail da conta foi confirmado.')
      }
      const messages: Record<number, string> = {
        400: 'Confira os dados informados.',
        401: 'Sua sessão não foi aceita pela API. Entre novamente ou verifique se sua conta possui um perfil ativo.',
        403: 'Sua conta não tem permissão para esta consulta.',
        404: 'Pedido não encontrado ou indisponível para sua conta.',
        409: 'Já existe uma conta com os dados informados.',
        503: 'A API está indisponível. Inicie o backend do ResolvAI e tente entrar novamente.',
      }
      throw new ApiError(response.status, messages[response.status] ?? 'Não foi possível carregar os dados. Tente novamente.')
    }
    try { return await response.json() }
    catch { throw new ApiError(502, 'A API retornou uma resposta inválida.') }
  }
}

// Relative requests use the Vite development proxy or the production reverse proxy.
export const apiRequest = createApiClient(import.meta.env?.VITE_API_BASE_URL ?? '')
