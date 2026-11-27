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

export const hasChosenProposal = (order: Order) => !!order.proposalList?.some((proposal) => proposal.status === 'Chosen')

/**
 * Com uma proposta aceita o pedido segue aberto até o pagamento. O estágio vem da API (lista e detalhe);
 * sem ele, a proposta escolhida no detalhe ainda evita dizer que o pedido recebe propostas.
 */
export const orderStatusLabel = (order: Order) => {
  if (order.status !== 'waiting') return orderStatus[order.status]
  if (order.stage === 'AwaitingSignatures') return 'Aguardando assinaturas'
  if (order.stage === 'AwaitingPayment') return 'Aguardando pagamento'
  return hasChosenProposal(order) ? 'Proposta aceita' : orderStatus.waiting
}

export const orderDate = (value?: string) => value
  ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  : 'Data não informada'

export const orderMoney = (value?: number) => value === undefined
  ? 'Valor não informado'
  : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Editar e cancelar só valem enquanto o pedido recebe propostas e nenhuma foi aceita (#88). */
export const canChangeOrder = (order: Order) => order.status === 'waiting' && !order.stage && !hasChosenProposal(order)

/** A aba Pagamento existe quando há contrato assinado por ambos (aguardando pagamento) ou o pedido já foi pago. */
export const hasPaymentStep = (order: Order) =>
  order.stage === 'AwaitingPayment' || ((order.status === 'progress' || order.status === 'completed') && hasChosenProposal(order))

export type NextStep = { text: string; label: string; to?: string; action?: 'complete' }

/** O que o contratante precisa fazer agora, para a lista e o detalhe apontarem sempre o mesmo caminho. */
export function nextStep(order: Order): NextStep | undefined {
  const base = `/pedidos/${order.id}`
  if (order.status === 'waiting' && order.stage === 'AwaitingSignatures')
    return { text: 'Leia o contrato e assine para seguir. O pagamento só começa depois que o prestador também assinar.', label: 'Ver e assinar contrato', to: `${base}/contrato` }
  if (order.status === 'waiting' && order.stage === 'AwaitingPayment')
    return { text: 'O contrato está assinado pelas duas partes. Pague por Pix para o serviço começar.', label: 'Pagar com Pix', to: `${base}/pagamento` }
  if (order.status === 'progress')
    return { text: 'O pagamento foi confirmado. Quando o serviço estiver pronto, confirme a conclusão para poder avaliar o prestador.', label: 'Confirmar conclusão', action: 'complete' }
  return undefined
}

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
