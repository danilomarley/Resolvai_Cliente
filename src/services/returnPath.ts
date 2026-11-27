const uuid = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'
const paths = new RegExp(`^/(?:pedidos(?:/novo|/${uuid}(?:/(?:propostas(?:/${uuid})?|contrato|pagamento|acompanhar|editar|avaliar))?)?|conta|ajuda|cadastro/finalizar)?$`, 'i')

// Só parâmetros que o próprio app grava na URL são aceitos de volta.
const queryRules: Record<string, (value: string) => boolean> = {
  status: (value) => ['Pending', 'InProgress', 'Completed', 'Cancelled'].includes(value),
  stage: (value) => ['Open', 'AwaitingSignatures', 'AwaitingPayment'].includes(value),
  page: (value) => /^\d{1,4}$/.test(value),
  modal: (value) => ['perfil', 'ajuda', 'finalizar-cadastro', 'criar-pedido', 'avaliar', 'editar-pedido', 'cancelar-pedido', 'concluir-pedido', 'aceitar-proposta'].includes(value),
  // Links antigos usavam next=criar-pedido; hoje o destino é o próprio caminho (só telas do app, sem parâmetros).
  next: (value) => value === 'criar-pedido' || paths.test(value),
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

/** Para onde ir depois de finalizar o cadastro: só telas do app (?next=), nunca a própria página de cadastro. */
export function nextAfterRegistration(search: string): string {
  const next = safeReturnPath(new URLSearchParams(search).get('next'))
  return next.startsWith('/cadastro') ? '/' : next
}
