import type { Order } from '../data/dashboard'

// Local prototype adapter. A backend must enforce ownership using its session.
export const demoCustomerId = 'demo-customer'

export function customerOrders(orders: Order[], customerId: string | null) {
  if (!customerId) throw new Error('Entre na sua conta para consultar pedidos.')
  return orders.filter((order) => order.customerId === customerId)
}

export function customerOrder(orders: Order[], customerId: string | null, id: number) {
  return customerOrders(orders, customerId).find((order) => order.id === id)
}

export const orderStatus = {
  waiting: 'Aguardando propostas',
  progress: 'Em andamento',
  completed: 'Concluído',
}

export const orderDate = (value?: string) => value
  ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  : 'Data não informada'

export const orderMoney = (value?: number) => value === undefined
  ? 'Valor não informado'
  : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
