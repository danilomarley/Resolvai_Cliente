import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderMoney } from '../services/orders'
import { signContract, type Contract } from '../services/contractApi'
import { useOrderContract } from '../services/useOrderContract'
import type { Order } from '../types/orders'
import './ContractPanel.css'

const orderNumber = (order: Order) => order.id.slice(0, 8).toUpperCase()
const signedAt = (value: string) => new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })

function Signature({ label, name, at, waiting }: { label: string; name: string; at?: string; waiting: string }) {
  return (
    <li className={at ? 'is-signed' : undefined}>
      <span className="contract-party">{label}</span>
      <strong>{name}</strong>
      <span>{at ? `Assinou em ${signedAt(at)}` : waiting}</span>
    </li>
  )
}

/** O contrato na tela: texto, assinaturas das duas partes e a ação de assinar (só quem ainda não assinou). */
export function ContractView({ order, contract, signing, signError, onSign, onPay }: {
  order: Order
  contract: Contract
  signing?: boolean
  signError?: string
  onSign: () => void
  /** Destino do pagamento, quando houver; sem ele a tela só informa que o contrato está assinado. */
  onPay?: string
}) {
  const signed = contract.status === 'Signed'
  return (
    <article className="panel order-summary contract-panel">
      <h2>Contrato do pedido #{orderNumber(order)}</h2>
      <span className={`status-badge ${signed ? 'completed' : 'progress'}`}><i />{signed ? 'Assinado pelas duas partes' : 'Aguardando assinaturas'}</span>
      <p className="contract-summary">Valor combinado: <strong>{orderMoney(contract.value)}</strong></p>

      <pre className="contract-text" tabIndex={0} aria-label="Texto do contrato">{contract.text}</pre>

      <h3>Assinaturas</h3>
      <ul className="contract-signatures">
        <Signature label="Contratante (você)" name={contract.customerName} at={contract.customerSignedAt} waiting="Aguardando a sua assinatura" />
        <Signature label="Prestador" name={contract.providerName} at={contract.providerSignedAt} waiting="Aguardando assinatura do prestador" />
      </ul>

      {!contract.customerSignedAt && (
        <div className="contract-sign">
          <button type="button" className="button button-primary" disabled={signing} onClick={onSign}>
            {signing ? 'Assinando…' : 'Assinar contrato'}
          </button>
          <p>Ao assinar, você concorda com os termos acima. A data e o IP da assinatura ficam registrados.</p>
        </div>
      )}
      {signError && <p role="alert">{signError}</p>}

      {contract.customerSignedAt && !signed && (
        <p className="contract-wait" role="status">Você já assinou. Falta o prestador assinar; esta tela se atualiza sozinha.</p>
      )}
      {signed && (
        <div className="proposal-accepted" role="status">
          <h3>Contrato assinado</h3>
          <p>As duas partes assinaram. O próximo passo é o pagamento; o serviço começa depois que ele for confirmado.</p>
          {onPay && <Link className="button button-primary" to={onPay}>Ir para pagamento</Link>}
        </div>
      )}
    </article>
  )
}

/** Contrato do pedido (#95, tela C9): busca o contrato na API e registra a assinatura do contratante. */
export function ContractPanel({ order, token, onSigned, onBothSigned, onPay }: {
  order: Order
  token?: string | null
  onSigned?: () => void
  /** Quando o contrato passa a assinado pelas duas partes com a tela aberta (o prestador assinou, ou foi a sua assinatura que fechou). */
  onBothSigned?: () => void
  onPay?: string
}) {
  const { data: contract, error, loading, retry, replace } = useOrderContract(order.id, token)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState('')
  const previous = useRef<Contract['status']>()
  useEffect(() => {
    if (previous.current === 'Pending' && contract?.status === 'Signed') onBothSigned?.()
    previous.current = contract?.status
    // onBothSigned muda a cada render do pai; só a mudança de status importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.status])

  if (!token) return <article className="panel order-summary" role="alert"><p>Entre na sua conta para consultar o contrato.</p></article>
  if (loading) return <article className="panel order-summary"><p role="status">Carregando contrato…</p></article>
  if (!contract) return (
    <article className="panel order-summary" role={error?.status === 404 ? 'status' : 'alert'}>
      {error?.status === 404
        ? <>
          <h2>Contrato ainda não disponível</h2>
          <p>O contrato é gerado quando você aceita uma proposta deste pedido.</p>
          <Link className="button button-secondary" to={`/pedidos/${order.id}/propostas`}>Ver propostas</Link>
        </>
        : <>
          <p>{error?.message ?? 'Não foi possível carregar o contrato.'}</p>
          <button type="button" className="button button-secondary" onClick={retry}>Tentar novamente</button>
        </>}
    </article>
  )

  async function sign(current: Contract) {
    if (signing || !token) return
    setSigning(true)
    setSignError('')
    try {
      replace(await signContract(order.id, current.textHash, token))
      onSigned?.()
    } catch (failure) {
      setSignError(failure instanceof Error ? failure.message : 'Não foi possível assinar o contrato. Tente novamente.')
    } finally {
      setSigning(false)
    }
  }

  return <ContractView order={order} contract={contract} signing={signing} signError={signError} onSign={() => sign(contract)} onPay={onPay} />
}
