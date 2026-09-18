import { Icon } from '../Icon'
import type { Order } from '../../data/dashboard'
import type { Dialog, Tab } from '../../types/dashboard'

type OrdersPanelProps = {
  orders: Order[]
  tab: Tab
  setTab: (tab: Tab) => void
  search: string
  setSearch: (search: string) => void
  openDialog: (dialog: Dialog) => void
  openOrder: (order: Order, target?: Dialog) => void
}

export function OrdersPanel({
  orders,
  tab,
  setTab,
  search,
  setSearch,
  openDialog,
  openOrder,
}: OrdersPanelProps) {
  const visibleOrders = orders.filter(
    (order) =>
      (tab === 'all' || order.status === tab) &&
      `${order.title} ${order.category}`
        .toLocaleLowerCase('pt-BR')
        .includes(search.toLocaleLowerCase('pt-BR')),
  )

  return (
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
      <div
        className="tabs"
        role="tablist"
        aria-label="Filtrar pedidos"
      >
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
                document
                  .getElementById(`tab-${tabs[next].id}`)
                  ?.focus()
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
                      order.status === 'waiting'
                        ? 'file'
                        : 'calendar'
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
        <span>
          Do primeiro contato à entrega, tudo em um só lugar.
        </span>
      </div>
    </section>
  )
}
