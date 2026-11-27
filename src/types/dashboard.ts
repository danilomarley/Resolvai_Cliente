export type Dialog = 'create' | 'profile' | 'help' | null
export type Tab = 'all' | 'waiting' | 'progress'

/** Itens do menu lateral; também nomeiam o destino em `navigate`. */
export type NavKey = 'Visão geral' | 'Criar pedido' | 'Meus pedidos' | 'Propostas' | 'Avaliações'
/** Para onde abrir um pedido a partir de um card. */
export type OrderTarget = 'detalhes' | 'propostas'

export type Profile = {
  name: string
  location: string
}
