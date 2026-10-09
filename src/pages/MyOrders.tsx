import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Order } from '../data/dashboard'
import { PhotoPreview } from '../components/OrderAssistant'
import {
  customerOrders,
  orderDate,
  orderMoney,
  orderStatus,
} from '../services/orders'
import './MyOrders.css'

type Props = {
  orders: Order[]
  customerId: string | null
  orderId?: number
  search: string
  loading?: boolean
  error?: string
  onRetry?: () => void
}

function OrderStatus({ order }: { order: Order }) {
  return (
    <span className={`status-badge ${order.status === 'completed' ? 'progress' : order.status}`}>
      <i />{orderStatus[order.status]}
    </span>
  )
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <article className="panel order-summary">
      <h2>Pedido #{order.id} · {order.title}</h2>
      <OrderStatus order={order} />
      <dl>
        <div><dt>Data de realização</dt><dd>{orderDate(order.createdAt)}</dd></div>
        <div><dt>Categoria</dt><dd>{order.category}</dd></div>
        <div><dt>Localização</dt><dd>{order.location}</dd></div>
      </dl>
      <h3>Descrição</h3>
      <p>{order.description}</p>
      {order.scope && (
        <>
          <h3>Escopo solicitado</h3>
          <p>{order.scope.specifications}</p>
          <p>{order.scope.details}</p>
          <p>Urgência: {order.scope.urgency}</p>
          <PhotoPreview photos={order.scope.photos} />
        </>
      )}
      <h3>Produtos solicitados</h3>
      {order.items?.length ? (
        <div className="order-table">
          <table>
            <caption>Itens do pedido #{order.id}</caption>
            <thead>
              <tr>
                <th scope="col">Produto</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Preço unitário</th>
                <th scope="col">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <th scope="row">{item.name}</th>
                  <td>{item.quantity}</td>
                  <td>{orderMoney(item.unitPrice)}</td>
                  <td>{orderMoney(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p>Não há produtos informados para este pedido de serviço.</p>}
      <p><strong>Valor total: {orderMoney(order.total)}</strong></p>
    </article>
  )
}

export function MyOrders({ orders, customerId, orderId, search, loading, error, onRetry }: Props) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [orderId])
  const failure = error || (!customerId ? 'Entre na sua conta para consultar pedidos.' : '')
  const ownOrders = customerId ? customerOrders(orders, customerId) : []
  const selected = ownOrders.find((order) => order.id === orderId)
  const visible = ownOrders.filter((order) =>
    `${order.id} ${order.title} ${order.category}`
      .toLocaleLowerCase('pt-BR')
      .includes(search.toLocaleLowerCase('pt-BR')),
  )

  function renderContent() {
    if (loading) return <p role="status">Carregando pedidos…</p>
    if (failure) return (
      <div role="alert" className="panel order-summary">
        <p>{failure}</p>
        {onRetry && (
          <button className="button button-secondary" onClick={onRetry}>
            Tentar novamente
          </button>
        )}
      </div>
    )
    if (orderId !== undefined) return selected ? <OrderDetails order={selected} /> : (
      <div className="empty-state" role="status">
        <h2>Pedido não encontrado</h2>
        <p>Este pedido não está disponível para sua conta.</p>
      </div>
    )
    if (!visible.length) return (
      <div className="empty-state" role="status">
        <h2>{ownOrders.length ? 'Nenhum pedido encontrado' : 'Você ainda não tem pedidos'}</h2>
        <p>{ownOrders.length
          ? 'Tente buscar por outro identificador, título ou categoria.'
          : 'Crie um pedido pelo menu para começar.'}</p>
      </div>
    )
    return (
      <div className="my-orders-list">
        {visible.map((order) => (
          <article className="panel order-summary" key={order.id}>
            <h2>Pedido #{order.id} · {order.title}</h2>
            <OrderStatus order={order} />
            <p>Data de realização: {orderDate(order.createdAt)}</p>
            <p>Valor total: {orderMoney(order.total)}</p>
            <Link className="button button-secondary" to={`/pedidos/${order.id}`}
              aria-label={`Ver detalhes do pedido ${order.id}`}>
              Ver detalhes
            </Link>
          </article>
        ))}
      </div>
    )
  }

  return (
    <section className="my-orders">
      <div className="page-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {orderId === undefined ? 'Meus pedidos' : 'Detalhes do pedido'}
          </h1>
          <p>Pedidos criados nesta sessão. A consulta ao histórico da conta ainda não está disponível.</p>
        </div>
      </div>
      {orderId !== undefined && (
        <Link className="button button-secondary" to="/pedidos">Voltar para meus pedidos</Link>
      )}
      {renderContent()}
    </section>
  )
}
