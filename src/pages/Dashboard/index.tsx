import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MyOrders } from '../MyOrders'
import { useCustomerSession } from '../../services/useCustomerSession'
import { useDashboardData, useOrderDetail } from '../../services/useDashboardData'
import { toOrder } from '../../services/dashboardApi'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { Sidebar } from '../../components/dashboard/Sidebar'
import { DashboardOverview } from '../../components/dashboard/DashboardOverview'
import type { Order } from '../../data/dashboard'
import type { Dialog, Tab } from '../../types/dashboard'

export function Dashboard() {
  const routerNavigate = useNavigate()
  const location = useLocation()
  const { orderId } = useParams()
  const viewingOrders = location.pathname.startsWith('/pedidos')
  const session = useCustomerSession()
  const dashboard = useDashboardData(session.accessToken, session.customerId)
  const detail = useOrderDetail(orderId, session.accessToken)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const orders = dashboard.data?.summary.recentOrders.map((dto) => toOrder(dto, session.customerId!)) ?? []
  const profile = { name: dashboard.data?.user.name ?? 'Minha conta', location: 'Localização não informada' }

  function openDialog(value: Dialog) {
    setMobileOpen(false)
    if (value === 'profile' || value === 'help') setDialog(value)
    else if (value === 'create' && dashboard.data && !dashboard.data.user.cpf)
      routerNavigate('/complemento-cadastro', { state: { from: location.pathname } })
    else setNotice(value === 'create'
      ? 'A criação de pedidos ainda não está disponível na API.'
      : 'Esta funcionalidade ainda não está disponível na API.')
  }
  function navigate(label: string, target?: Dialog) {
    setMobileOpen(false)
    if (target) { openDialog(target); return }
    setDialog(null)
    setTab('all')
    setSearch('')
    routerNavigate(label === 'Meus pedidos' ? '/pedidos' : '/')
  }
  function openOrder(order: Order) { routerNavigate(`/pedidos/${order.id}`) }

  const failure = session.error || dashboard.error?.message
  if (!session.loading && !session.error && !session.customerId) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Pular para o conteúdo</a>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
        activeNav={viewingOrders ? 'Meus pedidos' : 'Visão geral'} navigate={navigate}
        openDialog={openDialog} profile={profile} unread={false} />
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="icon-button mobile-menu" aria-label="Abrir menu"
              aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Icon name="menu" /></button>
            <span>Meu espaço</span><Icon name="chevron" size={13} />
            <strong>{viewingOrders ? 'Meus pedidos' : 'Visão geral'}</strong>
          </div>
          <div className="topbar-actions">
            <a className="button button-secondary" href="/?demo=1#/">Demonstração interativa</a>
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
            : viewingOrders ? <MyOrders
              orders={orderId ? (detail.data ? [toOrder(detail.data, session.customerId!)] : []) : orders}
              customerId={session.customerId} search={search} orderId={orderId}
              loading={detail.loading} error={detail.error?.status === 404 ? undefined : detail.error?.message}
              onRetry={detail.retry} />
            : dashboard.data && <DashboardOverview orders={orders} summary={dashboard.data.summary}
              profile={profile} tab={tab} setTab={setTab} search={search} setSearch={setSearch}
              navigate={navigate} openDialog={openDialog} openOrder={openOrder} />}
        </main>
      </div>
      {notice && <div className="toast" role="status"><span>{notice}</span>
        <button className="icon-button" onClick={() => setNotice('')} aria-label="Dispensar aviso"><Icon name="close" size={17} /></button>
      </div>}
      {dialog && <Modal title={dialog === 'profile' ? 'Meu perfil' : 'Central de ajuda'} onClose={() => setDialog(null)}>
        {dialog === 'profile' ? <div className="dialog-stack"><h3>{profile.name}</h3>
          <p>{dashboard.data?.user.email}</p><p>Perfil: {dashboard.data?.user.role}</p>
          <p>A edição do perfil ainda não está disponível na API.</p></div>
          : <p>Consulte o resumo da conta e abra um pedido para ver seus detalhes. A API retorna os cinco pedidos mais recentes. Criação e outras operações ainda não estão disponíveis.</p>}
      </Modal>}
    </div>
  )
}
