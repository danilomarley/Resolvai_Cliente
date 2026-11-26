import { useState } from 'react'
import { Modal } from './Modal'
import { orderMoney } from '../services/orders'
import { acceptProposal, type ProposalDto } from '../services/proposalsApi'
import type { Order } from '../types/orders'

/** Confirmação do aceite (#89). Durante o envio o modal não fecha; erros da API aparecem no próprio modal. */
export function AcceptProposalModal({ order, proposal, token, onClose, onAccepted }: {
  order: Order
  proposal: ProposalDto
  token: string
  onClose: () => void
  onAccepted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await acceptProposal(order.id, proposal.id, token)
      onAccepted()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível aceitar a proposta. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Aceitar proposta" size="sm" dismissible={!submitting} onClose={onClose}
      description={`Você vai contratar ${proposal.providerName} por ${orderMoney(proposal.value)}${proposal.deadline ? `, com prazo de ${proposal.deadline}` : ''}.`}
      footer={<>
        <button type="button" className="button button-secondary" disabled={submitting} onClick={onClose}>Voltar</button>
        <button type="button" className="button button-primary" disabled={submitting} onClick={confirm}>
          {submitting ? 'Aceitando…' : 'Aceitar proposta'}
        </button>
      </>}>
      <ul className="accept-notes">
        <li>As demais propostas do pedido serão encerradas.</li>
        <li>O serviço começa depois do contrato e do pagamento.</li>
      </ul>
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
