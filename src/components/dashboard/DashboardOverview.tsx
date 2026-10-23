import { Icon, type IconName } from '../Icon'
import { HouseIllustration } from '../HouseIllustration'
import { OrdersPanel } from './OrdersPanel'
import type { Order } from '../../types/orders'
import type { Dialog, Profile, Tab } from '../../types/dashboard'
import type { HomeSummary } from '../../services/dashboardApi'
import { orderMoney } from '../../services/orders'

type Props = {
  orders: Order[]
  summary: HomeSummary
  completed: { orders: Order[]; loading: boolean; error?: string }
  profile: Profile
  tab: Tab
  setTab: (tab: Tab) => void
  search: string
  setSearch: (search: string) => void
  navigate: (label: string, target?: Dialog) => void
  openDialog: (dialog: Dialog) => void
  openOrder: (order: Order, target?: Dialog) => void
  onViewCompleted: () => void
}

type Stat = {
  label: string
  value: string
  suffix?: string
  icon: IconName
  color: string
  detail: string
  detailIcon: IconName
  action?: () => void
}

const twoDigits = (value: number) => String(value).padStart(2, '0')
const plural = (value: number, singular: string, plural: string) => `${value} ${value === 1 ? singular : plural}`

export function DashboardOverview({ orders, summary, completed, profile, tab, setTab, search, setSearch, navigate,
  openDialog, openOrder, onViewCompleted }: Props) {
  const counts = summary.orders
  const active = counts.active ?? counts.pending + counts.inProgress
  const newThisWeek = counts.createdLast7Days
  const proposals = summary.proposals

  // Cards do layout aprovado (#64). "Sua avaliação" ainda não tem fonte de dados: não existe tabela de avaliações.
  const stats: Stat[] = [
    {
      label: 'Pedidos ativos', value: twoDigits(active), icon: 'bag', color: 'blue', detailIcon: 'trend',
      detail: newThisWeek === undefined ? 'Recebendo propostas ou em andamento'
        : newThisWeek > 0 ? `+${plural(newThisWeek, 'novo', 'novos')} nesta semana` : 'Nenhum pedido novo nesta semana',
      action: () => navigate('Meus pedidos'),
    },
    {
      label: 'Propostas recebidas', value: proposals ? twoDigits(proposals.awaitingDecision) : '—', icon: 'file',
      color: 'purple', detailIcon: 'clock',
      detail: !proposals ? 'Propostas indisponíveis no momento'
        : proposals.unviewed > 0 ? `${plural(proposals.unviewed, 'proposta', 'propostas')} para conferir` : 'Suas propostas estão em dia',
      action: () => navigate('Meus pedidos'),
    },
    {
      label: 'Serviços concluídos', value: twoDigits(counts.completed), icon: 'circleCheck', color: 'green',
      detailIcon: 'check', detail: counts.completed > 0 ? 'Tudo certo por aqui' : 'Nenhum serviço concluído ainda',
      action: onViewCompleted,
    },
    {
      label: 'Sua avaliação', value: '—', icon: 'star', color: 'amber', detailIcon: 'star',
      detail: 'Avaliações em breve',
    },
  ]

  return (
    <>
      <div className="page-heading"><div>
        <p className="eyebrow">TUDO SOB CONTROLE</p>
        <h1>Olá, {profile.name.split(' ')[0]}</h1>
        <p>Um lar bem cuidado começa por aqui. Vamos resolver?</p>
      </div></div>
      <section className="welcome-banner" aria-labelledby="welcome-title">
        <div className="hero-copy">
          <span className="hero-kicker"><Icon name="sparkles" size={15} /> MENOS COMPLICAÇÃO. MAIS SOLUÇÃO.</span>
          <h2 id="welcome-title">Seu próximo projeto.<br /><span>A gente ajuda a resolver.</span></h2>
          <p>Encontre o profissional certo e acompanhe<br className="desktop-break" /> cada detalhe do serviço em um só lugar.</p>
          <button className="button hero-button" onClick={() => openDialog('create')}>
            <Icon name="plus" size={19} /> Criar pedido <Icon name="arrow" size={18} />
          </button>
        </div>
        <HouseIllustration />
      </section>

      <section className="stats-grid" aria-label="Resumo da sua conta">
        {stats.map((stat) => {
          const content = <>
            <div className="stat-top"><span>{stat.label}</span>
              <span className={`icon-tile ${stat.color}`}><Icon name={stat.icon} size={21} /></span></div>
            <strong className="stat-value">{stat.value}</strong>
            <span className={`stat-detail ${stat.color}`}><Icon name={stat.detailIcon} size={14} />{stat.detail}</span>
          </>
          return stat.action
            ? <button className="stat-card" key={stat.label} onClick={stat.action}>{content}</button>
            : <article className="stat-card" key={stat.label}>{content}</article>
        })}
      </section>

      <div className="dashboard-grid">
        <OrdersPanel orders={orders} tab={tab} setTab={setTab} search={search} setSearch={setSearch}
          openDialog={openDialog} openOrder={openOrder} />

        <section className="panel completed-panel" aria-labelledby="completed-title">
          <div className="panel-heading">
            <div>
              <h2 id="completed-title">Serviços concluídos <span className="tiny-spark">✦</span></h2>
              <p>Serviços finalizados e valores combinados.</p>
            </div>
            <span className="resolved-count">{counts.completed}</span>
          </div>
          <div className="completed-list">
            {completed.loading ? <p role="status">Carregando serviços concluídos…</p>
              : completed.error ? <p role="alert">{completed.error}</p>
              : completed.orders.length ? completed.orders.map((order) => (
                <button className="completed-item" key={order.id} onClick={() => openOrder(order)}>
                  <span className="completed-icon"><Icon name={order.icon} size={21} /><i><Icon name="check" size={9} /></i></span>
                  <span className="completed-info">
                    <strong>{order.title}</strong>
                    <span>{order.category}</span>
                    <span className="completed-price">{orderMoney(order.chosenProposalValue)}</span>
                  </span>
                  <Icon name="chevron" size={15} />
                </button>
              ))
              : <p>Nenhum serviço concluído ainda. Quando um pedido for finalizado, ele aparece aqui.</p>}
          </div>
          <button className="history-button" onClick={onViewCompleted}>
            Ver histórico de serviços <Icon name="arrow" size={16} />
          </button>
        </section>
      </div>

      <footer className="page-footer"><span>© 2026 ResolvAI. Conectando quem precisa a quem resolve.</span></footer>
    </>
  )
}
