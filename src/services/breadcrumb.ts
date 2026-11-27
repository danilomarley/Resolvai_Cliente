export type Crumb = { label: string; to?: string }

const uuid = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'
const orderTabs: Record<string, string> = {
  propostas: 'Propostas', contrato: 'Contrato', pagamento: 'Pagamento', acompanhar: 'Acompanhamento', editar: 'Editar', avaliar: 'Avaliar',
}

/**
 * Trilha de navegação depois de "Meu espaço": onde a pessoa está dentro do app. O último item é a tela atual (sem link);
 * os anteriores levam de volta. `listLabel` é o nome da lista de pedidos aberta (Meus pedidos, Propostas, Avaliações).
 */
export function breadcrumbFor(pathname: string, listLabel = 'Meus pedidos'): Crumb[] {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return [{ label: 'Visão geral' }]
  if (path === '/conta') return [{ label: 'Minha conta' }]
  if (path === '/ajuda') return [{ label: 'Central de ajuda' }]
  if (path === '/pedidos') return [{ label: listLabel }]
  if (path === '/pedidos/novo') return [{ label: 'Meus pedidos', to: '/pedidos' }, { label: 'Criar pedido' }]

  const order = new RegExp(`^/pedidos/(${uuid})(?:/([a-z]+)(?:/(${uuid}))?)?$`, 'i').exec(path)
  if (!order) return []
  const [, id = '', tab, proposal] = order
  const number = `#${id.slice(0, 8).toUpperCase()}`
  const orders: Crumb = { label: 'Meus pedidos', to: '/pedidos' }
  if (!tab) return [orders, { label: number }]
  const label = orderTabs[tab.toLowerCase()]
  if (!label) return []
  const base: Crumb = { label: number, to: `/pedidos/${id}` }
  // Detalhe de uma proposta: a lista de propostas fica no meio do caminho.
  if (proposal) return tab.toLowerCase() === 'propostas' ? [orders, base, { label: 'Propostas', to: `/pedidos/${id}/propostas` }, { label: 'Proposta' }] : []
  return [orders, base, { label }]
}
