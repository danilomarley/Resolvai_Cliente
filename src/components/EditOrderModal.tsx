import { useCallback, useState } from 'react'
import { Modal } from './Modal'
import { OrderForm } from './OrderForm'
import { updateOrder, uploadOrderPhoto } from '../services/dashboardApi'
import { orderToForm } from '../services/orders'
import type { NewOrder, Order } from '../types/orders'

/**
 * Modal "Editar pedido" (#88): reaproveita o formulário de criação, já preenchido com os dados do pedido.
 * Fechar com alterações pede confirmação; durante o envio o modal não fecha.
 */
export function EditOrderModal({ order, token, onClose, onSaved }: {
  order: Order
  token: string
  onClose: () => void
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), [])

  function requestClose() {
    if (dirty && !submitting) setConfirming(true)
    else onClose()
  }

  async function save(changes: NewOrder, photos: File[], savedPhotos: string[]) {
    setSubmitting(true)
    setSubmitError('')
    try {
      // A API troca o pedido inteiro: vão as fotos que ficaram e as novas, já enviadas ao Storage.
      const uploaded: string[] = []
      for (const photo of photos) uploaded.push(await uploadOrderPhoto(token, photo))
      await updateOrder(token, order.id, changes, [...savedPhotos, ...uploaded])
      onSaved()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível salvar o pedido. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Editar pedido" size="lg" onClose={requestClose} dismissible={!submitting}>
      {confirming && (
        <div className="dialog-stack" role="group" aria-labelledby="discard-edit-title">
          <h3 id="discard-edit-title">Descartar as alterações?</h3>
          <p>O que você mudou neste pedido ainda não foi salvo.</p>
          <div className="modal-footer">
            <button type="button" className="button button-secondary" onClick={() => setConfirming(false)}>Continuar editando</button>
            <button type="button" className="button button-primary" onClick={onClose}>Descartar alterações</button>
          </div>
        </div>
      )}
      {/* O formulário fica montado (só oculto) para não perder o que foi digitado ao pedir confirmação. */}
      <div hidden={confirming}>
        <OrderForm initial={orderToForm(order)} savedPhotos={order.photoUrls ?? []} submitting={submitting}
          submitError={submitError} onCancel={requestClose} onCreate={save} onDirtyChange={onDirtyChange} />
      </div>
    </Modal>
  )
}
