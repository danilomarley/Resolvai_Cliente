import { Icon, type IconName } from '../Icon'
import { HouseIllustration } from '../HouseIllustration'
import { OrdersPanel } from './OrdersPanel'
import type { Order } from '../../data/dashboard'
import type { Dialog, Profile, Tab } from '../../types/dashboard'
import type { HomeSummary } from '../../services/dashboardApi'

type Props = {
  orders: Order[]
  summary: HomeSummary
  profile: Profile
  tab: Tab
  setTab: (tab: Tab) => void
  search: string
  setSearch: (search: string) => void
  navigate: (label: string, target?: Dialog) => void
  openDialog: (dialog: Dialog) => void
  openOrder: (order: Order, target?: Dialog) => void
}

export function DashboardOverview({ orders, summary, profile, tab, setTab, search, setSearch, navigate, openDialog, openOrder }: Props) {
  const counts = summary.orders
  const stats: { label: string; value: number; icon: IconName; color: string }[] = [
    { label: 'Pedidos pendentes', value: counts.pending, icon: 'clock', color: 'amber' },
    { label: 'Em andamento', value: counts.inProgress, icon: 'bag', color: 'blue' },
    { label: 'Serviços concluídos', value: counts.completed, icon: 'circleCheck', color: 'green' },
    { label: 'Pedidos cancelados', value: counts.cancelled, icon: 'file', color: 'purple' },
  ]
  return (
    <>
      <div className="page-heading"><div>
        <p className="eyebrow">TUDO SOB CONTROLE</p>
        <h1>Olá, {profile.name.split(' ')[0]}</h1>
        <p>{counts.total} {counts.total === 1 ? 'pedido na sua conta' : 'pedidos na sua conta'}.</p>
      </div></div>
      <section className="welcome-banner" aria-labelledby="welcome-title">
        <div className="hero-copy"><h2 id="welcome-title">Seu próximo projeto.<br /><span>A gente ajuda a resolver.</span></h2>
          <p>Acompanhe os pedidos da sua conta em um só lugar.</p>
          <button className="button hero-button" onClick={() => navigate('Meus pedidos')}>Meus pedidos <Icon name="arrow" size={18} /></button>
        </div><HouseIllustration />
      </section>
      <section className="stats-grid" aria-label="Resumo da sua conta">
        {stats.map((stat) => <article className="stat-card" key={stat.label}>
          <div className="stat-top"><span>{stat.label}</span><span className={`icon-tile ${stat.color}`}><Icon name={stat.icon} size={21} /></span></div>
          <strong className="stat-value">{stat.value}</strong><span className="stat-detail">Total na conta</span>
        </article>)}
      </section>
      <p className="api-summary-note">Pedidos recentes: até cinco registros. Os contadores incluem todos os pedidos da conta. A busca e os filtros atuam nos registros abaixo.</p>
      <OrdersPanel orders={orders} tab={tab} setTab={setTab} search={search} setSearch={setSearch} openDialog={openDialog} openOrder={openOrder} />
      <footer className="page-footer"><span>© 2026 ResolvAI. Conectando quem precisa a quem resolve.</span></footer>
    </>
  )
}
