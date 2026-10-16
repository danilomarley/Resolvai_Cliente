export type CepAddress = { logradouro: string; bairro: string; cidade: string; estado: string }

// Returns null when the CEP does not exist; throws when the lookup itself fails.
export async function lookupCep(cep: string, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  const timeout = AbortSignal.timeout(8000)
  const response = await fetcher(`https://viacep.com.br/ws/${digits}/json/`, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })
  if (!response.ok) throw new Error('Consulta de CEP indisponível.')
  const data: unknown = await response.json()
  if (typeof data !== 'object' || data === null) throw new Error('Resposta de CEP inválida.')
  const body = data as Record<string, unknown>
  if (body.erro) return null
  const text = (value: unknown) => typeof value === 'string' ? value : ''
  return { logradouro: text(body.logradouro), bairro: text(body.bairro), cidade: text(body.localidade), estado: text(body.uf) }
}
