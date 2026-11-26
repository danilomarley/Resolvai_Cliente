import type { NewOrder, Order } from '../types/orders'

export function customerOrders(orders: Order[], customerId: string | null) {
  if (!customerId) throw new Error('Entre na sua conta para consultar pedidos.')
  return orders.filter((order) => order.customerId === customerId)
}

export function customerOrder(orders: Order[], customerId: string | null, id: string) {
  return customerOrders(orders, customerId).find((order) => order.id.toLowerCase() === id.toLowerCase())
}

export const orderStatus = {
  waiting: 'Recebendo propostas',
  progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const orderStatusLabel = (order: Order) => orderStatus[order.status]

export const orderDate = (value?: string) => value
  ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  : 'Data não informada'

export const orderMoney = (value?: number) => value === undefined
  ? 'Valor não informado'
  : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Editar e cancelar só valem enquanto o pedido recebe propostas e nenhuma foi aceita (#88). */
export const canChangeOrder = (order: Order) =>
  order.status === 'waiting' && !order.proposalList?.some((proposal) => proposal.status === 'Chosen')

/** Valores do formulário de edição; os textos de apoio da tela ("Pedido", "Localização não informada") não são dados do pedido. */
export function orderToForm(order: Order): NewOrder {
  return {
    title: order.title,
    category: order.category === 'Pedido' ? '' : order.category,
    description: order.description.startsWith('Abra os detalhes') ? '' : order.description,
    location: order.location === 'Localização não informada' ? '' : order.location,
    scope: { details: order.scope?.details ?? '', urgency: order.scope?.urgency ?? '', specifications: order.scope?.specifications ?? '' },
  }
}
