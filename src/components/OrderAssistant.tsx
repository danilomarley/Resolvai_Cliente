import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import type { AssistantMessage, AssistantReply, AssistantScope } from '../services/dashboardApi'
import type { NewOrder } from '../types/orders'
import { scopeToOrder } from '../services/orderDraft'
import './OrderAssistant.css'

const greeting = 'Olá! Vou ajudar a montar seu pedido. Conte o que está acontecendo e onde fica o imóvel (bairro e cidade).'

const scopeFields: { key: keyof AssistantScope; label: string }[] = [
  { key: 'titulo', label: 'Título' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'descricao', label: 'Problema' },
  { key: 'detalhes', label: 'Detalhes do ambiente' },
  { key: 'localizacao', label: 'Localização' },
  { key: 'urgencia', label: 'Urgência' },
  { key: 'especificacoes', label: 'Serviço esperado' },
]

export function OrderAssistant({ onAsk, onReview, onManual, onCancel }: {
  onAsk: (messages: AssistantMessage[]) => Promise<AssistantReply>
  onReview: (order: NewOrder) => void
  onManual: () => void
  onCancel: () => void
}) {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [scope, setScope] = useState<AssistantScope>({})
  const [complete, setComplete] = useState(false)
  const [answer, setAnswer] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [error, setError] = useState('')
  const conversation = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => { heading.current?.focus() }, [])
  useEffect(() => {
    conversation.current?.scrollTo({ top: conversation.current.scrollHeight })
  }, [messages, waiting])

  const filled = scopeFields.filter((field) => scope[field.key]).length

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = answer.trim()
    if (!text || waiting) return
    if (messages.length >= 29) {
      setError('A conversa ficou longa. Revise o pedido ou preencha manualmente os campos que faltam.')
      return
    }
    // A API não guarda histórico: a conversa inteira vai a cada mensagem.
    const next: AssistantMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setAnswer('')
    setError('')
    setWaiting(true)
    try {
      const reply = await onAsk(next)
      setMessages([...next, { role: 'assistant', content: reply.reply }])
      setScope(reply.scope)
      setComplete(reply.complete)
    } catch (err) {
      // Mantém a mensagem do cliente no campo para ele tentar de novo.
      setMessages(messages)
      setAnswer(text)
      setError(err instanceof Error ? err.message : 'O assistente não respondeu. Tente novamente.')
    } finally {
      setWaiting(false)
    }
  }

  return (
    <section className="order-assistant" aria-labelledby="assistant-title">
      <button className="text-button assistant-back" onClick={onCancel}>
        <Icon name="arrow" size={16} /> Voltar à visão geral
      </button>
      <div className="assistant-page-heading">
        <div>
          <p className="eyebrow">NOVO PEDIDO</p>
          <h1 id="assistant-title" ref={heading} tabIndex={-1}>Vamos resolver, juntos.</h1>
          <p>Conte o que você precisa. O assistente ajuda a organizar o escopo.</p>
        </div>
        <span className="assistant-demo"><Icon name="sparkles" size={15} /> Assistente com IA</span>
      </div>
      <ol className="assistant-steps" aria-label="Etapas de criação">
        <li className="current" aria-current="step"><span>1</span> Conte seu problema</li>
        <li><span>2</span> Revise o escopo</li>
        <li><span>3</span> Publique o pedido</li>
      </ol>
      <div className="assistant-layout">
        <section className="assistant-chat panel" aria-label="Conversa com o assistente de escopo">
          <header className="assistant-chat-header">
            <span className="assistant-avatar"><Icon name="sparkles" size={23} /></span>
            <div>
              <h2>Assistente ResolvAI</h2>
              <p>Vamos transformar sua necessidade em um pedido.</p>
            </div>
          </header>
          <div className="assistant-progress">
            <div><span>Progresso do escopo</span><strong>{Math.round((filled / scopeFields.length) * 100)}%</strong></div>
            <progress max={scopeFields.length} value={filled} aria-label="Progresso do escopo" />
          </div>
          <div className="assistant-conversation" ref={conversation} tabIndex={0} role="log"
            aria-label="Conversa de criação do pedido" aria-relevant="additions">
            <div className="assistant-message assistant">
              <span className="message-author">ResolvAI</span><p>{greeting}</p>
            </div>
            {messages.map((message, index) => (
              <div className={`assistant-message ${message.role}`} key={index}>
                <span className="message-author">{message.role === 'assistant' ? 'ResolvAI' : 'Você'}</span>
                <p>{message.content}</p>
              </div>
            ))}
            {waiting && (
              <div className="assistant-message assistant" role="status">
                <span className="message-author">ResolvAI</span><p>Pensando…</p>
              </div>
            )}
          </div>
          <div className="assistant-composer">
            <form onSubmit={send}>
              <label htmlFor="assistant-answer">Sua mensagem</label>
              <div className="assistant-input-row">
                <textarea id="assistant-answer" rows={2} maxLength={2000} value={answer} disabled={waiting}
                  placeholder="Ex.: A laje do quarto está gotejando quando chove…"
                  aria-invalid={!!error} aria-describedby={error ? 'assistant-error' : undefined}
                  onChange={(event) => { setAnswer(event.target.value); setError('') }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      event.currentTarget.form?.requestSubmit()
                    }
                  }} />
                <button className="button button-primary" type="submit" aria-label="Enviar mensagem" disabled={waiting || !answer.trim()}>
                  <Icon name="arrow" size={20} />
                </button>
              </div>
            </form>
            {error && <p className="assistant-error" id="assistant-error" role="alert">{error}</p>}
            <button className="text-button" type="button" onClick={onManual}>Prefiro preencher o formulário</button>
            <p className="assistant-disclosure">
              As respostas são geradas por IA e podem conter erros. Você revisa todos os campos antes de publicar.
            </p>
          </div>
        </section>
        <aside className="scope-panel panel" aria-label="Escopo em construção">
          <div className="scope-panel-title">
            <span className="icon-tile blue"><Icon name="file" /></span>
            <div><h2>Escopo em construção</h2><p>Seu pedido ganha forma a cada resposta.</p></div>
          </div>
          <dl>
            {scopeFields.map((field) => (
              <div className={scope[field.key] ? 'scope-field filled' : 'scope-field'} key={field.key}>
                <dt>{field.label}{scope[field.key] && <Icon name="check" size={13} />}</dt>
                <dd>{scope[field.key] || 'Aguardando sua resposta'}</dd>
              </div>
            ))}
          </dl>
          <p className="scope-tip">
            <Icon name="help" size={17} /> Mais detalhes ajudam os profissionais a preparar propostas mais precisas.
          </p>
          <button className="button button-primary" disabled={!complete || waiting} onClick={() => onReview(scopeToOrder(scope))}>
            Revisar escopo <Icon name="arrow" size={16} />
          </button>
        </aside>
      </div>
    </section>
  )
}
