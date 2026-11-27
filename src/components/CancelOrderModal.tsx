import { useState } from 'react'
import { Modal } from './Modal'
import { cancelOrder } from '../services/dashboardApi'
import type { Order } from '../types/orders'

export const maxCancelReason = 500

/** Modal de confirmação do cancelamento (#88), com o motivo opcional. Durante o envio o modal não fecha. */
export function CancelOrderModal({ order, token, onClose, onCancelled }: {
  order: Order
  token: string
  onClose: () => void
  onCancelled: () => void
}) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await cancelOrder(token, order.id, reason)
      onCancelled()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível cancelar o pedido. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Cancelar pedido" size="sm" dismissible={!submitting} onClose={onClose}
      description={`O pedido "${order.title}" deixa de receber propostas e as propostas já enviadas são encerradas. Esta ação não pode ser desfeita.`}
      footer={<>
        <button type="button" className="button button-secondary" disabled={submitting} onClick={onClose}>Manter pedido</button>
        <button type="button" className="button button-danger" disabled={submitting} onClick={confirm}>
          {submitting ? 'Cancelando…' : 'Cancelar pedido'}
        </button>
      </>}>
      <label>Motivo do cancelamento <span className="scope-field-hint">Opcional</span>
        <textarea rows={3} maxLength={maxCancelReason} value={reason} disabled={submitting}
          onChange={(event) => setReason(event.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
