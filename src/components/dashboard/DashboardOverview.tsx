import { Icon, type IconName } from '../Icon'
import { HouseIllustration } from '../HouseIllustration'
import { OrdersPanel } from './OrdersPanel'
// REMOVIDO: import { completed, currency, initialOrders, type Order } from '../../data/dashboard'
import type { Order } from './OrdersPanel'
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

// 1. Recriando a função de formatar moeda (você pode mover isso para um utils depois)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
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
  
  // 2. Garante que orders existe antes de fazer o reduce (prevenção de erros)
  const proposalCount = (orders || []).reduce(
    (total, order) => total + (order.proposals || 0),
    0,
  )

  // 3. Array temporário de serviços concluídos (substitua isso futuramente por dados da API)
  const completed: any[] = [] 

  // 4. Fallback seguro para o primeiro nome do usuário
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'Usuário'

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TUDO SOB CONTROLE</p>
          <h1>
            Olá, {firstName} <span className="wave">✳</span>
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
              value: String((orders || []).length).padStart(2, '0'),
              icon: 'bag',
              color: 'blue',
              detail: orders?.length > 0 ? `+${orders.length - 1} novos nesta semana` : 'Nenhum pedido ativo',
              detailIcon: 'trend',
              action: () => navigate('Meus pedidos'),
            },
            {
              label: 'Propostas recebidas',
              value: String(proposalCount).padStart(2, '0'),
              icon: 'file',
              color: 'purple',
              detail: unread
                ? 'Propostas para conferir'
                : 'Suas propostas estão em dia',
              detailIcon: 'clock',
              action: () => {
                // Abre o primeiro pedido APENAS se existir algum pedido
                if (orders && orders.length > 0) {
                    openOrder(orders[0], 'proposals')
                } else {
                    // Opcional: mostrar um alerta ou direcionar para criar pedido
                    openDialog('create')
                }
              },
            },
            {
              label: 'Serviços concluídos',
              value: String(completed.length).padStart(2, '0'), // Agora dinâmico
              icon: 'circleCheck',
              color: 'green',
              detail: completed.length > 0 ? 'Tudo certo por aqui' : 'Nenhum serviço ainda',
              detailIcon: 'check',
              action: () => openDialog('history'),
            },
            {
              label: 'Sua avaliação',
              // Mostra a nota real se existir no perfil, senão mostra traços
              value: profile?.rating ? String(profile.rating).replace('.', ',') : '-,-', 
              icon: 'star',
              color: 'amber',
              detail: 'Aguardando avaliações', // Antes estava fixo em "Com base em 3 serviços"
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
            <span className="resolved-count">{completed.length}</span>
          </div>
          <div className="completed-list">
            {completed.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-muted)' }}>
                Nenhum serviço concluído ainda.
              </p>
            ) : (
              completed.map((service) => (
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
                      {formatCurrency(service.price)}
                      <span className="rating">
                        <Icon name="star" size={12} />
                        {service.rating}
                      </span>
                    </span>
                  </span>
                  <Icon name="chevron" size={15} />
                </button>
              ))
            )}
          </div>
          <div className="completed-bottom">
            <span className="mini-avatars">
              {/* Você pode querer deixar esses ícones vazios ou escondidos quando não há serviços */}
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