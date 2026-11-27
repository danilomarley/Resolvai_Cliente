import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderMoney } from '../services/orders'
import { createPayment, remainingLabel, simulatePayment, type Payment } from '../services/paymentApi'
import { usePayment } from '../services/usePayment'
import type { Order } from '../types/orders'
import './PaymentPanel.css'

const orderNumber = (order: Order) => order.id.slice(0, 8).toUpperCase()
const paidAt = (value: string) => new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })

/** Valor combinado: o da proposta aceita (detalhe) ou o que a lista traz. */
const agreedValue = (order: Order) => order.proposalList?.find((proposal) => proposal.status === 'Chosen')?.value ?? order.chosenProposalValue

function Countdown({ expiresAt, onElapsed }: { expiresAt: string; onElapsed?: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  const elapsed = Date.parse(expiresAt) <= now
  useEffect(() => {
    if (elapsed) { onElapsed?.(); return }
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
    // onElapsed muda a cada render do pai; o que importa é o instante em que o prazo vence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed])
  return <p className="payment-timer">Expira em <time dateTime={expiresAt}>{remainingLabel(expiresAt, now)}</time></p>
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState<'' | 'ok' | 'fail'>('')
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied('ok')
    } catch {
      // Sem permissão de área de transferência: a pessoa ainda pode selecionar o código no campo.
      setCopied('fail')
    }
  }
  return (
    <div className="payment-code">
      <label>Pix copia e cola
        <textarea readOnly rows={4} value={code} onFocus={(event) => event.currentTarget.select()} />
      </label>
      <button type="button" className="button button-secondary" onClick={copy}>Copiar código</button>
      {copied === 'ok' && <p role="status">Código copiado. Cole no app do seu banco.</p>}
      {copied === 'fail' && <p role="status">Não foi possível copiar sozinho. Selecione o código acima e copie.</p>}
    </div>
  )
}

/** O Pix na tela, em cada estado: ainda sem cobrança, pendente, pago, expirado. */
export function PaymentView({ order, payment, generating, simulating, actionError, onGenerate, onSimulate, onElapsed }: {
  order: Order
  /** Sem cobrança ainda (a API respondeu 404). */
  payment?: Payment
  generating?: boolean
  simulating?: boolean
  actionError?: string
  onGenerate: () => void
  onSimulate: () => void
  /** O prazo do Pix acabou na tela: hora de conferir o status na API. */
  onElapsed?: () => void
}) {
  const value = payment?.amount ?? agreedValue(order)
  const canGenerate = order.stage === 'AwaitingPayment'
  const generate = (label: string) => (
    <div className="payment-actions">
      <button type="button" className="button button-primary" disabled={generating} onClick={onGenerate}>{generating ? 'Gerando Pix…' : label}</button>
    </div>
  )

  return (
    <article className="panel order-summary payment-panel">
      <h2>Pagamento do pedido #{orderNumber(order)}</h2>
      <p className="payment-value">Valor a pagar: <strong>{orderMoney(value)}</strong></p>

      {!payment && (canGenerate
        ? <>
          <p>O pagamento é por Pix. O código vale por 30 minutos e, depois da confirmação, o serviço começa.</p>
          {generate('Gerar Pix')}
        </>
        : <p role="status">Não há pagamento registrado para este pedido.</p>)}

      {payment?.status === 'Pending' && (
        <>
          <span className="status-badge progress"><i />Aguardando pagamento</span>
          <div className="payment-grid">
            {payment.qrCodeBase64 && <img className="payment-qr" src={payment.qrCodeBase64} alt="QR Code do Pix" width={220} height={220} />}
            <div>
              <p>Abra o app do seu banco, escolha pagar com Pix e leia o QR Code ou cole o código.</p>
              <CopyCode code={payment.brCode} />
              {payment.expiresAt && <Countdown expiresAt={payment.expiresAt} onElapsed={onElapsed} />}
            </div>
          </div>
          <p className="payment-wait" role="status">Esta tela confere o pagamento sozinha. Não precisa recarregar a página.</p>
          {payment.testMode && (
            <div className="payment-test">
              <strong>Modo de teste</strong>
              <p>Esta cobrança é de teste: nenhum dinheiro é cobrado. Use o botão abaixo para simular o pagamento.</p>
              <button type="button" className="button button-secondary" disabled={simulating} onClick={onSimulate}>
                {simulating ? 'Simulando…' : 'Simular pagamento'}
              </button>
            </div>
          )}
        </>
      )}

      {payment && (payment.status === 'Expired' || payment.status === 'Cancelled') && (
        <>
          <span className="status-badge cancelled"><i />{payment.status === 'Expired' ? 'Pix expirado' : 'Pix cancelado'}</span>
          <p>{payment.status === 'Expired' ? 'O tempo para pagar este Pix acabou.' : 'Esta cobrança foi cancelada.'} Nenhum valor foi cobrado.</p>
          {canGenerate ? generate('Gerar novo Pix') : null}
        </>
      )}

      {payment?.status === 'Paid' && payment.paidAt && (
        <div className="proposal-accepted" role="status">
          <h3>Pagamento confirmado</h3>
          <p>Recebemos {orderMoney(payment.amount)} em {paidAt(payment.paidAt)}.{' '}
            {order.status === 'completed' ? 'O serviço foi concluído.' : 'O serviço está em andamento.'}</p>
          <Link className="button button-primary" to={`/pedidos/${order.id}/acompanhar`}>Acompanhar o serviço</Link>
        </div>
      )}

      {actionError && <p role="alert">{actionError}</p>}
    </article>
  )
}

/** Pagamento do pedido (#97, tela C10): gera o Pix, mostra QR Code e código, e acompanha a confirmação. */
export function PaymentPanel({ order, token, onPaid }: {
  order: Order
  token?: string | null
  /** Chamado quando o Pix pendente vira pago, para recarregar o pedido (que passa a Em andamento). */
  onPaid?: () => void
}) {
  // Só há o que consultar com o contrato assinado pelas duas partes ou depois de pago.
  const reachable = order.stage === 'AwaitingPayment' || order.status === 'progress' || order.status === 'completed'
  const { data: payment, error, loading, retry, refresh, replace } = usePayment(reachable ? order.id : undefined, token)
  const [generating, setGenerating] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [actionError, setActionError] = useState('')
  const previous = useRef<Payment['status']>()

  useEffect(() => {
    if (previous.current === 'Pending' && payment?.status === 'Paid') onPaid?.()
    previous.current = payment?.status
    // onPaid muda a cada render do pai; só a mudança de status importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment?.status])

  async function run(action: typeof createPayment, busy: (value: boolean) => void, failure: string) {
    if (!token) return
    busy(true)
    setActionError('')
    try {
      replace(await action(order.id, token))
    } catch (problem) {
      setActionError(problem instanceof Error ? problem.message : failure)
    } finally {
      busy(false)
    }
  }

  if (!token) return <article className="panel order-summary" role="alert"><p>Entre na sua conta para consultar o pagamento.</p></article>
  if (!reachable) return (
    <article className="panel order-summary payment-panel" role="status">
      <h2>Pagamento ainda não disponível</h2>
      {order.status === 'cancelled'
        ? <p>Este pedido foi cancelado, então não há pagamento.</p>
        : order.stage === 'AwaitingSignatures'
          ? <>
            <p>O pagamento começa depois que você e o prestador assinarem o contrato.</p>
            <Link className="button button-primary" to={`/pedidos/${order.id}/contrato`}>Ver contrato</Link>
          </>
          : <>
            <p>O pagamento começa depois que você aceita uma proposta e as duas partes assinam o contrato.</p>
            <Link className="button button-secondary" to={`/pedidos/${order.id}/propostas`}>Ver propostas</Link>
          </>}
    </article>
  )
  if (loading) return <article className="panel order-summary"><p role="status">Carregando pagamento…</p></article>
  if (error && error.status !== 404) return (
    <article className="panel order-summary" role="alert">
      <p>{error.message}</p>
      <button type="button" className="button button-secondary" onClick={retry}>Tentar novamente</button>
    </article>
  )

  return <PaymentView order={order} payment={payment} generating={generating} simulating={simulating} actionError={actionError}
    onGenerate={() => run(createPayment, setGenerating, 'Não foi possível gerar o Pix. Tente novamente.')}
    onSimulate={() => run(simulatePayment, setSimulating, 'Não foi possível simular o pagamento. Tente novamente.')}
    onElapsed={refresh} />
}
