import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { OrderForm } from '../../components/OrderForm'
import { updateOrder, uploadOrderPhoto } from '../../services/dashboardApi'
import { canChangeOrder, orderToForm } from '../../services/orders'
import type { NewOrder, Order } from '../../types/orders'
import type { ApiError } from '../../services/api'
import '../NewOrder/NewOrder.css'

/**
 * Editar pedido (/pedidos/:id/editar), #88: reaproveita o formulário de criação, já preenchido com os dados do pedido.
 * Sair com alterações não salvas pede confirmação (também ao recarregar ou fechar a aba).
 */
export function EditOrderPage({ orderId, order, loading, error, token, onSaved, onRetry }: {
  orderId: string
  order?: Order
  loading: boolean
  error?: ApiError
  token: string
  onSaved: () => void
  onRetry: () => void
}) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [dirty, setDirty] = useState(false)
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), [])
  const back = <Link className="button button-secondary" to={`/pedidos/${orderId}`}>Voltar para o pedido</Link>

  // Recarregar ou fechar a aba com alterações no formulário: o navegador pede confirmação.
  useEffect(() => {
    if (!dirty || submitting) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, submitting])

  async function save(changes: NewOrder, photos: File[], savedPhotos: string[]) {
    setSubmitting(true)
    setSubmitError('')
    try {
      // A API troca o pedido inteiro: vão as fotos que ficaram e as novas, já enviadas ao Storage.
      const uploaded: string[] = []
      for (const photo of photos) uploaded.push(await uploadOrderPhoto(token, photo))
      await updateOrder(token, orderId, changes, [...savedPhotos, ...uploaded])
      // Já salvo: sair da página agora não perde nada.
      setDirty(false)
      onSaved()
    } catch (failure) {
      setSubmitError(failure instanceof Error ? failure.message : 'Não foi possível salvar o pedido. Tente novamente.')
      setSubmitting(false)
    }
  }

  function cancel() {
    if (!dirty || window.confirm('Descartar as alterações? O que você mudou neste pedido ainda não foi salvo.')) navigate(`/pedidos/${orderId}`)
  }

  if (loading) return <p role="status">Carregando pedido…</p>
  if (error || !order) return (
    <article className="panel order-summary" role="alert">
      <h1>Editar pedido</h1>
      <p>{!error || error.status === 404 ? 'Este pedido não está disponível para sua conta.' : error.message}</p>
      {error && error.status !== 404 && <button type="button" className="button button-secondary" onClick={onRetry}>Tentar novamente</button>}
      <Link className="button button-secondary" to="/pedidos">Voltar para meus pedidos</Link>
    </article>
  )
  if (!canChangeOrder(order)) return (
    <article className="panel order-summary" role="alert">
      <h1>Editar pedido</h1>
      <p>Este pedido não pode mais ser alterado: ele já foi cancelado, concluído, está em andamento ou teve uma proposta aceita.</p>
      {back}
    </article>
  )

  return (
    <div className="new-order-page">
      {back}
      <OrderForm key={order.id} initial={orderToForm(order)} savedPhotos={order.photoUrls ?? []} submitting={submitting}
        submitError={submitError} onCancel={cancel} onCreate={save} onDirtyChange={onDirtyChange} />
    </div>
  )
}
