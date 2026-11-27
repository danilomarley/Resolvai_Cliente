import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OrderAssistant } from '../../components/OrderAssistant'
import { OrderForm } from '../../components/OrderForm'
import { askAssistant, createOrder, uploadOrderPhoto } from '../../services/dashboardApi'
import { draftHasContent, emptyDraft, orderDraftStore, type OrderDraft } from '../../services/orderDraftStore'
import type { NewOrder } from '../../types/orders'
import './NewOrder.css'

/**
 * Criar pedido (/pedidos/novo): começa pelo assistente de IA e termina no formulário de revisão. O rascunho
 * (conversa e campos) fica guardado na aba; recarregar a página ou sair e voltar não perde o que foi feito.
 */
export function NewOrderPage({ token, customerId, onCreated }: {
  token: string
  customerId: string
  /** Recebe o id do pedido publicado. */
  onCreated: (orderId: string) => void
}) {
  const navigate = useNavigate()
  const [saved] = useState(() => orderDraftStore.read(customerId))
  const [draft, setDraft] = useState<OrderDraft>(() => saved ?? emptyDraft())
  // Aviso de rascunho recuperado: só quando já havia conteúdo guardado ao abrir a página.
  const [restored, setRestored] = useState(() => !!saved && draftHasContent(saved))
  const [confirming, setConfirming] = useState(false)
  const [round, setRound] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => { orderDraftStore.write(customerId, draft) }, [customerId, draft])

  function discard() {
    orderDraftStore.clear(customerId)
    setDraft(emptyDraft())
    setRestored(false)
    setConfirming(false)
    setSubmitError('')
    // Recomeça com a conversa e o formulário vazios.
    setRound((value) => value + 1)
  }

  async function publish(order: NewOrder, photos: File[]) {
    setSubmitting(true)
    setSubmitError('')
    try {
      // As fotos vão primeiro para o Storage pela API; o pedido é criado com as URLs devolvidas.
      const photoUrls: string[] = []
      for (const photo of photos) photoUrls.push(await uploadOrderPhoto(token, photo))
      const created = await createOrder(token, order, photoUrls)
      orderDraftStore.clear(customerId)
      onCreated(created.id)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível publicar o pedido. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <div className="new-order-page">
      <Link className="button button-secondary" to="/pedidos">Voltar para meus pedidos</Link>
      {restored && (
        <div className="draft-notice" role="status">
          {confirming
            ? <>
              <p>Descartar o rascunho? A conversa e os campos preenchidos serão apagados.</p>
              <div className="draft-actions">
                <button type="button" className="button button-secondary" onClick={() => setConfirming(false)}>Manter rascunho</button>
                <button type="button" className="button button-primary" onClick={discard}>Descartar</button>
              </div>
            </>
            : <>
              <p>Recuperamos o rascunho do seu pedido.{draft.step === 'form' ? ' As fotos precisam ser escolhidas de novo.' : ''}</p>
              <button type="button" className="text-button" disabled={submitting} onClick={() => setConfirming(true)}>Descartar rascunho</button>
            </>}
        </div>
      )}
      {draft.step === 'assistant'
        ? <OrderAssistant key={`assistant-${round}`} initial={draft.assistant}
          onAsk={(messages) => askAssistant(token, messages)}
          onStateChange={(assistant) => setDraft((current) => ({ ...current, assistant }))}
          onManual={() => setDraft((current) => ({ ...current, step: 'form', form: undefined, fromAssistant: false }))}
          onReview={(order) => setDraft((current) => ({ ...current, step: 'form', form: order, fromAssistant: true }))} />
        : <OrderForm key={`form-${draft.fromAssistant ? 'revisao' : 'manual'}-${round}`} initial={draft.form}
          submitting={submitting} submitError={submitError}
          onCancel={() => navigate('/pedidos')} onCreate={publish}
          onValuesChange={(form) => setDraft((current) => ({ ...current, form }))}
          onBackToAssistant={draft.fromAssistant ? () => setDraft((current) => ({ ...current, step: 'assistant' })) : undefined} />}
    </div>
  )
}
