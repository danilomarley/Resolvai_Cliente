import type { Order } from '../types/orders'

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
