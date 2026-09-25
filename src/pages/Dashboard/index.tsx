import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { OrderAssistant, type NewOrder } from '../../components/OrderAssistant'
import { Sidebar } from '../../components/dashboard/Sidebar'
import { DashboardOverview } from '../../components/dashboard/DashboardOverview'
import { DashboardDialogs } from '../../components/dashboard/DashboardDialogs'
import { initialOrders, type Order } from '../../data/dashboard'
import type { Dialog, Tab } from '../../types/dashboard'

export function Dashboard() {
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
    setActiveNav(label)
    setMobileOpen(false)
    if (target) {
      if (target === 'proposals') setSelectedOrder(initialOrders[0])
      openDialog(target)
    } else {
      setDialog(null)
      setTab('all')
      setSearch('')
      if (label === 'Meus pedidos')
        document.getElementById('orders')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'auto'
            : 'smooth',
          block: 'start',
        })
    }
  }
  function createOrder(order: NewOrder) {
    setOrders((current) => [
      {
        ...order,
        id: Date.now(),
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
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        activeNav={activeNav}
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
            <strong>{activeNav}</strong>
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

        <main id="main" tabIndex={-1}>
          {dialog === 'create' ? (
            <OrderAssistant
              location={profile.location}
              onCreate={createOrder}
              onCancel={() => {
                setDialog(null)
                setActiveNav('Visão geral')
              }}
            />
          ) : (
            <DashboardOverview
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

