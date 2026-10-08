import { useState } from 'react'
import { Icon } from '../Icon'
import { Modal } from '../Modal'
import { PhotoPreview } from '../OrderAssistant'
import type { Dialog, Profile } from '../../types/dashboard'
import type { Order } from './OrdersPanel'

const titles: Record<Exclude<Dialog, null>, string> = {
  create: 'O que você precisa resolver?',
  notifications: 'Suas notificações',
  profile: 'Meu perfil',
  help: 'Como podemos ajudar?',
  contracts: 'Meus contratos',
  payments: 'Pagamentos',
  reviews: 'Minhas avaliações',
  messages: 'Conversa com o prestador',
  history: 'Histórico de serviços',
  proposals: 'Propostas recebidas',
  order: 'Detalhes do pedido',
}

type DashboardDialogsProps = {
  dialog: Dialog
  selectedOrder: Order | null // Atualizado para aceitar null
  profile: Profile
  onClose: () => void
  onOpenOrder: (order: Order, target?: Dialog) => void
  onSaveProfile: (profile: Profile) => void
  onNotice: (notice: string) => void
}

// Função auxiliar para formatar moeda (caso você não tenha criado um utils ainda)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function DashboardDialogs({
  dialog,
  selectedOrder,
  profile,
  onClose,
  onOpenOrder,
  onSaveProfile,
  onNotice,
}: DashboardDialogsProps) {
  const [interestedProvider, setInterestedProvider] = useState<string | null>(null)
  
  // Mensagens começam vazias aguardando o banco
  const [messages, setMessages] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  // Listas vazias temporárias até integrarmos com o Supabase
  const proposals: any[] = [] 
  const completed: any[] = []

  if (!dialog || dialog === 'create') return null

  // Fallback seguro caso o selectedOrder seja null
  const safeOrder = selectedOrder || {} as Order

  return (
    <Modal
      title={titles[dialog]}
      onClose={onClose}
    >
      {dialog === 'proposals' && (
        <div className="dialog-stack">
          <p className="modal-description">
            {safeOrder.title || 'Carregando pedido...'} · propostas
          </p>
          {proposals.length === 0 ? (
             <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-muted)' }}>
               Ainda não há propostas para este pedido.
             </p>
          ) : (
            proposals.map((proposal) => (
              <article className="proposal-card" key={proposal.name}>
                <div className="proposal-top">
                  <span className="avatar">{proposal.initials}</span>
                  <div>
                    <h3>{proposal.name}</h3>
                    <span className="rating">
                      <Icon name="star" size={13} /> {proposal.rating} ·
                      Execução em {proposal.time}
                    </span>
                  </div>
                  <strong>{formatCurrency(proposal.price)}</strong>
                </div>
                <p>{proposal.description}</p>
                <button
                  className="button button-secondary button-sm"
                  disabled={interestedProvider === proposal.name}
                  onClick={() => {
                    setInterestedProvider(proposal.name)
                    onClose()
                    onNotice(`Interesse registrado em ${proposal.name}.`)
                  }}
                >
                  {interestedProvider === proposal.name
                    ? 'Interesse registrado'
                    : 'Tenho interesse'}{' '}
                  <Icon name="arrow" size={15} />
                </button>
              </article>
            ))
          )}
        </div>
      )}

      {dialog === 'order' && selectedOrder && (
        <div className="dialog-stack">
          <span className={`status-badge ${selectedOrder.status}`}>
            <i />
            {selectedOrder.status === 'progress'
              ? 'Em andamento'
              : 'Aguardando propostas'}
          </span>
          <h3>{selectedOrder.title}</h3>
          <p>{selectedOrder.description}</p>
          <p className="detail-location">
            <Icon name="pin" size={17} />
            {selectedOrder.location}
          </p>
          {selectedOrder.scope && (
            <div className="order-scope-details">
              <h3>Escopo do pedido</h3>
              <dl>
                <div>
                  <dt>Urgência</dt>
                  <dd>{selectedOrder.scope.urgency}</dd>
                </div>
                <div>
                  <dt>Detalhes do ambiente</dt>
                  <dd>{selectedOrder.scope.details}</dd>
                </div>
                <div>
                  <dt>Serviço a realizar</dt>
                  <dd>{selectedOrder.scope.specifications}</dd>
                </div>
              </dl>
              {selectedOrder.scope.photos.length > 0 && (
                <PhotoPreview photos={selectedOrder.scope.photos} />
              )}
            </div>
          )}
          <ol className="timeline">
            <li className="done">
              Pedido criado
              <small>As informações do seu serviço estão organizadas.</small>
            </li>
            <li className={selectedOrder.status === 'progress' ? 'done' : ''}>
              Recebimento de propostas
              <small>{selectedOrder.proposals || 0} propostas recebidas.</small>
            </li>
            <li className={selectedOrder.status === 'progress' ? 'done' : ''}>
              Serviço em andamento
              <small>
                {selectedOrder.status === 'progress'
                  ? `Previsão de conclusão: ${selectedOrder.deadline}`
                  : 'Aguardando contratação de um profissional.'}
              </small>
            </li>
            <li>
              Conclusão e avaliação
              <small>Confirme a entrega quando o serviço terminar.</small>
            </li>
          </ol>
        </div>
      )}

      {dialog === 'notifications' && (
        <div className="dialog-stack">
          <p className="modal-description">
            Suas notificações recentes.
          </p>
          {/* Mock removido. Aqui entrarão as notificações reais da API */}
          <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-muted)' }}>
             Você não tem novas notificações.
          </p>
        </div>
      )}

      {(dialog === 'history' || dialog === 'reviews' || dialog === 'payments') && (
        <div className="dialog-stack">
          <p className="modal-description">
            {dialog === 'payments'
              ? 'Resumo dos pagamentos dos serviços concluídos.'
              : dialog === 'reviews'
                ? `Sua média como contratante é ${profile.rating || 0} de 5.`
                : 'Serviços concluídos e avaliados.'}
          </p>
          
          {completed.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-muted)' }}>
              Nenhum registro encontrado.
            </p>
          ) : (
            completed.map((service) => (
              <article className="history-row" key={service.id}>
                <span className="icon-tile green">
                  <Icon name={dialog === 'payments' ? 'wallet' : service.icon} />
                </span>
                <div>
                  <h3>{service.title}</h3>
                  <p>
                    {service.provider} · {service.date}
                  </p>
                </div>
                <strong>
                  {dialog === 'reviews' ? (
                    <span className="rating">
                      <Icon name="star" size={15} />
                      {service.rating}
                    </span>
                  ) : (
                    formatCurrency(service.price)
                  )}
                </strong>
              </article>
            ))
          )}

          {dialog === 'payments' && completed.length > 0 && (
            <div className="payment-total">
              <span>Total pago</span>
              <strong>
                {formatCurrency(
                  completed.reduce((total, service) => total + service.price, 0)
                )}
              </strong>
            </div>
          )}
        </div>
      )}

      {dialog === 'contracts' && (
        <div className="dialog-stack">
          <p className="modal-description">
            Seus contratos ativos.
          </p>
          <div className="info-box">
             <Icon name="shield" />
             <p>
               Nenhum contrato ativo no momento. Eles aparecerão aqui quando você fechar um serviço.
             </p>
          </div>
        </div>
      )}

      {dialog === 'messages' && (
        <div className="dialog-stack">
          <div className="info-box">
            <Icon name="chat" />
            <p>
              Envie mensagens para o prestador de serviços.
            </p>
          </div>
          <div
            className="chat-messages"
            role="log"
            aria-label="Histórico da conversa"
          >
            {messages.length === 0 ? (
               <div style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '1rem' }}>
                  Nenhuma mensagem ainda. Inicie a conversa!
               </div>
            ) : (
               messages.map((message, index) => (
                 <div className="chat-bubble sent" key={index}>
                   {message}
                 </div>
               ))
            )}
          </div>
          <form
            className="chat-form"
            onSubmit={(event) => {
              event.preventDefault()
              if (draft.trim()) {
                setMessages((current) => [...current, draft.trim()])
                setDraft('')
              }
            }}
          >
            <input
              aria-label="Sua mensagem"
              placeholder="Escreva uma mensagem..."
              value={draft}
              maxLength={1000}
              onChange={(event) => setDraft(event.target.value)}
              required
            />
            <button
              className="button button-primary"
              type="submit"
              aria-label="Enviar mensagem"
            >
              <Icon name="arrow" />
            </button>
          </form>
        </div>
      )}

      {dialog === 'profile' && (
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            const name = String(data.get('name')).trim()
            const location = String(data.get('location')).trim()
            if (!name || !location) return
            // Mantém o rating existente ao salvar
            onSaveProfile({ name, location, rating: profile.rating })
            onClose()
            onNotice('Perfil atualizado localmente.')
          }}
        >
          <p className="modal-description">
            Seus dados de contratante.
          </p>
          <label>
            Nome
            <input
              name="name"
              defaultValue={profile.name}
              required
              maxLength={70}
            />
          </label>
          <label>
            Bairro e cidade
            <input
              name="location"
              defaultValue={profile.location}
              required
              maxLength={120}
            />
          </label>
          <button className="button button-primary" type="submit">
            Salvar alterações <Icon name="check" size={17} />
          </button>
        </form>
      )}

      {dialog === 'help' && (
        <div className="dialog-stack">
          <p className="modal-description">
            Da ideia ao serviço concluído, acompanhe tudo no seu espaço.
          </p>
          {[
            {
              title: 'Como criar um pedido?',
              text: 'Clique em “Criar pedido” e preencha as informações necessárias sobre o serviço.',
            },
            {
              title: 'Como comparar as propostas?',
              text: 'Abra “Ver propostas” em um pedido para conferir valor, prazo e descrição de cada profissional.',
            },
            {
              title: 'Como acompanhar um serviço?',
              text: 'Nos pedidos em andamento, clique em “Acompanhar” para ver o escopo e as etapas do serviço.',
            },
          ].map((item) => (
            <details className="faq" key={item.title}>
              <summary>{item.title}</summary>
              <p>{item.text}</p>
            </details>
          ))}
        </div>
      )}
    </Modal>
  )
}