import { useState } from 'react'
import { Modal } from './Modal'
import { completeOrder } from '../services/dashboardApi'
import type { Order } from '../types/orders'

/** Modal de confirmação da conclusão do serviço (#92): depois dele o pedido fica concluído e pode ser avaliado. */
export function CompleteOrderModal({ order, token, onClose, onCompleted }: {
  order: Order
  token: string
  onClose: () => void
  onCompleted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      await completeOrder(token, order.id)
      onCompleted()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível confirmar a conclusão. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Confirmar conclusão" size="sm" dismissible={!submitting} onClose={onClose}
      description={`Confirme que o serviço "${order.title}" foi feito. Depois disso você poderá avaliar o prestador. Esta ação não pode ser desfeita.`}
      footer={<>
        <button type="button" className="button button-secondary" disabled={submitting} onClick={onClose}>Ainda não</button>
        <button type="button" className="button button-primary" disabled={submitting} onClick={confirm}>
          {submitting ? 'Confirmando…' : 'Confirmar conclusão'}
        </button>
      </>}>
      {error && <p role="alert">{error}</p>}
    </Modal>
  )
}
