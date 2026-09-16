import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon, type IconName } from './components/Icon'
import { HouseIllustration } from './components/HouseIllustration'
import { Modal } from './components/Modal'
import {
  completed,
  currency,
  initialOrders,
  proposals,
  type Order,
} from './data/dashboard'

type Dialog =
  | 'create'
  | 'notifications'
  | 'profile'
  | 'help'
  | 'contracts'
  | 'payments'
  | 'reviews'
  | 'messages'
  | 'history'
  | 'proposals'
  | 'order'
  | null
type Tab = 'all' | 'waiting' | 'progress'

function App() {
  const [orders, setOrders] = useState(initialOrders)
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order>(initialOrders[0])
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const [notice, setNotice] = useState('')
  const [interestedProvider, setInterestedProvider] = useState<string | null>(
    null,
  )
  const [unread, setUnread] = useState(true)
  const [activeNav, setActiveNav] = useState('Visão geral')
  const [messages, setMessages] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [profile, setProfile] = useState({
    name: 'Ygor Chagas',
    location: 'Aldeota, Fortaleza',
  })
  const visibleOrders = orders.filter(
    (order) =>
      (tab === 'all' || order.status === tab) &&
      `${order.title} ${order.category}`
        .toLocaleLowerCase('pt-BR')
        .includes(search.toLocaleLowerCase('pt-BR')),
  )
  const proposalCount = orders.reduce(
    (total, order) => total + order.proposals,
    0,
  )

  useEffect(() => {
    if (!mobileOpen) return
    const previousFocus = document.activeElement as HTMLElement | null
    const elements =
      sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button')
    const first = elements?.[0]
    const last = elements?.[elements.length - 1]
    first?.focus()
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previousFocus?.focus()
    }
  }, [mobileOpen])

  function openDialog(value: Dialog) {
    setDialog(value)
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
        document
          .getElementById('orders')
          ?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
              .matches
              ? 'auto'
              : 'smooth',
            block: 'start',
          })
    }
  }
  function createOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title')).trim()
    const location = String(data.get('location')).trim()
    const description = String(data.get('description')).trim()
    if (!title || !location || !description) return
    setOrders((current) => [
      {
        id: Date.now(),
        title,
        category: String(data.get('category')),
        location,
        description,
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
    setNotice(
      'Pedido criado nesta demonstração. Ele já aparece em seus pedidos ativos.',
    )
  }
  function openOrder(order: Order, target: Dialog = 'order') {
    setSelectedOrder(order)
    openDialog(target)
  }
  function navItem(
    label: string,
    icon: IconName,
    target?: Dialog,
    badge?: string,
  ) {
    return (
      <button
        className={`nav-item ${activeNav === label ? 'active' : ''}`}
        aria-current={activeNav === label ? 'page' : undefined}
        onClick={() => navigate(label, target)}
      >
        <Icon name={icon} />
        <span>{label}</span>
        {badge && <span className="nav-badge">{badge}</span>}
      </button>
    )
  }

  const titles: Record<Exclude<Dialog, null>, string> = {
    create: 'O que você precisa resolver?',
    notifications: 'Suas notificações',
    profile: 'Meu perfil',
    help: 'Como podemos ajudar?',
    contracts: 'Meus contratos',
    payments: 'Pagamentos',
    reviews: 'Minhas avaliações',
    messages: 'Conversa com o prestador',
    history: 'Histórico de serviços',
    proposals: 'Propostas recebidas',
    order: 'Detalhes do pedido',
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para o conteúdo
      </a>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar ${mobileOpen ? 'is-open' : ''}`}
        aria-label="Menu principal"
      >
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            navigate('Visão geral')
          }}
        >
          <span className="brand-mark">
            r<span>.</span>
          </span>
          <span>
            resolv<span className="brand-ai">AI</span>
            <small>PORTAL DO CONTRATANTE</small>
          </span>
        </a>
        <div className="workspace-label">
          <span className="workspace-icon">
            <Icon name="home" size={17} />
          </span>
          <span>
            Meu espaço<small>Conta pessoal</small>
          </span>
        </div>
        <nav>
          <p className="nav-label">PRINCIPAL</p>
          {navItem('Visão geral', 'grid')}
          {navItem('Meus pedidos', 'bag')}
          {navItem(
            'Propostas recebidas',
            'file',
            'proposals',
            unread ? '3' : undefined,
          )}
          {navItem('Mensagens', 'chat', 'messages')}
          <p className="nav-label management-label">GERENCIAMENTO</p>
          {navItem('Contratos', 'shield', 'contracts')}
          {navItem('Pagamentos', 'wallet', 'payments')}
          {navItem('Avaliações', 'star', 'reviews')}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-symbol">
              <Icon name="help" size={22} />
            </span>
            <strong>Conte com a gente</strong>
            <p>Uma mãozinha quando precisar.</p>
            <button onClick={() => openDialog('help')}>
              Central de ajuda <Icon name="arrow" size={16} />
            </button>
          </div>
          {navItem('Meu perfil', 'user', 'profile')}
          <button
            className="sidebar-profile"
            onClick={() => openDialog('profile')}
          >
            <span className="avatar">
              {profile.name
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span>
              <strong>{profile.name}</strong>
              <small>Contratante</small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </aside>

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
          <div className="page-heading">
            <div>
              <p className="eyebrow">TUDO SOB CONTROLE</p>
              <h1>
                Olá, {profile.name.split(' ')[0]}{' '}
                <span className="wave">✳</span>
              </h1>
              <p>Um lar bem cuidado começa por aqui. Vamos resolver?</p>
            </div>
            <span className="demo-label">
              <span /> Ambiente de demonstração
            </span>
          </div>
          <section className="welcome-banner" aria-labelledby="welcome-title">
            <div className="hero-copy">
              <span className="hero-kicker">
                <Icon name="sparkles" size={15} /> MENOS COMPLICAÇÃO. MAIS
                SOLUÇÃO.
              </span>
              <h2 id="welcome-title">
                Seu próximo projeto.
                <br />
                <span>A gente ajuda a resolver.</span>
              </h2>
              <p>
                Encontre o profissional certo e acompanhe
                <br className="desktop-break" /> cada detalhe do serviço em um
                só lugar.
              </p>
              <button
                className="button hero-button"
                onClick={() => openDialog('create')}
              >
                <Icon name="plus" size={19} /> Criar novo pedido{' '}
                <Icon name="arrow" size={18} />
              </button>
              <span className="hero-note">
                <Icon name="check" size={13} /> Simples, rápido e do seu jeito
              </span>
            </div>
            <HouseIllustration />
          </section>

          <section className="stats-grid" aria-label="Resumo da sua conta">
            {(
              [
                {
                  label: 'Pedidos ativos',
                  value: String(orders.length).padStart(2, '0'),
                  icon: 'bag',
                  color: 'blue',
                  detail: `+${orders.length - 1} ${orders.length === 2 ? 'novo nesta semana' : 'novos nesta semana'}`,
                  detailIcon: 'trend',
                  action: () => navigate('Meus pedidos'),
                },
                {
                  label: 'Propostas recebidas',
                  value: String(proposalCount).padStart(2, '0'),
                  icon: 'file',
                  color: 'purple',
                  detail: unread
                    ? '3 propostas para conferir'
                    : 'Suas propostas estão em dia',
                  detailIcon: 'clock',
                  action: () => {
                    setSelectedOrder(initialOrders[0])
                    openDialog('proposals')
                  },
                },
                {
                  label: 'Serviços concluídos',
                  value: '03',
                  icon: 'circleCheck',
                  color: 'green',
                  detail: 'Tudo certo por aqui',
                  detailIcon: 'check',
                  action: () => openDialog('history'),
                },
                {
                  label: 'Sua avaliação',
                  value: '4,8',
                  icon: 'star',
                  color: 'amber',
                  detail: 'Com base em 3 serviços',
                  detailIcon: 'star',
                  action: () => openDialog('reviews'),
                },
              ] as {
                label: string
                value: string
                icon: IconName
                color: string
                detail: string
                detailIcon: IconName
                action: () => void
              }[]
            ).map((stat) => (
              <button
                className="stat-card"
                key={stat.label}
                onClick={stat.action}
              >
                <div className="stat-top">
                  <span>{stat.label}</span>
                  <span className={`icon-tile ${stat.color}`}>
                    <Icon name={stat.icon} size={21} />
                  </span>
                </div>
                <strong className="stat-value">
                  {stat.value}
                  {stat.label === 'Sua avaliação' && (
                    <span className="rating-out-of">/ 5</span>
                  )}
                </strong>
                <span className={`stat-detail ${stat.color}`}>
                  <Icon name={stat.detailIcon} size={14} />
                  {stat.detail}
                </span>
              </button>
            ))}
          </section>

          <div className="dashboard-grid">
            <section
              className="panel orders-panel"
              id="orders"
              aria-labelledby="orders-title"
            >
              <div className="panel-heading">
                <div>
                  <h2 id="orders-title">
                    Seus pedidos{' '}
                    <span className="count-badge">{orders.length}</span>
                  </h2>
                  <p>Acompanhe o que está acontecendo.</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => openDialog('create')}
                >
                  <Icon name="plus" size={16} /> Novo pedido
                </button>
              </div>
              <div className="tabs" role="tablist" aria-label="Filtrar pedidos">
                {(
                  [
                    { id: 'all', label: 'Todos' },
                    { id: 'waiting', label: 'Aguardando propostas' },
                    { id: 'progress', label: 'Em andamento' },
                  ] as { id: Tab; label: string }[]
                ).map((item, index, tabs) => (
                  <button
                    key={item.id}
                    id={`tab-${item.id}`}
                    role="tab"
                    aria-selected={tab === item.id}
                    aria-controls="order-list"
                    tabIndex={tab === item.id ? 0 : -1}
                    className={tab === item.id ? 'selected' : ''}
                    onClick={() => setTab(item.id)}
                    onKeyDown={(event) => {
                      if (
                        ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(
                          event.key,
                        )
                      ) {
                        event.preventDefault()
                        const next =
                          event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                              ? tabs.length - 1
                              : (index +
                                  (event.key === 'ArrowRight' ? 1 : -1) +
                                  tabs.length) %
                                tabs.length
                        setTab(tabs[next].id)
                        document.getElementById(`tab-${tabs[next].id}`)?.focus()
                      }
                    }}
                  >
                    {item.label}
                    {item.id === 'all' && <span>{orders.length}</span>}
                  </button>
                ))}
              </div>
              <div
                id="order-list"
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
                tabIndex={0}
                className="order-list"
              >
                {visibleOrders.length ? (
                  visibleOrders.map((order) => (
                    <article className="order-card" key={order.id}>
                      <div className="order-main">
                        <span
                          className={`service-icon ${order.icon === 'drop' ? 'blue' : 'purple'}`}
                        >
                          <Icon name={order.icon} size={25} />
                        </span>
                        <div className="order-info">
                          <div className="order-category">
                            {order.category}
                            <span>#{String(order.id).slice(-4)}</span>
                          </div>
                          <h3>{order.title}</h3>
                          <p>
                            <Icon name="pin" size={13} />
                            {order.location}
                          </p>
                        </div>
                        <span className={`status-badge ${order.status}`}>
                          <i />
                          {order.status === 'waiting'
                            ? 'Aguardando propostas'
                            : 'Em andamento'}
                        </span>
                      </div>
                      <div className="order-footer">
                        <span className="order-meta">
                          <Icon
                            name={
                              order.status === 'waiting' ? 'file' : 'calendar'
                            }
                            size={15}
                          />
                          {order.status === 'waiting' ? (
                            <>
                              <strong>{order.proposals} propostas</strong>{' '}
                              recebidas
                            </>
                          ) : (
                            <>
                              Previsão: <strong>{order.deadline}</strong>
                            </>
                          )}
                        </span>
                        <button
                          className={`button ${order.status === 'waiting' && order.proposals ? 'button-primary' : 'button-secondary'} button-sm`}
                          onClick={() =>
                            openOrder(
                              order,
                              order.status === 'waiting' && order.proposals
                                ? 'proposals'
                                : 'order',
                            )
                          }
                        >
                          {order.status === 'waiting' && order.proposals
                            ? 'Ver propostas'
                            : 'Acompanhar'}
                          <Icon name="arrow" size={15} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    <Icon name="search" size={30} />
                    <h3>Nenhum pedido encontrado</h3>
                    <p>Tente outra busca ou crie um novo pedido.</p>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSearch('')
                        setTab('all')
                      }}
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>
              <div className="panel-footer">
                <Icon name="shield" size={15} />
                <span>Do primeiro contato à entrega, tudo em um só lugar.</span>
              </div>
            </section>

            <section
              className="panel completed-panel"
              aria-labelledby="completed-title"
            >
              <div className="panel-heading">
                <div>
                  <h2 id="completed-title">
                    Resolvidos por aqui <span className="tiny-spark">✦</span>
                  </h2>
                  <p>Mais tranquilidade para o seu dia.</p>
                </div>
                <span className="resolved-count">3</span>
              </div>
              <div className="completed-list">
                {completed.map((service) => (
                  <button
                    className="completed-item"
                    key={service.id}
                    onClick={() => openDialog('history')}
                  >
                    <span className="completed-icon">
                      <Icon name={service.icon} size={21} />
                      <i>
                        <Icon name="check" size={9} />
                      </i>
                    </span>
                    <span className="completed-info">
                      <strong>{service.title}</strong>
                      <span>{service.provider}</span>
                      <span className="completed-price">
                        {currency(service.price)}
                        <span className="rating">
                          <Icon name="star" size={12} />
                          {service.rating}
                        </span>
                      </span>
                    </span>
                    <Icon name="chevron" size={15} />
                  </button>
                ))}
              </div>
              <div className="completed-bottom">
                <span className="mini-avatars">
                  <i>SP</i>
                  <i>CI</i>
                  <i>FC</i>
                </span>
                <p>
                  Bons profissionais.
                  <br />
                  <strong>Problemas resolvidos.</strong>
                </p>
                <Icon name="circleCheck" size={23} />
              </div>
              <button
                className="history-button"
                onClick={() => openDialog('history')}
              >
                Ver histórico de serviços <Icon name="arrow" size={16} />
              </button>
            </section>
          </div>

          <section className="trust-banner">
            <span className="trust-icon">
              <Icon name="shield" size={27} />
            </span>
            <div>
              <h3>Você cuida dos planos. A gente cuida dos detalhes.</h3>
              <p>
                Propostas, conversas e serviços organizados para você contratar
                com mais tranquilidade.
              </p>
            </div>
            <button className="text-button" onClick={() => openDialog('help')}>
              Conheça a ResolvAI <Icon name="arrow" size={17} />
            </button>
          </section>
          <footer className="page-footer">
            <span>© 2026 ResolvAI. Feito para resolver.</span>
            <span>
              <span className="online-dot" /> Seu lar, nossa conexão.
            </span>
          </footer>
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
      {dialog && (
        <Modal
          title={titles[dialog]}
          onClose={() => {
            setDialog(null)
            setActiveNav('Visão geral')
          }}
        >
          {dialog === 'create' && (
            <form className="form-stack" onSubmit={createOrder}>
              <p className="modal-description">
                Conte um pouco sobre o serviço e organize seu próximo pedido.
              </p>
              <div className="info-box">
                <Icon name="sparkles" />
                <p>
                  Você está em uma demonstração. O pedido fica disponível nesta
                  sessão; a criação com IA e o envio a profissionais serão
                  integrados depois.
                </p>
              </div>
              <label>
                Título do pedido
                <input
                  name="title"
                  required
                  maxLength={90}
                  placeholder="Ex.: Pintura da sala"
                />
              </label>
              <label>
                Categoria
                <select name="category" aria-label="Categoria">
                  <option>Impermeabilização</option>
                  <option>Hidráulica</option>
                  <option>Pintura</option>
                  <option>Elétrica</option>
                  <option>Reforma</option>
                  <option>Outros serviços</option>
                </select>
              </label>
              <label>
                Local do serviço
                <input
                  name="location"
                  required
                  maxLength={120}
                  defaultValue={profile.location}
                />
              </label>
              <label>
                O que precisa ser feito?
                <textarea
                  name="description"
                  required
                  minLength={10}
                  maxLength={1200}
                  rows={4}
                  placeholder="Descreva o problema, o ambiente e os detalhes importantes."
                />
              </label>
              <button className="button button-primary" type="submit">
                Criar pedido de demonstração <Icon name="arrow" size={17} />
              </button>
            </form>
          )}
          {dialog === 'proposals' && (
            <div className="dialog-stack">
              <p className="modal-description">
                {selectedOrder.title} · propostas ilustrativas
              </p>
              {proposals.map((proposal) => (
                <article className="proposal-card" key={proposal.name}>
                  <div className="proposal-top">
                    <span className="avatar">{proposal.initials}</span>
                    <div>
                      <h3>{proposal.name}</h3>
                      <span className="rating">
                        <Icon name="star" size={13} /> {proposal.rating} ·
                        Execução em {proposal.time}
                      </span>
                    </div>
                    <strong>{currency(proposal.price)}</strong>
                  </div>
                  <p>{proposal.description}</p>
                  <button
                    className="button button-secondary button-sm"
                    disabled={interestedProvider === proposal.name}
                    onClick={() => {
                      setInterestedProvider(proposal.name)
                      setDialog(null)
                      setActiveNav('Visão geral')
                      setNotice(
                        `Interesse registrado em ${proposal.name} nesta sessão. A contratação não está disponível na demonstração.`,
                      )
                    }}
                  >
                    {interestedProvider === proposal.name
                      ? 'Interesse registrado'
                      : 'Tenho interesse'}{' '}
                    <Icon name="arrow" size={15} />
                  </button>
                </article>
              ))}
            </div>
          )}
          {dialog === 'order' && (
            <div className="dialog-stack">
              <span className={`status-badge ${selectedOrder.status}`}>
                <i />
                {selectedOrder.status === 'progress'
                  ? 'Em andamento'
                  : 'Aguardando propostas'}
              </span>
              <h3>{selectedOrder.title}</h3>
              <p>{selectedOrder.description}</p>
              <p className="detail-location">
                <Icon name="pin" size={17} />
                {selectedOrder.location}
              </p>
              <ol className="timeline">
                <li className="done">
                  Pedido criado
                  <small>
                    As informações do seu serviço estão organizadas.
                  </small>
                </li>
                <li
                  className={selectedOrder.status === 'progress' ? 'done' : ''}
                >
                  Recebimento de propostas
                  <small>{selectedOrder.proposals} propostas recebidas.</small>
                </li>
                <li
                  className={selectedOrder.status === 'progress' ? 'done' : ''}
                >
                  Serviço em andamento
                  <small>
                    {selectedOrder.status === 'progress'
                      ? `Previsão de conclusão: ${selectedOrder.deadline}`
                      : 'Aguardando contratação de um profissional.'}
                  </small>
                </li>
                <li>
                  Conclusão e avaliação
                  <small>Confirme a entrega quando o serviço terminar.</small>
                </li>
              </ol>
            </div>
          )}
          {dialog === 'notifications' && (
            <div className="dialog-stack">
              <p className="modal-description">
                Você recebeu 3 novas propostas para a infiltração na laje.
              </p>
              {proposals.map((proposal) => (
                <button
                  className="notification-item"
                  key={proposal.name}
                  onClick={() => {
                    setSelectedOrder(initialOrders[0])
                    openDialog('proposals')
                  }}
                >
                  <span className="icon-tile blue">
                    <Icon name="file" />
                  </span>
                  <span>
                    <strong>{proposal.name}</strong>
                    <small>
                      Enviou uma proposta de {currency(proposal.price)}
                    </small>
                  </span>
                  <Icon name="chevron" size={16} />
                </button>
              ))}
            </div>
          )}
          {(dialog === 'history' ||
            dialog === 'reviews' ||
            dialog === 'payments') && (
            <div className="dialog-stack">
              <p className="modal-description">
                {dialog === 'payments'
                  ? 'Resumo dos pagamentos dos serviços concluídos. Dados de demonstração.'
                  : dialog === 'reviews'
                    ? 'Sua média como contratante é 4,8 de 5, com base nestes serviços.'
                    : 'Serviços concluídos e avaliados. Dados de demonstração.'}
              </p>
              {completed.map((service) => (
                <article className="history-row" key={service.id}>
                  <span className="icon-tile green">
                    <Icon
                      name={dialog === 'payments' ? 'wallet' : service.icon}
                    />
                  </span>
                  <div>
                    <h3>{service.title}</h3>
                    <p>
                      {service.provider} · {service.date}
                    </p>
                  </div>
                  <strong>
                    {dialog === 'reviews' ? (
                      <span className="rating">
                        <Icon name="star" size={15} />
                        {service.rating}
                      </span>
                    ) : (
                      currency(service.price)
                    )}
                  </strong>
                </article>
              ))}
              {dialog === 'payments' && (
                <div className="payment-total">
                  <span>Total pago</span>
                  <strong>
                    {currency(
                      completed.reduce(
                        (total, service) => total + service.price,
                        0,
                      ),
                    )}
                  </strong>
                </div>
              )}
            </div>
          )}
          {dialog === 'contracts' && (
            <div className="dialog-stack">
              <p className="modal-description">
                Resumo ilustrativo do serviço em andamento.
              </p>
              <article className="proposal-card">
                <span className="status-badge progress">
                  <i />
                  Em andamento
                </span>
                <h3>Reparo hidráulico no banheiro</h3>
                <p>
                  Escopo: reparo do vazamento na pia e revisão das conexões.
                  Previsão: 18 de setembro.
                </p>
                <div className="info-box">
                  <Icon name="shield" />
                  <p>
                    A assinatura e a consulta de contratos reais estarão
                    disponíveis quando a plataforma estiver conectada.
                  </p>
                </div>
              </article>
            </div>
          )}
          {dialog === 'messages' && (
            <div className="dialog-stack">
              <div className="info-box">
                <Icon name="chat" />
                <p>
                  Conversa demonstrativa sobre o reparo hidráulico. As mensagens
                  não são enviadas a um profissional.
                </p>
              </div>
              <div
                className="chat-messages"
                role="log"
                aria-label="Histórico da conversa"
              >
                <div className="chat-bubble received">
                  Olá, Ygor! A visita técnica foi concluída. O reparo está
                  previsto para o dia 18.
                </div>
                {messages.map((message, index) => (
                  <div className="chat-bubble sent" key={index}>
                    {message}
                  </div>
                ))}
              </div>
              <form
                className="chat-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (draft.trim()) {
                    setMessages((current) => [...current, draft.trim()])
                    setDraft('')
                  }
                }}
              >
                <input
                  aria-label="Sua mensagem"
                  placeholder="Escreva uma mensagem..."
                  value={draft}
                  maxLength={1000}
                  onChange={(event) => setDraft(event.target.value)}
                  required
                />
                <button
                  className="button button-primary"
                  type="submit"
                  aria-label="Enviar mensagem de demonstração"
                >
                  <Icon name="arrow" />
                </button>
              </form>
            </div>
          )}
          {dialog === 'profile' && (
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                const name = String(data.get('name')).trim()
                const location = String(data.get('location')).trim()
                if (!name || !location) return
                setProfile({ name, location })
                setDialog(null)
                setActiveNav('Visão geral')
                setNotice('Perfil atualizado nesta sessão de demonstração.')
              }}
            >
              <p className="modal-description">
                Seus dados de contratante. Alterações válidas apenas nesta
                sessão.
              </p>
              <label>
                Nome
                <input
                  name="name"
                  defaultValue={profile.name}
                  required
                  maxLength={70}
                />
              </label>
              <label>
                Bairro e cidade
                <input
                  name="location"
                  defaultValue={profile.location}
                  required
                  maxLength={120}
                />
              </label>
              <button className="button button-primary" type="submit">
                Salvar alterações <Icon name="check" size={17} />
              </button>
            </form>
          )}
          {dialog === 'help' && (
            <div className="dialog-stack">
              <p className="modal-description">
                Da ideia ao serviço concluído, acompanhe tudo no seu espaço.
              </p>
              {[
                {
                  title: 'Como criar um pedido?',
                  text: 'Clique em “Criar novo pedido”, escolha a categoria e descreva o serviço. Na demonstração, ele será adicionado à sua lista durante esta sessão.',
                },
                {
                  title: 'Como comparar as propostas?',
                  text: 'Abra “Ver propostas” em um pedido para conferir valor, prazo e descrição de cada profissional.',
                },
                {
                  title: 'Como acompanhar um serviço?',
                  text: 'Nos pedidos em andamento, clique em “Acompanhar” para ver o escopo e as etapas do serviço.',
                },
                {
                  title: 'Posso contratar ou pagar por aqui?',
                  text: 'Esta tela é uma demonstração de interface. Contratações, pagamentos, IA e envio de mensagens ainda dependem de integração com os serviços da plataforma.',
                },
              ].map((item) => (
                <details className="faq" key={item.title}>
                  <summary>{item.title}</summary>
                  <p>{item.text}</p>
                </details>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export default App
