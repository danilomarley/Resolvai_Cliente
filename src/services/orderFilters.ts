import type { OrderStageFilter, OrderStatusDto } from './dashboardApi'

/** Filtro da lista de pedidos: status e, para os abertos, o estágio (o mesmo da etiqueta de cada pedido). */
export type OrderFilter = { status: OrderStatusDto; stage?: OrderStageFilter }

export const statusFilters: { value?: OrderFilter; label: string }[] = [
  { label: 'Todos' },
  { value: { status: 'Pending', stage: 'Open' }, label: 'Recebendo propostas' },
  { value: { status: 'Pending', stage: 'AwaitingSignatures' }, label: 'Aguardando assinaturas' },
  { value: { status: 'Pending', stage: 'AwaitingPayment' }, label: 'Aguardando pagamento' },
  { value: { status: 'InProgress' }, label: 'Em andamento' },
  { value: { status: 'Completed' }, label: 'Concluídos' },
  { value: { status: 'Cancelled' }, label: 'Cancelados' },
]

export const sameFilter = (a?: OrderFilter, b?: OrderFilter) => a?.status === b?.status && a?.stage === b?.stage
