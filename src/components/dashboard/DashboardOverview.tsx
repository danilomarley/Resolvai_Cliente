import { Icon, type IconName } from '../Icon'
import { HouseIllustration } from '../HouseIllustration'
import { OrdersPanel } from './OrdersPanel'
import { completed, currency, initialOrders, type Order } from '../../data/dashboard'
import type { Dialog, Profile, Tab } from '../../types/dashboard'

type DashboardOverviewProps = {
  orders: Order[]
  profile: Profile
  unread: boolean
  tab: Tab
  setTab: (tab: Tab) => void
  search: string
  setSearch: (search: string) => void
  navigate: (label: string, target?: Dialog) => void
  openDialog: (dialog: Dialog) => void
  openOrder: (order: Order, target?: Dialog) => void
}

export function DashboardOverview({
  orders,
  profile,
  unread,
  tab,
  setTab,
  search,
  setSearch,
  navigate,
  openDialog,
  openOrder,
}: DashboardOverviewProps) {
  const proposalCount = orders.reduce(
    (total, order) => total + order.proposals,
    0,
  )

  return (
    <>
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
      <section
        className="welcome-banner"
        aria-labelledby="welcome-title"
      >
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
            <br className="desktop-break" /> cada detalhe do serviço em
            um só lugar.
          </p>
          <button
            className="button hero-button"
            onClick={() => openDialog('create')}
          >
            <Icon name="plus" size={19} /> Criar pedido{' '}
            <Icon name="arrow" size={18} />
          </button>
          <span className="hero-note">
            <Icon name="check" size={13} /> Simples, rápido e do seu
            jeito
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
                openOrder(initialOrders[0], 'proposals')
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
        <OrdersPanel
          orders={orders}
          tab={tab}
          setTab={setTab}
          search={search}
          setSearch={setSearch}
          openDialog={openDialog}
          openOrder={openOrder}
        />

        <section
          className="panel completed-panel"
          aria-labelledby="completed-title"
        >
          <div className="panel-heading">
            <div>
              <h2 id="completed-title">
                Serviços concluídos{' '}
                <span className="tiny-spark">✦</span>
              </h2>
              <p>Serviços finalizados, valores e avaliações.</p>
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
            Propostas, conversas e serviços organizados para você
            contratar com mais tranquilidade.
          </p>
        </div>
        <button
          className="text-button"
          onClick={() => openDialog('help')}
        >
          Conheça a ResolvAI <Icon name="arrow" size={17} />
        </button>
      </section>
      <footer className="page-footer">
        <span>
          © 2026 ResolvAI. Conectando quem precisa a quem resolve.
        </span>
        <span>
          <span className="online-dot" /> Seu lar, nossa conexão.
        </span>
      </footer>
    </>
  )
}
