import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { MyOrders } from '../MyOrders'
import { useCustomerSession } from '../../services/useCustomerSession'
import { useDashboardData, useOrderDetail, useOrdersList } from '../../services/useDashboardData'
import { askAssistant, createOrder, toOrder, uploadOrderPhoto, type OrderStatusDto } from '../../services/dashboardApi'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { AccountSettings } from '../../components/AccountSettings'
import { CompleteRegistrationModal } from '../../components/CompleteRegistrationModal'
import { OrderForm } from '../../components/OrderForm'
import { OrderAssistant } from '../../components/OrderAssistant'
import { OrderReview } from '../../components/OrderReview'
import { useReviewSummary } from '../../services/useReviewSummary'
import { useModalRoute } from '../../services/modalRoute'
import type { NewOrder } from '../../types/orders'
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
  const viewingOrders = location.pathname.startsWith('/pedidos')
  const session = useCustomerSession()
  const dashboard = useDashboardData(session.accessToken, session.customerId)
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
  const ordersList = useOrdersList(session.accessToken, viewingOrders && !orderId, statusFilter, page)
  const orderView = location.pathname.endsWith('/propostas') ? 'propostas'
    : location.pathname.endsWith('/acompanhar') ? 'acompanhar' : undefined
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  // Perfil, ajuda e finalização de cadastro vivem na URL (?modal=...): recarregar reabre e "voltar" fecha.
  const urlModal = useModalRoute(['perfil', 'ajuda', 'finalizar-cadastro'] as const)
  const registrationHandled = useRef(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  // Criação de pedido (#67/#69): começa pelo assistente; o formulário recebe o escopo sugerido para revisão.
  const [createMode, setCreateMode] = useState<'assistant' | 'form'>('assistant')
  const [draft, setDraft] = useState<NewOrder>()
  const completedList = useOrdersList(session.accessToken, !viewingOrders && !!dashboard.data, 'Completed', 1, 3)
  const orders = dashboard.data?.summary.recentOrders.map((dto) => toOrder(dto, session.customerId!)) ?? []
  const profile = { name: dashboard.data?.user.name ?? 'Minha conta', location: 'Localização não informada' }
  const activeNav: NavKey = dialog === 'create' ? 'Criar pedido'
    : !viewingOrders ? 'Visão geral'
    : location.pathname.endsWith('/avaliar') ? 'Avaliações'
    : orderId ? 'Meus pedidos'
    : statusFilter === 'Pending' ? 'Propostas'
    : statusFilter === 'Completed' ? 'Avaliações' : 'Meus pedidos'

  function openDialog(value: Dialog) {
    setMobileOpen(false)
    if (value === 'profile') urlModal.open('perfil')
    else if (value === 'help') urlModal.open('ajuda')
    else if (value === 'create' && dashboard.data && !dashboard.data.user.cpf) urlModal.open('finalizar-cadastro', 'criar-pedido')
    else if (value === 'create') startCreate()
  }
  function startCreate() { setSubmitError(''); setCreateMode('assistant'); setDraft(undefined); setDialog('create') }
  function registrationCompleted() {
    registrationHandled.current = true
    const next = urlModal.next
    urlModal.close()
    dashboard.retry()
    if (next === 'criar-pedido') startCreate()
    else setNotice('Cadastro finalizado com sucesso.')
  }
  // Link direto (?modal=finalizar-cadastro) de quem já finalizou: não há o que preencher.
  const alreadyRegistered = urlModal.current === 'finalizar-cadastro' && !!dashboard.data?.user.cpf
  useEffect(() => {
    if (urlModal.current !== 'finalizar-cadastro') registrationHandled.current = false
    else if (alreadyRegistered && !registrationHandled.current) {
      registrationHandled.current = true
      const next = urlModal.next
      urlModal.close()
      if (next === 'criar-pedido') startCreate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlModal.current, alreadyRegistered])
  async function publishOrder(order: NewOrder, photos: File[]) {
    if (!session.accessToken || !session.customerId) return
    setSubmitting(true)
    setSubmitError('')
    try {
      // As fotos vão primeiro para o Storage pela API; o pedido é criado com as URLs devolvidas.
      const photoUrls: string[] = []
      for (const photo of photos) photoUrls.push(await uploadOrderPhoto(session.accessToken, photo))
      const created = await createOrder(session.accessToken, order, photoUrls)
      setDialog(null)
      dashboard.retry()
      routerNavigate(`/pedidos/${created.id}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível publicar o pedido. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }
  function navigate(item: NavKey) {
    setMobileOpen(false)
    if (item === 'Criar pedido') { openDialog('create'); return }
    setDialog(null)
    setTab('all')
    setSearch('')
    routerNavigate(destinations[item])
  }
  function openOrder(order: Order, target: OrderTarget = 'detalhes') {
    routerNavigate(`/pedidos/${order.id}${target === 'propostas' ? '/propostas' : ''}`)
  }
  function viewCompleted() { navigate('Avaliações') }

  const failure = session.error || dashboard.error?.message
  if (!session.loading && !session.error && !session.customerId) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
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
            <label className="search-box">
              <Icon name="search" size={18} />
              <input type="search" placeholder="Buscar pedido..." aria-label="Buscar pedido"
                value={search} onChange={(event) => { setSearch(event.target.value); setTab('all') }} />
            </label>
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
              {dashboard.error?.status === 401 && <Link to="/login" state={{ from: location.pathname }}>Entrar novamente</Link>}
            </section>
            : dialog === 'create' ? (createMode === 'assistant'
              ? <OrderAssistant onCancel={() => setDialog(null)} onManual={() => { setDraft(undefined); setCreateMode('form') }}
                onAsk={(messages) => askAssistant(session.accessToken!, messages)}
                onReview={(order) => { setDraft(order); setCreateMode('form') }} />
              : <OrderForm key={draft ? 'revisao' : 'manual'} initial={draft} submitting={submitting} submitError={submitError}
                onCancel={() => setDialog(null)} onCreate={publishOrder}
                onBackToAssistant={draft ? () => setCreateMode('assistant') : undefined} />)
            : location.pathname.endsWith('/avaliar') && detail.data && session.accessToken ? <OrderReview
              key={`${session.accessToken}:${orderId}`} order={toOrder(detail.data, session.customerId!)} token={session.accessToken}
              onSaved={() => setReviewRevision((value) => value + 1)} />
            : viewingOrders ? <MyOrders
              orders={orderId
                ? (detail.data ? [toOrder(detail.data, session.customerId!)] : [])
                : ordersList.data?.items.map((dto) => toOrder(dto, session.customerId!)) ?? []}
              customerId={session.customerId} search={search} orderId={orderId} view={orderView}
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
      {!session.loading && urlModal.current === 'finalizar-cadastro' && dashboard.data && !alreadyRegistered
        && <CompleteRegistrationModal token={session.accessToken} customerId={session.customerId}
          defaultName={dashboard.data.user.name} onClose={urlModal.close} onCompleted={registrationCompleted}
          reason={urlModal.next === 'criar-pedido' ? 'Para criar um pedido, precisamos concluir seu cadastro. Leva menos de um minuto.' : undefined} />}
      {!session.loading && (urlModal.current === 'perfil' || urlModal.current === 'ajuda') && <Modal size="lg" onClose={urlModal.close}
        title={urlModal.current === 'perfil' ? 'Configurações da conta' : 'Central de ajuda'}>
        {urlModal.current === 'perfil' ? <AccountSettings key={`${session.customerId}:${session.accessToken}`}
          token={session.accessToken} customerId={session.customerId} onCompleted={dashboard.retry} />
          : <p>Consulte o resumo da conta, finalize seu cadastro nas configurações e crie pedidos. Em Meus pedidos, filtre por status e consulte detalhes, propostas e acompanhamento.</p>}
      </Modal>}
    </div>
  )
}
