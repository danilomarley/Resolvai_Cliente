import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Order } from '../data/dashboard'
import type { OrderStatusDto } from '../services/dashboardApi'
import { PhotoPreview } from '../components/OrderAssistant'
import {
  customerOrders,
  orderDate,
  orderMoney,
  orderStatusLabel,
} from '../services/orders'
import './MyOrders.css'

type Props = {
  orders: Order[]
  customerId: string | null
  orderId?: number | string
  search: string
  loading?: boolean
  error?: string
  onRetry?: () => void
  demonstration?: boolean
  view?: 'propostas' | 'acompanhar'
  filter?: { value?: OrderStatusDto; onChange: (value?: OrderStatusDto) => void }
  pager?: { page: number; totalPages: number; onPage: (page: number) => void }
}

const statusFilters: { value?: OrderStatusDto; label: string }[] = [
  { label: 'Todos' },
  { value: 'Pending', label: 'Recebendo propostas' },
  { value: 'InProgress', label: 'Em andamento' },
  { value: 'Completed', label: 'Concluídos' },
  { value: 'Cancelled', label: 'Cancelados' },
]
const orderNumber = (order: Order) =>
  typeof order.id === 'string' ? order.id.slice(0, 8).toUpperCase() : order.id
const proposalLabels = { Sent: 'Enviada', Viewed: 'Visualizada', Chosen: 'Escolhida' }
const trackingPath = (order: Order) =>
  `/pedidos/${order.id}/${order.status === 'waiting' ? 'propostas' : 'acompanhar'}`

function OrderStatus({ order }: { order: Order }) {
  return (
    <span className={`status-badge ${order.status === 'completed' ? 'progress' : order.status}`}>
      <i />{orderStatusLabel(order)}
    </span>
  )
}

function Proposals({ order }: { order: Order }) {
  const list = order.proposalList ?? []
  return (
    <article className="panel order-summary">
      <h2>Propostas do pedido #{orderNumber(order)}</h2>
      <OrderStatus order={order} />
      {list.length ? (
        <ul className="proposal-list">
          {list.map((proposal) => (
            <li className="proposal-item" key={proposal.id}>
              <strong>{proposal.providerName}</strong>
              <span className="status-badge progress"><i />{proposalLabels[proposal.status]}</span>
              <dl>
                <div><dt>Valor</dt><dd>{orderMoney(proposal.value)}</dd></div>
                <div><dt>Prazo</dt><dd>{proposal.deadline ?? 'Não informado'}</dd></div>
                <div><dt>Garantia</dt><dd>{proposal.warranty ?? 'Não informada'}</dd></div>
              </dl>
              {proposal.description && <p>{proposal.description}</p>}
            </li>
          ))}
        </ul>
      ) : <p>Nenhuma proposta recebida ainda. Assim que um profissional enviar, ela aparece aqui.</p>}
      <Link className="button button-secondary" to={`/pedidos/${order.id}`}>Ver detalhes do pedido</Link>
    </article>
  )
}

function Tracking({ order }: { order: Order }) {
  const chosen = order.proposalList?.find((proposal) => proposal.status === 'Chosen')
  const closed = order.status === 'completed' || order.status === 'cancelled'
  const history = [
    { label: 'Pedido criado', date: order.createdAt },
    ...(order.proposals ? [{ label: `${order.proposals} proposta(s) recebida(s)`, date: undefined }] : []),
    ...(chosen ? [{ label: `Proposta de ${chosen.providerName} escolhida`, date: undefined }] : []),
    ...(closed ? [{ label: order.status === 'completed' ? 'Pedido concluído' : 'Pedido cancelado', date: order.updatedAt }] : []),
  ]
  return (
    <article className="panel order-summary">
      <h2>{closed ? 'Informações gerais e histórico' : 'Andamento do pedido'} #{orderNumber(order)}</h2>
      <OrderStatus order={order} />
      <dl>
        <div><dt>Pedido</dt><dd>{order.title}</dd></div>
        <div><dt>Profissional</dt><dd>{chosen?.providerName ?? 'Não definido'}</dd></div>
        <div><dt>Valor combinado</dt><dd>{orderMoney(chosen?.value ?? order.chosenProposalValue)}</dd></div>
        <div><dt>Prazo</dt><dd>{chosen?.deadline ?? 'Não informado'}</dd></div>
        <div><dt>Garantia</dt><dd>{chosen?.warranty ?? 'Não informada'}</dd></div>
        <div><dt>Última atualização</dt><dd>{orderDate(order.updatedAt ?? order.createdAt)}</dd></div>
      </dl>
      <h3>Histórico</h3>
      <ol className="order-history">
        {history.map((event) => (
          <li key={event.label}>{event.label}{event.date ? ` em ${orderDate(event.date)}` : ''}</li>
        ))}
      </ol>
      <Link className="button button-secondary" to={`/pedidos/${order.id}`}>Ver detalhes do pedido</Link>
    </article>
  )
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <article className="panel order-summary">
      <h2>Pedido #{orderNumber(order)} · {order.title}</h2>
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
      {!!order.photoUrls?.length && (
        <div className="scope-photos">
          {order.photoUrls.map((url) => <img key={url} src={url} alt={`Foto do pedido ${order.title}`} />)}
        </div>
      )}
      {order.source !== 'api' && <h3>Produtos solicitados</h3>}
      {order.source === 'api' ? null : order.items?.length ? (
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
      {order.source !== 'api' && <p><strong>Valor total: {orderMoney(order.total)}</strong></p>}
    </article>
  )
}

export function MyOrders({ orders, customerId, orderId, search, loading, error, onRetry, demonstration, view, filter, pager }: Props) {
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

  const filterBar = filter && (
    <div className="order-filters" role="group" aria-label="Filtrar por status">
      {statusFilters.map((item) => (
        <button key={item.label} className={`button ${filter.value === item.value ? 'button-primary' : 'button-secondary'}`}
          aria-pressed={filter.value === item.value} onClick={() => filter.onChange(item.value)}>
          {item.label}
        </button>
      ))}
    </div>
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
    if (orderId !== undefined) return selected ? (
      view === 'propostas' ? <Proposals order={selected} />
        : view === 'acompanhar' ? <Tracking order={selected} />
        : <OrderDetails order={selected} />
    ) : (
      <div className="empty-state" role="status">
        <h2>Pedido não encontrado</h2>
        <p>Este pedido não está disponível para sua conta.</p>
      </div>
    )
    if (!visible.length) return (<>
      {filterBar}
      <div className="empty-state" role="status">
        <h2>{ownOrders.length ? 'Nenhum pedido encontrado' : 'Você ainda não tem pedidos'}</h2>
        <p>{ownOrders.length
          ? 'Tente buscar por outro identificador, título ou categoria.'
          : 'Crie um pedido pelo menu para começar.'}</p>
      </div>
    </>)
    return (<>
      {filterBar}
      <div className="my-orders-list">
        {visible.map((order) => (
          <article className="panel order-summary" key={order.id}>
            <h2>Pedido #{orderNumber(order)} · {order.title}</h2>
            <OrderStatus order={order} />
            <p>Data de realização: {orderDate(order.createdAt)}</p>
            {(order.source !== 'api' || order.total !== undefined) && <p>Valor total: {orderMoney(order.total)}</p>}
            <Link className="button button-secondary" to={`/pedidos/${order.id}`}
              aria-label={`Ver detalhes do pedido ${order.id}`}>
              Ver detalhes
            </Link>
            {order.source === 'api' && (
              <div className="order-actions">
                {order.proposals > 0 && (
                  <Link className="button button-secondary" to={`/pedidos/${order.id}/propostas`}
                    aria-label={`Ver propostas do pedido ${order.id}`}>
                    Ver propostas ({order.proposals})
                  </Link>
                )}
                <Link className="button button-primary" to={trackingPath(order)}
                  aria-label={`Acompanhar pedido ${order.id}`}>
                  Acompanhar pedido
                </Link>
              </div>
            )}
          </article>
        ))}
      </div>
      {pager && pager.totalPages > 1 && (
        <nav className="order-pager" aria-label="Paginação dos pedidos">
          <button className="button button-secondary" disabled={pager.page <= 1}
            onClick={() => pager.onPage(pager.page - 1)}>Anterior</button>
          <span>Página {pager.page} de {pager.totalPages}</span>
          <button className="button button-secondary" disabled={pager.page >= pager.totalPages}
            onClick={() => pager.onPage(pager.page + 1)}>Próxima</button>
        </nav>
      )}
    </>)
  }

  return (
    <section className="my-orders">
      <div className="page-heading">
        <div>
          <h1 ref={heading} tabIndex={-1}>
            {orderId === undefined ? 'Meus pedidos' : 'Detalhes do pedido'}
          </h1>
          <p>{demonstration ? 'Pedidos desta demonstração, incluindo os criados nesta sessão.'
            : orderId === undefined ? 'Todos os seus pedidos, do mais recente ao mais antigo.' : 'Informações do pedido selecionado.'}</p>
        </div>
      </div>
      {orderId !== undefined && (
        <Link className="button button-secondary" to="/pedidos">Voltar para meus pedidos</Link>
      )}
      {renderContent()}
    </section>
  )
}
