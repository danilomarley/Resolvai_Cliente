import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MyOrders } from '../MyOrders'

import { Icon } from '../../components/Icon'
import { OrderAssistant, type NewOrder } from '../../components/OrderAssistant'
import { Sidebar } from '../../components/dashboard/Sidebar'
import { DemoOverview } from '../../components/dashboard/DemoOverview'
import { DashboardDialogs } from '../../components/dashboard/DashboardDialogs'
import { completedOrders, initialOrders, type Order } from '../../data/dashboard'
import type { Dialog, Tab } from '../../types/dashboard'

export function DemoDashboard() {
  const routerNavigate = useNavigate()
  const location = useLocation()
  const { orderId } = useParams()
  const viewingOrders = location.pathname.startsWith('/pedidos')
  const session = { customerId: 'demo-customer', loading: false, error: '', retry: () => {} }
  const [orders, setOrders] = useState(initialOrders)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order>(initialOrders[0])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [unread, setUnread] = useState(true)
  const [activeNav, setActiveNav] = useState('Visão geral')
  const [profile, setProfile] = useState({
    name: 'Ygor Chagas',
    location: 'Aldeota, Fortaleza',
  })

  function openDialog(value: Dialog) {
    setDialog(value)
    if (value === 'create') setActiveNav('Criar pedido')
    setMobileOpen(false)
  }
  function navigate(label: string, target?: Dialog) {
    routerNavigate(label === 'Meus pedidos' ? '/pedidos' : '/')
    setActiveNav(label)
    setMobileOpen(false)
    if (target) {
      if (target === 'proposals') setSelectedOrder(initialOrders[0])
      openDialog(target)
    } else {
      setDialog(null)
      setTab('all')
      setSearch('')
    }
  }
  function createOrder(order: NewOrder) {
    setOrders((current) => [
      {
        ...order,
        id: Date.now(),
        customerId: session.customerId ?? 'demo-customer',
        createdAt: new Date().toISOString(),
        status: 'waiting',
        proposals: 0,
        deadline: 'Em aberto',
        icon: 'home',
      },
      ...current,
    ])
    setTab('all')
    setSearch('')
    setDialog(null)
    setActiveNav('Visão geral')
    setNotice(
      'Pedido com escopo criado nesta demonstração. Ele já aparece em seus pedidos ativos.',
    )
  }
  function openOrder(order: Order, target: Dialog = 'order') {
    setSelectedOrder(order)
    openDialog(target)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main')?.focus()
      }}>
        Pular para o conteúdo
      </a>
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        activeNav={viewingOrders ? 'Meus pedidos' : activeNav}
        navigate={navigate}
        openDialog={openDialog}
        profile={profile}
        unread={unread}
      />
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span>Meu espaço</span>
            <Icon name="chevron" size={13} />
            <strong>{viewingOrders ? 'Meus pedidos' : activeNav}</strong>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Icon name="search" size={18} />
              <input
                type="search"
                placeholder="Buscar pedido..."
                aria-label="Buscar pedido"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setTab('all')
                }}
              />
            </label>
            <span className="header-divider" />
            <button
              className="icon-button notification-button"
              aria-label={unread ? 'Notificações, 3 não lidas' : 'Notificações'}
              onClick={() => {
                openDialog('notifications')
                setUnread(false)
              }}
            >
              <Icon name="bell" />
              {unread && <i />}
            </button>
            <button
              className="avatar small-avatar"
              aria-label="Abrir meu perfil"
              onClick={() => openDialog('profile')}
            >
              {profile.name.charAt(0)}
            </button>
          </div>
        </header>

        <main id="main" tabIndex={-1}><p className="demo-banner" role="status">Demonstração offline · Dados fictícios · Alterações mantidas somente enquanto esta página estiver aberta.</p>
          {dialog === 'create' && !viewingOrders ? (
            <OrderAssistant
              location={profile.location}
              onCreate={createOrder}
              onCancel={() => {
                setDialog(null)
                setActiveNav('Visão geral')
              }}
            />
          ) : viewingOrders ? (
            !session.loading && !session.error && !session.customerId
              ? <Navigate to="/login" replace state={{ from: location.pathname }} />
              : <MyOrders demonstration orders={[...orders, ...completedOrders]} customerId={session.customerId} search={search}
                  orderId={orderId === undefined ? undefined : /^\d+$/.test(orderId) ? Number(orderId) : NaN}
                  loading={session.loading} error={session.error} onRetry={session.retry} />
          ) : (
            <DemoOverview
              orders={orders}
              profile={profile}
              unread={unread}
              tab={tab}
              setTab={setTab}
              search={search}
              setSearch={setSearch}
              navigate={navigate}
              openDialog={openDialog}
              openOrder={openOrder}
            />
          )}
        </main>
      </div>

      {notice && (
        <div className="toast" role="status">
          <Icon name="circleCheck" />
          <span>{notice}</span>
          <button
            className="icon-button"
            onClick={() => setNotice('')}
            aria-label="Dispensar aviso"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      )}
      <DashboardDialogs
        dialog={dialog}
        selectedOrder={selectedOrder}
        profile={profile}
        onClose={() => {
          setDialog(null)
          setActiveNav('Visão geral')
        }}
        onOpenOrder={openOrder}
        onSaveProfile={setProfile}
        onNotice={setNotice}
      />
    </div>
  )
}
