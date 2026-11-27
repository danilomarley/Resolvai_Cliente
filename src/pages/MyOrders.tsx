import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { modalLink } from '../services/modalRoute'
import type { Order } from '../types/orders'
import { ProposalsPanel } from '../components/ProposalsPanel'
import { ContractPanel } from '../components/ContractPanel'
import { PaymentPanel } from '../components/PaymentPanel'
import { sameFilter, statusFilters, type OrderFilter } from '../services/orderFilters'
import {
  canChangeOrder,
  hasChosenProposal,
  hasPaymentStep,
  nextStep,
  customerOrders,
  customerOrder,
  orderDate,
  orderMoney,
  orderStatusLabel,
} from '../services/orders'
import './MyOrders.css'

type Props = {
  orders: Order[]
  customerId: string | null
  orderId?: string
  search: string
  loading?: boolean
  error?: string
  requiresLogin?: boolean
  onRetry?: () => void
  view?: 'propostas' | 'acompanhar' | 'contrato' | 'pagamento'
  /** Proposta aberta em /pedidos/:id/propostas/:proposalId. */
  proposalId?: string
  /** Token da sessão; as propostas são consultadas na API (#86). */
  token?: string | null
  /** Chamado depois que o contratante aceita uma proposta (#89), para recarregar o pedido. */
  onProposalAccepted?: () => void
  /** Chamado depois que o contratante assina o contrato (#95), para recarregar o pedido. */
  onContractSigned?: () => void
  /** Chamado quando o prestador também assina e o contrato fica assinado pelas duas partes, para o pedido seguir ao pagamento. */
  onContractCompleted?: () => void
  /** Chamado quando o Pix é confirmado (#97), para recarregar o pedido, que passa a Em andamento. */
  onPaid?: () => void
  /** Título e descrição da listagem; os atalhos do menu (Propostas, Avaliações) trocam o padrão. */
  heading?: { title: string; description: string }
  filter?: { value?: OrderFilter; onChange: (value?: OrderFilter) => void }
  pager?: { page: number; totalPages: number; onPage: (page: number) => void }
}

const orderNumber = (order: Order) => order.id.slice(0, 8).toUpperCase()

/** Título da página de um pedido por aba; o foco vai para ele ao trocar de aba, e o leitor de tela anuncia a nova seção. */
const tabHeadings = { propostas: 'Propostas do pedido', contrato: 'Contrato do pedido', pagamento: 'Pagamento do pedido', acompanhar: 'Acompanhamento do pedido' }

/** Seções do pedido: cada aba é uma rota (/pedidos/:id, /propostas, /acompanhar). */
function OrderTabs({ order, view }: { order: Order; view?: 'propostas' | 'acompanhar' | 'contrato' | 'pagamento' }) {
  const base = `/pedidos/${order.id}`
  const tabs = [
    { key: undefined, label: 'Detalhes', to: base },
    { key: 'propostas', label: order.proposals ? `Propostas (${order.proposals})` : 'Propostas', to: `${base}/propostas` },
    // O contrato existe depois que uma proposta é aceita.
    ...(hasChosenProposal(order) ? [{ key: 'contrato', label: 'Contrato', to: `${base}/contrato` }] : []),
    // Com o contrato assinado pelas duas partes o pedido espera o pagamento; depois de pago a aba mostra o comprovante.
    ...(hasPaymentStep(order) ? [{ key: 'pagamento', label: 'Pagamento', to: `${base}/pagamento` }] : []),
    { key: 'acompanhar', label: 'Acompanhamento', to: `${base}/acompanhar` },
  ]
  return (
    <nav className="order-tabs" aria-label="Seções do pedido">
      {tabs.map((tab) => (
        <Link key={tab.label} to={tab.to} className={`order-tab${view === tab.key ? ' active' : ''}`}
          aria-current={view === tab.key ? 'page' : undefined}>{tab.label}</Link>
      ))}
    </nav>
  )
}

function OrderStatus({ order }: { order: Order }) {
  return (
    <span className={`status-badge ${order.status}`}>
      <i />{orderStatusLabel(order)}
    </span>
  )
}

/** O que o contratante precisa fazer agora; leva à tela certa (contrato, pagamento) ou abre a confirmação de conclusão. */
function NextStepCard({ order }: { order: Order }) {
  const location = useLocation()
  const step = nextStep(order)
  if (!step) return null
  return (
    <section className="next-step" aria-label="Próximo passo">
      <strong>Próximo passo</strong>
      <p>{step.text}</p>
      {step.to
        ? <Link className="button button-primary" to={step.to}>{step.label}</Link>
        : <Link className="button button-primary" {...modalLink(location.pathname, location.search, 'concluir-pedido', order.id)}>{step.label}</Link>}
    </section>
  )
}

function Tracking({ order }: { order: Order }) {
  const chosen = order.proposalList?.find((proposal) => proposal.status === 'Chosen')
  const closed = order.status === 'completed' || order.status === 'cancelled'
  // Os passos intermediários saem do estágio: depois do pagamento o contrato já estava assinado pelas duas partes.
  const paid = !!chosen && (order.status === 'progress' || order.status === 'completed')
  const signed = !!chosen && (order.stage === 'AwaitingPayment' || paid)
  const history = [
    { label: 'Pedido criado', date: order.createdAt },
    ...(order.proposals ? [{ label: `${order.proposals} proposta(s) recebida(s)`, date: undefined }] : []),
    ...(chosen ? [{ label: `Proposta de ${chosen.providerName} escolhida`, date: undefined }] : []),
    ...(signed ? [{ label: 'Contrato assinado pelas duas partes', date: undefined }] : []),
    ...(paid ? [{ label: 'Pagamento confirmado', date: undefined }] : []),
    ...(closed ? [{ label: order.status === 'completed' ? 'Pedido concluído' : 'Pedido cancelado', date: order.updatedAt }] : []),
  ]
  return (
    <article className="panel order-summary">
      <h2>{closed ? 'Informações gerais e histórico' : 'Andamento do pedido'} #{orderNumber(order)}</h2>
      <OrderStatus order={order} />
      <NextStepCard order={order} />
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
    </article>
  )
}

function OrderDetails({ order }: { order: Order }) {
  const location = useLocation()
  return (
    <article className="panel order-summary">
      <h2>Pedido #{orderNumber(order)} · {order.title}</h2>
      <OrderStatus order={order} />
      <NextStepCard order={order} />
      {order.status === 'completed' && <Link className="button button-primary" to={`/pedidos/${order.id}/avaliar`}>Avaliar serviço</Link>}
      {canChangeOrder(order) && (
        <div className="order-actions">
          <Link className="button button-secondary" to={`/pedidos/${order.id}/editar`}>Editar pedido</Link>
          <Link className="button button-secondary" {...modalLink(location.pathname, location.search, 'cancelar-pedido', order.id)}>Cancelar pedido</Link>
        </div>
      )}
      <dl>
        <div><dt>Data de realização</dt><dd>{orderDate(order.createdAt)}</dd></div>
        {order.updatedAt && <div><dt>Última atualização</dt><dd>{orderDate(order.updatedAt)}</dd></div>}
        {order.category !== 'Pedido' && <div><dt>Categoria</dt><dd>{order.category}</dd></div>}
        {order.location !== 'Localização não informada' && <div><dt>Localização</dt><dd>{order.location}</dd></div>}
      </dl>
      {order.status === 'cancelled' && order.cancellationReason && (
        <>
          <h3>Motivo do cancelamento</h3>
          <p>{order.cancellationReason}</p>
        </>
      )}
      <h3>Descrição</h3>
      <p>{order.description}</p>
      {order.scope && (
        <>
          <h3>Escopo solicitado</h3>
          <p>{order.scope.specifications}</p>
          <p>{order.scope.details}</p>
          <p>Urgência: {order.scope.urgency}</p>
        </>
      )}
      {!!order.photoUrls?.length && (
        <div className="scope-photos">
          {order.photoUrls.map((url) => <img key={url} src={url} alt={`Foto do pedido ${order.title}`} />)}
        </div>
      )}
    </article>
  )
}

export function MyOrders({ orders, customerId, orderId, search, loading, error, requiresLogin, onRetry, view, proposalId, token, onProposalAccepted, onContractSigned, onContractCompleted, onPaid, heading: listHeading, filter, pager }: Props) {
  const location = useLocation()
  const heading = useRef<HTMLHeadingElement>(null)
  // Trocar de pedido ou de aba leva o foco ao título da página (abrir uma proposta também).
  useEffect(() => { heading.current?.focus() }, [orderId, view, proposalId])
  const failure = error || (!customerId ? 'Entre na sua conta para consultar pedidos.' : '')
  const ownOrders = customerId ? customerOrders(orders, customerId) : []
  const selected = customerId && orderId !== undefined ? customerOrder(orders, customerId, orderId) : undefined
  const query = search.trim().toLocaleLowerCase('pt-BR')
  const visible = ownOrders.filter((order) =>
    `${order.id} ${order.title}`
      .toLocaleLowerCase('pt-BR')
      .includes(query),
  )

  const filterBar = filter && (
    <div className="order-filters" role="group" aria-label="Filtrar por status">
      {statusFilters.map((item) => (
        <button key={item.label} className={`button ${sameFilter(filter.value, item.value) ? 'button-primary' : 'button-secondary'}`}
          aria-pressed={sameFilter(filter.value, item.value)} onClick={() => filter.onChange(item.value)}>
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
        {requiresLogin && <Link to="/login" state={{ from: orderId === undefined ? '/pedidos' : `/pedidos/${orderId}` }}>Entrar novamente</Link>}
      </div>
    )
    if (orderId !== undefined) return selected ? (<>
      <OrderTabs order={selected} view={view} />
      {view === 'propostas' ? <ProposalsPanel key={selected.id} order={selected} token={token} proposalId={proposalId} onAccepted={onProposalAccepted} />
        : view === 'contrato' ? <ContractPanel key={selected.id} order={selected} token={token} onSigned={onContractSigned} onBothSigned={onContractCompleted}
          onPay={hasPaymentStep(selected) ? `/pedidos/${selected.id}/pagamento` : undefined} />
        : view === 'pagamento' ? <PaymentPanel key={selected.id} order={selected} token={token} onPaid={onPaid} />
        : view === 'acompanhar' ? <Tracking order={selected} />
        : <OrderDetails order={selected} />}
    </>) : (
      <div className="empty-state" role="status">
        <h2>Pedido não encontrado</h2>
        <p>Este pedido não está disponível para sua conta.</p>
      </div>
    )
    if (!visible.length) return (<>
      {filterBar}
      <div className="empty-state" role="status">
        <h2>{ownOrders.length ? 'Nenhum pedido encontrado' : filter?.value ? 'Nenhum pedido neste filtro' : 'Você ainda não tem pedidos'}</h2>
        <p>{ownOrders.length
          ? 'Tente buscar por outro identificador ou título entre os pedidos desta página.'
          : filter?.value ? 'Escolha outro filtro para ver seus demais pedidos.' : 'Seus pedidos aparecerão aqui quando estiverem disponíveis.'}</p>
        {!ownOrders.length && !filter?.value && <Link className="button button-primary" to="/pedidos/novo">Criar pedido</Link>}
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
            <div className="order-actions">
              {nextStep(order) && (nextStep(order)?.to
                ? <Link className="button button-primary" to={nextStep(order)!.to!}>{nextStep(order)!.label}</Link>
                : <Link className="button button-primary" {...modalLink(location.pathname, location.search, 'concluir-pedido', order.id)}>{nextStep(order)!.label}</Link>)}
              <Link className={`button ${nextStep(order) ? 'button-secondary' : 'button-primary'}`} to={`/pedidos/${order.id}`}
                aria-label={`Ver detalhes do pedido ${order.id}`}>
                Ver detalhes
              </Link>
              {order.proposals > 0 && (
                <Link className="button button-secondary" to={`/pedidos/${order.id}/propostas`}
                  aria-label={`Ver propostas do pedido ${order.id}`}>
                  Ver propostas ({order.proposals})
                </Link>
              )}
              {order.status === 'completed' && <Link className="button button-secondary" to={`/pedidos/${order.id}/avaliar`}>Avaliar serviço</Link>}
            </div>
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
            {orderId === undefined ? listHeading?.title ?? 'Meus pedidos' : view ? tabHeadings[view] : 'Detalhes do pedido'}
          </h1>
          <p>{orderId === undefined ? listHeading?.description ?? 'Todos os seus pedidos, do mais recente ao mais antigo. A busca considera os pedidos desta página.' : 'Informações do pedido selecionado.'}</p>
        </div>
      </div>
      {orderId !== undefined && (
        <Link className="button button-secondary" to="/pedidos">Voltar para meus pedidos</Link>
      )}
      {renderContent()}
    </section>
  )
}
