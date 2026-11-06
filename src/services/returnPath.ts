const uuid = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'
const paths = new RegExp(`^/(?:pedidos(?:/${uuid}(?:/(?:propostas|acompanhar))?)?)?$`, 'i')

// Só parâmetros que o próprio app grava na URL são aceitos de volta.
const queryRules: Record<string, (value: string) => boolean> = {
  status: (value) => ['Pending', 'InProgress', 'Completed', 'Cancelled'].includes(value),
  page: (value) => /^\d{1,4}$/.test(value),
  modal: (value) => ['perfil', 'ajuda', 'finalizar-cadastro', 'criar-pedido', 'avaliar'].includes(value),
  next: (value) => value === 'criar-pedido',
  pedido: (value) => new RegExp(`^${uuid}$`, 'i').test(value),
}

/**
 * Valida o destino guardado antes de ir ao login (evita redirecionar para endereços arbitrários).
 * Devolve o próprio valor quando é uma tela do app com parâmetros conhecidos; senão, a Visão geral.
 */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string') return '/'
  const [path, query = '', ...rest] = value.split('?')
  if (rest.length || !paths.test(path)) return '/'
  for (const [key, entry] of new URLSearchParams(query)) {
    if (!queryRules[key]?.(entry)) return '/'
  }
  return value
}
