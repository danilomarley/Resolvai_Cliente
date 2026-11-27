import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MyOrders } from '../MyOrders'
import { useCustomerSession } from '../../services/useCustomerSession'
import { useDashboardData, useOrderDetail, useOrdersList } from '../../services/useDashboardData'
import { toOrder, type OrderStatusDto } from '../../services/dashboardApi'
import { canChangeOrder } from '../../services/orders'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { AccountSettings } from '../../components/AccountSettings'
import { CreateOrderModal } from '../../components/CreateOrderModal'
import { OrderReview } from '../../components/OrderReview'
import { EditOrderModal } from '../../components/EditOrderModal'
import { CancelOrderModal } from '../../components/CancelOrderModal'
import { CompleteOrderModal } from '../../components/CompleteOrderModal'
import { AlertsBell } from '../../components/AlertsBell'
import { useProposalAlerts } from '../../services/useProposalAlerts'
import { useReviewSummary } from '../../services/useReviewSummary'
import { useModalRoute } from '../../services/modalRoute'
import { legacyModalTarget } from '../../services/legacyModals'
import { Sidebar } from '../../components/dashboard/Sidebar'
import { DashboardOverview } from '../../components/dashboard/DashboardOverview'
import type { Order } from '../../types/orders'
import type { Dialog, NavKey, OrderTarget, Tab } from '../../types/dashboard'

const orderStatuses: OrderStatusDto[] = ['Pending', 'InProgress', 'Completed', 'Cancelled']
/** Destino de cada item do menu; "Propostas" e "Avaliações" são Meus pedidos já filtrado. */
const destinations: Record<Exclude<NavKey, 'Criar pedido'>, string> = {
  'Visão geral': '/',
  'Meus pedidos': '/pedidos',
  'Propostas': '/pedidos?status=Pending',
  'Avaliações': '/pedidos?status=Completed',
}
const listHeadings: Partial<Record<NavKey, { title: string; description: string }>> = {
  'Propostas': { title: 'Propostas', description: 'Pedidos que estão recebendo propostas. Abra um pedido para comparar as ofertas dos profissionais.' },
  'Avaliações': { title: 'Avaliações', description: 'Seus serviços concluídos. Abra um pedido para avaliar o profissional.' },
}

export function Dashboard() {
  const routerNavigate = useNavigate()
  const location = useLocation()
  const { orderId } = useParams()
  const viewingOrders = !!useMatch('/pedidos/*')
  const proposalsRoute = !!useMatch('/pedidos/:orderId/propostas')
  const proposalMatch = useMatch('/pedidos/:orderId/propostas/:proposalId')
  const trackingRoute = !!useMatch('/pedidos/:orderId/acompanhar')
  const contractRoute = !!useMatch('/pedidos/:orderId/contrato')
  const paymentRoute = !!useMatch('/pedidos/:orderId/pagamento')
  const returnTo = location.pathname + location.search
  const session = useCustomerSession()
  const dashboard = useDashboardData(session.accessToken, session.customerId)
  // Os alertas recarregam a cada navegação: abrir uma proposta a marca como visualizada e o contador acompanha (#90).
  const alerts = useProposalAlerts(session.accessToken, location.pathname + location.search)
  const detail = useOrderDetail(orderId, session.accessToken)
  const [reviewRevision, setReviewRevision] = useState(0)
  const reviews = useReviewSummary(session.accessToken, reviewRevision)
  // Filtro e página da lista de pedidos vivem na URL (?status=...&page=...): os atalhos do menu e o botão voltar funcionam.
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = orderStatuses.find((status) => status === searchParams.get('status'))
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  function updateList(changes: { status?: OrderStatusDto | null; page?: number }) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (changes.status !== undefined) { if (changes.status) next.set('status', changes.status); else next.delete('status') }
      if (changes.page && changes.page > 1) next.set('page', String(changes.page)); else next.delete('page')
      return next
    })
  }
  // Perfil, ajuda, cadastro, criação de pedido, avaliação, edição e cancelamento vivem na URL (?modal=...): recarregar reabre e "voltar" fecha.
  const urlModal = useModalRoute(['perfil', 'ajuda', 'criar-pedido', 'avaliar', 'editar-pedido', 'cancelar-pedido', 'concluir-pedido'] as const)
  // Os modais de um pedido (avaliar, editar, cancelar) usam o pedido da URL (?pedido=) ou, no detalhe, o pedido aberto.
  const orderModal = urlModal.current === 'avaliar' || urlModal.current === 'editar-pedido' || urlModal.current === 'cancelar-pedido' || urlModal.current === 'concluir-pedido'
  const reviewId = orderModal ? urlModal.order ?? orderId : undefined
  const ownDetail = useOrderDetail(reviewId && reviewId !== orderId ? reviewId : undefined, session.accessToken)
  const reviewOrder = reviewId && reviewId === orderId ? detail : ownDetail
  const ordersList = useOrdersList(session.accessToken, viewingOrders && !orderId, statusFilter, page)
  const orderView = proposalsRoute || proposalMatch ? 'propostas' : contractRoute ? 'contrato' : paymentRoute ? 'pagamento' : trackingRoute ? 'acompanhar' : undefined
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const completedList = useOrdersList(session.accessToken, !viewingOrders && !!dashboard.data, 'Completed', 1, 3)
  const orders = dashboard.data?.summary.recentOrders.map((dto) => toOrder(dto, session.customerId!)) ?? []
  const profile = { name: dashboard.data?.user.name ?? 'Minha conta', location: 'Localização não informada' }
  // O modal "Criar pedido" abre sobre a tela atual, que continua sendo o item ativo do menu.
  const activeNav: NavKey = !viewingOrders ? 'Visão geral'
    : orderId ? 'Meus pedidos'
    : statusFilter === 'Pending' ? 'Propostas'
    : statusFilter === 'Completed' ? 'Avaliações' : 'Meus pedidos'

  function openDialog(value: Dialog) {
    setMobileOpen(false)
    if (value === 'profile') urlModal.open('perfil')
    else if (value === 'help') urlModal.open('ajuda')
    else if (value === 'create' && dashboard.data && !dashboard.data.user.cpf) routerNavigate('/cadastro/finalizar?next=%2Fpedidos%2Fnovo')
    else if (value === 'create') urlModal.open('criar-pedido')
  }
  // Telas que terminam em outra página (ex.: finalizar cadastro) avisam o resultado pelo estado da navegação.
  const stateNotice = (location.state as { notice?: string } | null)?.notice
  useEffect(() => {
    if (!stateNotice) return
    setNotice(stateNotice)
    routerNavigate(location.pathname + location.search, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateNotice])
  // Pedido editado ou cancelado: recarrega o detalhe, a lista e os cards da Home e avisa o resultado.
  function orderChanged(message: string) {
    reviewOrder.retry()
    ordersList.retry()
    dashboard.retry()
    urlModal.close()
    setNotice(message)
  }
  function orderCreated(orderId: string) {
    dashboard.retry()
    // Troca a entrada do modal pelo pedido novo: "voltar" retorna à tela de onde a pessoa partiu.
    routerNavigate(`/pedidos/${orderId}`, { replace: true })
  }
  function navigate(item: NavKey) {
    setMobileOpen(false)
    if (item === 'Criar pedido') { openDialog('create'); return }
    setTab('all')
    setSearch('')
    routerNavigate(destinations[item])
  }
  function openOrder(order: Order, target: OrderTarget = 'detalhes') {
    routerNavigate(`/pedidos/${order.id}${target === 'propostas' ? '/propostas' : ''}`)
  }
  function viewCompleted() { navigate('Avaliações') }

  // A busca só filtra o painel da Visão geral e a lista de pedidos; no detalhe não teria efeito.
  const searchable = !orderId && (viewingOrders || location.pathname === '/')
  const failure = session.error || dashboard.error?.message
  // Links antigos de modal que hoje são páginas.
  const legacyTarget = legacyModalTarget(location.pathname, location.search)
  if (legacyTarget) return <Navigate to={legacyTarget} replace />
  if (!session.loading && !session.error && !session.customerId) {
    return <Navigate to="/login" replace state={{ from: returnTo }} />
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Pular para o conteúdo</a>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
        activeNav={activeNav} navigate={navigate}
        openDialog={openDialog} profile={profile} />
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="icon-button mobile-menu" aria-label="Abrir menu"
              aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
            <span>Meu espaço</span><Icon name="chevron" size={13} />
            <strong>{activeNav}</strong>
          </div>
          <div className="topbar-actions">
            {searchable && <label className="search-box">
              <Icon name="search" size={18} />
              <input type="search" placeholder="Buscar pedido..." aria-label="Buscar pedido"
                value={search} onChange={(event) => { setSearch(event.target.value); setTab('all') }} />
            </label>}
            {session.accessToken && <AlertsBell alerts={alerts.data} failed={alerts.failed} loading={alerts.loading} />}
            <button className="avatar small-avatar" aria-label="Abrir meu perfil" onClick={() => openDialog('profile')}>
              {profile.name.charAt(0)}
            </button>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {session.loading || dashboard.loading ? <p role="status">Carregando sua conta e seus pedidos…</p>
            : failure ? <section className="panel order-summary" role="alert">
              <h1>Não foi possível carregar sua conta</h1><p>{failure}</p>
              <button className="button button-secondary" onClick={session.error ? session.retry : dashboard.retry}>Tentar novamente</button>
              {dashboard.error?.status === 401 && <Link to="/login" state={{ from: returnTo }}>Entrar novamente</Link>}
            </section>
            : viewingOrders ? <MyOrders
              orders={orderId
                ? (detail.data ? [toOrder(detail.data, session.customerId!)] : [])
                : ordersList.data?.items.map((dto) => toOrder(dto, session.customerId!)) ?? []}
              customerId={session.customerId} search={search} orderId={orderId} view={orderView}
              token={session.accessToken} proposalId={proposalMatch?.params.proposalId}
              onProposalAccepted={() => {
                detail.retry(); ordersList.retry(); dashboard.retry()
                setNotice('Proposta aceita. Leia o contrato e assine para seguir.')
                // Do aceite direto para o contrato; replace descarta o modal de confirmação do histórico.
                if (orderId) routerNavigate(`/pedidos/${orderId}/contrato`, { replace: true })
              }}
              onContractSigned={() => { detail.retry(); setNotice('Contrato assinado.') }}
              onContractCompleted={() => { detail.retry(); ordersList.retry(); setNotice('As duas partes assinaram o contrato. Já dá para pagar.') }}
              onPaid={() => { detail.retry(); ordersList.retry(); dashboard.retry(); setNotice('Pagamento confirmado. O serviço está em andamento.') }}
              loading={orderId ? detail.loading : ordersList.loading}
              error={orderId ? (detail.error?.status === 404 ? undefined : detail.error?.message) : ordersList.error?.message}
              requiresLogin={(orderId ? detail.error : ordersList.error)?.status === 401}
              onRetry={orderId ? detail.retry : ordersList.retry}
              heading={listHeadings[activeNav]}
              filter={orderId ? undefined : { value: statusFilter, onChange: (value) => updateList({ status: value ?? null }) }}
              pager={orderId || !ordersList.data ? undefined : { page, totalPages: ordersList.data.totalPages, onPage: (value) => updateList({ page: value }) }} />
            : dashboard.data && <DashboardOverview orders={orders} summary={dashboard.data.summary}
              reviews={reviews}
              completed={{ orders: completedList.data?.items.map((dto) => toOrder(dto, session.customerId!)) ?? [],
                loading: completedList.loading, error: completedList.error?.message }}
              onViewCompleted={viewCompleted}
              profile={profile} tab={tab} setTab={setTab} search={search} setSearch={setSearch}
              navigate={navigate} openDialog={openDialog} openOrder={openOrder} />}
        </main>
      </div>
      {notice && <div className="toast" role="status"><span>{notice}</span>
        <button className="icon-button" onClick={() => setNotice('')} aria-label="Dispensar aviso"><Icon name="close" size={17} /></button>
      </div>}
      {!session.loading && urlModal.current === 'criar-pedido' && session.accessToken && dashboard.data
        && <CreateOrderModal token={session.accessToken} onClose={urlModal.close} onCreated={orderCreated} />}
      {!session.loading && urlModal.current === 'avaliar' && session.accessToken && reviewOrder.data
        && <OrderReview key={`${session.accessToken}:${reviewOrder.data.id}`} order={toOrder(reviewOrder.data, session.customerId!)}
          token={session.accessToken} onClose={urlModal.close} onSaved={() => setReviewRevision((value) => value + 1)} />}
      {!session.loading && orderModal && reviewOrder.error && !reviewOrder.data
        && <Modal size="sm" title={urlModal.current === 'avaliar' ? 'Avaliar serviço' : urlModal.current === 'editar-pedido' ? 'Editar pedido' : urlModal.current === 'concluir-pedido' ? 'Confirmar conclusão' : 'Cancelar pedido'}
          onClose={urlModal.close}
          footer={<button type="button" className="button button-secondary" onClick={urlModal.close}>Fechar</button>}>
          <p role="alert">{reviewOrder.error.status === 404 ? 'Este pedido não está disponível para sua conta.' : reviewOrder.error.message}</p>
        </Modal>}
      {!session.loading && (urlModal.current === 'editar-pedido' || urlModal.current === 'cancelar-pedido') && session.accessToken && reviewOrder.data
        && (canChangeOrder(toOrder(reviewOrder.data, session.customerId!))
          ? urlModal.current === 'editar-pedido'
            ? <EditOrderModal key={`${session.accessToken}:${reviewOrder.data.id}`} order={toOrder(reviewOrder.data, session.customerId!)}
              token={session.accessToken} onClose={urlModal.close} onSaved={() => orderChanged('Pedido atualizado.')} />
            : <CancelOrderModal key={`${session.accessToken}:${reviewOrder.data.id}`} order={toOrder(reviewOrder.data, session.customerId!)}
              token={session.accessToken} onClose={urlModal.close} onCancelled={() => orderChanged('Pedido cancelado.')} />
          : <Modal size="sm" title={urlModal.current === 'editar-pedido' ? 'Editar pedido' : 'Cancelar pedido'} onClose={urlModal.close}
            footer={<button type="button" className="button button-secondary" onClick={urlModal.close}>Fechar</button>}>
            <p role="alert">Este pedido não pode mais ser alterado: ele já foi cancelado, concluído, está em andamento ou teve uma proposta aceita.</p>
          </Modal>)}
      {!session.loading && urlModal.current === 'concluir-pedido' && session.accessToken && reviewOrder.data
        && (toOrder(reviewOrder.data, session.customerId!).status === 'progress'
          ? <CompleteOrderModal key={`${session.accessToken}:${reviewOrder.data.id}`} order={toOrder(reviewOrder.data, session.customerId!)}
            token={session.accessToken} onClose={urlModal.close} onCompleted={() => orderChanged('Serviço concluído. Agora você pode avaliar o prestador.')} />
          : <Modal size="sm" title="Confirmar conclusão" onClose={urlModal.close}
            footer={<button type="button" className="button button-secondary" onClick={urlModal.close}>Fechar</button>}>
            <p role="alert">Só é possível confirmar a conclusão de um pedido em andamento, com o pagamento confirmado.</p>
          </Modal>)}
      {!session.loading && (urlModal.current === 'perfil' || urlModal.current === 'ajuda') && <Modal size="lg" onClose={urlModal.close}
        title={urlModal.current === 'perfil' ? 'Configurações da conta' : 'Central de ajuda'}>
        {urlModal.current === 'perfil' ? <AccountSettings key={`${session.customerId}:${session.accessToken}`}
          token={session.accessToken} customerId={session.customerId} onCompleted={dashboard.retry} />
          : <p>Consulte o resumo da conta, finalize seu cadastro nas configurações e crie pedidos. Em Meus pedidos, filtre por status e consulte detalhes, propostas e acompanhamento.</p>}
      </Modal>}
    </div>
  )
}
