import { Link } from 'react-router-dom'
import { AcceptProposalModal } from './AcceptProposalModal'
import { useModalRoute } from '../services/modalRoute'
import { orderDate, orderMoney } from '../services/orders'
import { acceptBlock, ratingLabel } from '../services/proposalsApi'
import { useProposalDetail } from '../services/useProposalDetail'
import type { Order } from '../types/orders'

const statusLabels = { Sent: 'Recebida', Viewed: 'Visualizada', Chosen: 'Escolhida', NotChosen: 'Não escolhida' }

/** Detalhe de uma proposta e aceite (#89, tela C6). O modal de confirmação vive na URL (?modal=aceitar-proposta). */
export function ProposalDetail({ order, proposalId, token, onAccepted }: {
  order: Order
  proposalId: string
  token?: string | null
  onAccepted?: () => void
}) {
  const modal = useModalRoute(['aceitar-proposta'] as const)
  const { data: proposal, error, loading, retry } = useProposalDetail(order.id, proposalId, token)
  const back = <Link className="button button-secondary" to={`/pedidos/${order.id}/propostas`}>Voltar às propostas</Link>

  if (!token) return <article className="panel order-summary" role="alert"><p>Entre na sua conta para consultar a proposta.</p>{back}</article>
  if (loading) return <article className="panel order-summary"><p role="status">Carregando proposta…</p></article>
  if (!proposal) return (
    <article className="panel order-summary" role="alert">
      <p>{error?.status === 404 ? 'Esta proposta não está disponível para o seu pedido.' : error?.message ?? 'Não foi possível carregar a proposta.'}</p>
      {error?.status !== 404 && <button type="button" className="button button-secondary" onClick={retry}>Tentar novamente</button>}
      {back}
    </article>
  )

  const blocked = acceptBlock(order, proposal)
  return (
    <article className="panel order-summary proposal-detail">
      {back}
      <h2>Proposta de {proposal.providerName}</h2>
      <span className={`status-badge ${proposal.status === 'Chosen' ? 'completed' : 'progress'}`}><i />{statusLabels[proposal.status]}</span>

      {proposal.status === 'Chosen' && (
        <div className="proposal-accepted" role="status">
          <h3>Proposta aceita</h3>
          <p>Você escolheu {proposal.providerName} para este pedido. As demais propostas foram encerradas.
            O serviço começa depois do contrato e do pagamento.</p>
        </div>
      )}

      <dl>
        <div><dt>Valor</dt><dd>{orderMoney(proposal.value)}</dd></div>
        <div><dt>Prazo</dt><dd>{proposal.deadline ?? 'Não informado'}</dd></div>
        <div><dt>Garantia</dt><dd>{proposal.warranty ?? 'Não informada'}</dd></div>
        <div><dt>Enviada em</dt><dd>{orderDate(proposal.createdAt)}</dd></div>
      </dl>
      <h3>Descrição</h3>
      <p>{proposal.description ?? 'O prestador não incluiu uma descrição.'}</p>

      <h3>Sobre o prestador</h3>
      <dl>
        <div><dt>Nome</dt><dd>{proposal.providerName}</dd></div>
        <div><dt>Avaliação</dt><dd>{ratingLabel(proposal.providerRating)}</dd></div>
        <div><dt>Serviços concluídos</dt><dd>{proposal.providerProfile.completedServices}</dd></div>
        <div><dt>Na plataforma desde</dt><dd>{orderDate(proposal.providerProfile.memberSince)}</dd></div>
      </dl>

      {proposal.status !== 'Chosen' && (
        <div className="proposal-accept">
          <button type="button" className="button button-primary" disabled={!!blocked} aria-describedby={blocked ? 'accept-blocked' : undefined}
            onClick={() => modal.open('aceitar-proposta')}>Aceitar proposta</button>
          {blocked && <p id="accept-blocked" role="status">{blocked}</p>}
        </div>
      )}

      {modal.current === 'aceitar-proposta' && !blocked && (
        <AcceptProposalModal order={order} proposal={proposal} token={token} onClose={modal.close}
          onAccepted={() => { modal.close(); retry(); onAccepted?.() }} />
      )}
    </article>
  )
}
