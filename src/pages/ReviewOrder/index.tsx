import { Link } from 'react-router-dom'
import { OrderReview } from '../../components/OrderReview'
import type { ApiError } from '../../services/api'
import type { Order } from '../../types/orders'

/** Avaliar serviço (/pedidos/:id/avaliar): carrega o pedido e mostra a avaliação, ou o motivo de ela não estar disponível. */
export function ReviewOrderPage({ orderId, order, loading, error, token, onSaved, onRetry }: {
  orderId: string
  order?: Order
  loading: boolean
  error?: ApiError
  token: string
  onSaved: () => void
  onRetry: () => void
}) {
  if (loading) return <p role="status">Carregando pedido…</p>
  if (error || !order) return (
    <article className="panel order-summary" role="alert">
      <h1>Avaliar serviço</h1>
      <p>{!error || error.status === 404 ? 'Este pedido não está disponível para sua conta.' : error.message}</p>
      {error && error.status !== 404 && <button type="button" className="button button-secondary" onClick={onRetry}>Tentar novamente</button>}
      <Link className="button button-secondary" to="/pedidos">Voltar para meus pedidos</Link>
    </article>
  )
  return <OrderReview key={`${token}:${orderId}`} order={order} token={token} onSaved={onSaved} />
}
