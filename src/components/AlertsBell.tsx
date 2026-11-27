import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import { orderMoney } from '../services/orders'
import type { ProposalAlerts } from '../services/alertsApi'
import './AlertsBell.css'

/** Conteúdo do painel: carregando, erro, vazio ou a lista de propostas novas. */
export function AlertsList({ alerts, failed, loading }: { alerts?: ProposalAlerts; failed?: boolean; loading?: boolean }) {
  return (
    <>
      <h2>Novas propostas</h2>
      {loading && !alerts ? <p role="status">Carregando alertas…</p>
        : !alerts ? <p role="alert">Não foi possível carregar os alertas agora.</p>
        : alerts.items.length === 0 ? <p role="status">Nenhuma proposta nova. Quando um profissional enviar uma proposta, ela aparece aqui.</p>
        : (
          <>
            <ul>
              {alerts.items.map((item) => (
                <li key={item.id}>
                  <Link to={`/pedidos/${item.orderId}/propostas/${item.id}`}>
                    <strong>{item.providerName}</strong>
                    <span>{item.orderTitle}</span>
                    <span className="alerts-value">{orderMoney(item.value)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {alerts.total > alerts.items.length && (
              <Link className="alerts-more" to="/pedidos?status=Pending&stage=Open">
                Ver todos os pedidos com propostas ({alerts.total - alerts.items.length} a mais)
              </Link>
            )}
          </>
        )}
      {failed && alerts && <p className="alerts-stale" role="status">Não foi possível atualizar agora; mostrando o último resultado.</p>}
    </>
  )
}

const badgeText = (total: number) => (total > 9 ? '9+' : String(total))

/**
 * Alertas de novas propostas na navbar (#90): contador de propostas ainda não visualizadas e, ao abrir,
 * a lista com pedido, prestador e valor. Cada item leva ao detalhe da proposta, que a marca como visualizada.
 */
export function AlertsBell({ alerts, failed, loading }: { alerts?: ProposalAlerts; failed?: boolean; loading?: boolean }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const location = useLocation()
  const total = alerts?.total ?? 0

  // Navegar (inclusive para um item da lista) fecha o painel.
  useEffect(() => { setOpen(false) }, [location.pathname, location.search])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus() }
    }
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer) }
  }, [open])

  const label = total === 0 ? 'Alertas: nenhuma proposta nova' : `Alertas: ${total} ${total === 1 ? 'proposta nova' : 'propostas novas'}`
  return (
    <div className="alerts" ref={root}>
      <button type="button" className="icon-button notification-button alerts-button" aria-label={label}
        aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
        <Icon name="bell" />
        {total > 0 && <span className="alerts-badge" aria-hidden="true">{badgeText(total)}</span>}
      </button>
      {open && (
        <div className="alerts-panel" id={panelId} role="region" aria-label="Novas propostas">
          <AlertsList alerts={alerts} failed={failed} loading={loading} />
        </div>
      )}
    </div>
  )
}
