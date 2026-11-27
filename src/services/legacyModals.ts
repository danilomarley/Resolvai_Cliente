/**
 * Links antigos abriam algumas telas como modal (?modal=nome). Hoje cada uma é uma página: devolve o
 * endereço novo, ou null quando o parâmetro não é de uma tela que mudou (aceitar, cancelar e concluir seguem como modal).
 */
export function legacyModalTarget(_pathname: string, search: string): string | null {
  const params = new URLSearchParams(search)
  switch (params.get('modal')) {
    case 'finalizar-cadastro':
      return params.get('next') === 'criar-pedido' ? '/cadastro/finalizar?next=%2Fpedidos%2Fnovo' : '/cadastro/finalizar'
    default:
      return null
  }
}
