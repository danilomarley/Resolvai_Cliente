import { useCallback, useState } from 'react'
import { Modal } from './Modal'
import { OrderAssistant } from './OrderAssistant'
import { OrderForm } from './OrderForm'
import { askAssistant, createOrder, uploadOrderPhoto } from '../services/dashboardApi'
import type { NewOrder } from '../types/orders'

/**
 * Modal "Criar pedido": começa pelo assistente de IA e termina no formulário de revisão.
 * Fechar com conteúdo preenchido pede confirmação; durante o envio o modal não fecha.
 */
export function CreateOrderModal({ token, onClose, onCreated }: {
  token: string
  onClose: () => void
  /** Recebe o id do pedido publicado. */
  onCreated: (orderId: string) => void
}) {
  const [mode, setMode] = useState<'assistant' | 'form'>('assistant')
  const [draft, setDraft] = useState<NewOrder>()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), [])

  function requestClose() {
    if (dirty && !submitting) setConfirming(true)
    else onClose()
  }

  async function publish(order: NewOrder, photos: File[]) {
    setSubmitting(true)
    setSubmitError('')
    try {
      // As fotos vão primeiro para o Storage pela API; o pedido é criado com as URLs devolvidas.
      const photoUrls: string[] = []
      for (const photo of photos) photoUrls.push(await uploadOrderPhoto(token, photo))
      const created = await createOrder(token, order, photoUrls)
      onCreated(created.id)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível publicar o pedido. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Criar pedido" size={mode === 'assistant' ? 'xl' : 'lg'} onClose={requestClose} dismissible={!submitting} scrollKey={mode}>
      {confirming && (
        <div className="dialog-stack" role="group" aria-labelledby="discard-title">
          <h3 id="discard-title">Descartar este pedido?</h3>
          <p>O que você contou ao assistente e preencheu no formulário será perdido.</p>
          <div className="modal-footer">
            <button type="button" className="button button-secondary" onClick={() => setConfirming(false)}>Continuar editando</button>
            <button type="button" className="button button-primary" onClick={onClose}>Descartar pedido</button>
          </div>
        </div>
      )}
      {/* O conteúdo fica montado (só oculto) para não perder a conversa ao pedir confirmação. */}
      <div hidden={confirming}>
        {mode === 'assistant'
          ? <OrderAssistant onAsk={(messages) => askAssistant(token, messages)} onDirtyChange={onDirtyChange}
            onManual={() => { setDraft(undefined); setMode('form') }}
            onReview={(order) => { setDraft(order); setMode('form') }} />
          : <OrderForm key={draft ? 'revisao' : 'manual'} initial={draft} submitting={submitting} submitError={submitError}
            onCancel={requestClose} onCreate={publish} onDirtyChange={onDirtyChange}
            onBackToAssistant={draft ? () => { setDirty(false); setMode('assistant') } : undefined} />}
      </div>
    </Modal>
  )
}
