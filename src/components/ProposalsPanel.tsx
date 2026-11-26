import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Order } from '../types/orders'
import { orderMoney } from '../services/orders'
import { bestIds, maxCompared, minCompared, proposalSorts, ratingLabel, type ProposalDto, type ProposalSort } from '../services/proposalsApi'
import { useOrderProposals } from '../services/useOrderProposals'
import { ProposalDetail } from './ProposalDetail'
import './ProposalsPanel.css'

const statusLabels = { Sent: 'Recebida', Viewed: 'Visualizada', Chosen: 'Escolhida', NotChosen: 'Não escolhida' }
const orderNumber = (order: Order) => order.id.slice(0, 8).toUpperCase()

type Props = { order: Order; token?: string | null; proposalId?: string; onAccepted?: () => void }
type Best = { price: Set<string>; deadline: Set<string> }

function Badges({ proposal, best }: { proposal: ProposalDto; best?: Best }) {
  return (
    <>
      <span className={`status-badge ${proposal.status === 'Chosen' ? 'completed' : 'progress'}`}><i />{statusLabels[proposal.status]}</span>
      {best?.price.has(proposal.id) && <span className="proposal-highlight">Menor preço</span>}
      {best?.deadline.has(proposal.id) && <span className="proposal-highlight">Menor prazo</span>}
    </>
  )
}

function Comparison({ order, proposals, onClose }: { order: Order; proposals: ProposalDto[]; onClose: () => void }) {
  const best = bestIds(proposals)
  const rows: { label: string; cell: (proposal: ProposalDto) => string; best?: Set<string>; tag?: string }[] = [
    { label: 'Preço', cell: (proposal) => orderMoney(proposal.value), best: best.price, tag: 'Menor preço' },
    { label: 'Prazo', cell: (proposal) => proposal.deadline ?? 'Não informado', best: best.deadline, tag: 'Menor prazo' },
    { label: 'Garantia', cell: (proposal) => proposal.warranty ?? 'Não informada' },
    { label: 'Avaliação', cell: (proposal) => ratingLabel(proposal.providerRating) },
    { label: 'Descrição', cell: (proposal) => proposal.description ?? 'Sem descrição' },
  ]
  return (
    <article className="panel order-summary proposal-compare" aria-label="Comparação de propostas">
      <h2>Comparando {proposals.length} propostas</h2>
      <button type="button" className="button button-secondary" onClick={onClose}>Voltar à lista</button>
      <div className="compare-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Critério</span></th>
              {proposals.map((proposal) => (
                <th scope="col" key={proposal.id}>
                  {proposal.providerName}
                  <Link className="button button-secondary" to={`/pedidos/${order.id}/propostas/${proposal.id}`}
                    aria-label={`Ver detalhe da proposta de ${proposal.providerName}`}>Ver detalhe</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {proposals.map((proposal) => (
                  <td key={proposal.id} className={row.best?.has(proposal.id) ? 'is-best' : undefined}>
                    {row.cell(proposal)}
                    {row.best?.has(proposal.id) && <span className="proposal-highlight">{row.tag}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

/** Propostas recebidas do pedido (#86) e comparação lado a lado (#87). Dados vêm de GET /orders/{id}/proposals. */
export function ProposalsPanel({ order, token, proposalId, onAccepted }: Props) {
  const [sort, setSort] = useState<ProposalSort>('rating')
  const [selected, setSelected] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  // Com uma proposta aberta, a lista não é necessária: o detalhe tem a própria consulta.
  const { data, error, loading, retry } = useOrderProposals(proposalId ? undefined : order.id, token, sort)

  if (proposalId) return <ProposalDetail key={proposalId} order={order} proposalId={proposalId} token={token} onAccepted={onAccepted} />

  if (!token) return <article className="panel order-summary" role="alert"><p>Entre na sua conta para consultar as propostas.</p></article>
  if (!data && loading) return <article className="panel order-summary"><p role="status">Carregando propostas…</p></article>
  if (!data) return (
    <article className="panel order-summary" role="alert">
      <p>{error?.status === 404 ? 'Este pedido não está disponível para sua conta.' : error?.message ?? 'Não foi possível carregar as propostas.'}</p>
      <button type="button" className="button button-secondary" onClick={retry}>Tentar novamente</button>
    </article>
  )
  const chosen = data.filter((proposal) => selected.includes(proposal.id))
  if (comparing && chosen.length >= minCompared) return <Comparison order={order} proposals={chosen} onClose={() => setComparing(false)} />

  const toggle = (id: string) => setSelected((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : current.length < maxCompared ? [...current, id] : current)

  return (
    <article className="panel order-summary">
      <h2>Propostas do pedido #{orderNumber(order)}</h2>
      {data.length === 0 ? (
        <p role="status">Nenhuma proposta recebida ainda. Assim que um profissional enviar, ela aparece aqui.</p>
      ) : (
        <>
          <div className="proposal-toolbar">
            <label>Ordenar por{' '}
              <select value={sort} onChange={(event) => setSort(event.target.value as ProposalSort)}>
                {proposalSorts.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            {data.length > 1 && (
              <button type="button" className="button button-primary" disabled={chosen.length < minCompared} onClick={() => setComparing(true)}>
                Comparar selecionadas ({chosen.length}/{maxCompared})
              </button>
            )}
          </div>
          {data.length > 1 && <p className="proposal-hint">Selecione de {minCompared} a {maxCompared} propostas para compará-las lado a lado.</p>}
          <ul className="proposal-list">
            {data.map((proposal) => {
              const checked = selected.includes(proposal.id)
              return (
                <li className="proposal-item" key={proposal.id}>
                  <strong>{proposal.providerName}</strong>
                  <Badges proposal={proposal} />
                  <dl>
                    <div><dt>Valor</dt><dd>{orderMoney(proposal.value)}</dd></div>
                    <div><dt>Prazo</dt><dd>{proposal.deadline ?? 'Não informado'}</dd></div>
                    <div><dt>Garantia</dt><dd>{proposal.warranty ?? 'Não informada'}</dd></div>
                    <div><dt>Avaliação</dt><dd>{ratingLabel(proposal.providerRating)}</dd></div>
                  </dl>
                  {proposal.description && <p>{proposal.description}</p>}
                  <div className="order-actions">
                    <Link className="button button-secondary" to={`/pedidos/${order.id}/propostas/${proposal.id}`}
                      aria-label={`Ver detalhe da proposta de ${proposal.providerName}`}>Ver detalhe</Link>
                    {data.length > 1 && (
                      <label className="proposal-select">
                        <input type="checkbox" checked={checked} disabled={!checked && selected.length >= maxCompared}
                          onChange={() => toggle(proposal.id)} />
                        Comparar
                      </label>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </article>
  )
}
