import { readOrder } from './modalRoute'

const uuid = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}'

/**
 * Links antigos abriam algumas telas como modal (?modal=nome). Hoje cada uma é uma página: devolve o
 * endereço novo, ou null quando o parâmetro não é de uma tela que mudou (aceitar, cancelar e concluir seguem como modal).
 */
export function legacyModalTarget(pathname: string, search: string): string | null {
  const params = new URLSearchParams(search)
  // O pedido vem de ?pedido= ou, no detalhe, da própria rota.
  const order = readOrder(search) ?? new RegExp(`^/pedidos/(${uuid})(?:/|$)`, 'i').exec(pathname)?.[1]?.toLowerCase()
  switch (params.get('modal')) {
    case 'ajuda':
      return '/ajuda'
    case 'avaliar':
      return order ? `/pedidos/${order}/avaliar` : '/pedidos'
    case 'editar-pedido':
      return order ? `/pedidos/${order}/editar` : '/pedidos'
    case 'criar-pedido':
      return '/pedidos/novo'
    case 'finalizar-cadastro':
      return params.get('next') === 'criar-pedido' ? '/cadastro/finalizar?next=%2Fpedidos%2Fnovo' : '/cadastro/finalizar'
    default:
      return null
  }
}
