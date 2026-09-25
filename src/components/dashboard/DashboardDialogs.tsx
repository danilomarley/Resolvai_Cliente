import { useState } from 'react'
import { Icon } from '../Icon'
import { Modal } from '../Modal'
import { PhotoPreview } from '../OrderAssistant'
import {
  completed,
  currency,
  initialOrders,
  proposals,
  type Order,
} from '../../data/dashboard'
import type { Dialog, Profile } from '../../types/dashboard'

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
  selectedOrder: Order
  profile: Profile
  onClose: () => void
  onOpenOrder: (order: Order, target?: Dialog) => void
  onSaveProfile: (profile: Profile) => void
  onNotice: (notice: string) => void
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
  const [messages, setMessages] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  if (!dialog || dialog === 'create') return null
  return (
    <Modal
      title={titles[dialog]}
      onClose={onClose}
    >
      {dialog === 'proposals' && (
        <div className="dialog-stack">
          <p className="modal-description">
            {selectedOrder.title} · propostas ilustrativas
          </p>
          {proposals.map((proposal) => (
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
                <strong>{currency(proposal.price)}</strong>
              </div>
              <p>{proposal.description}</p>
              <button
                className="button button-secondary button-sm"
                disabled={interestedProvider === proposal.name}
                onClick={() => {
                  setInterestedProvider(proposal.name)
                  onClose()
                  onNotice(
                    `Interesse registrado em ${proposal.name} nesta sessão. A contratação não está disponível na demonstração.`,
                  )
                }}
              >
                {interestedProvider === proposal.name
                  ? 'Interesse registrado'
                  : 'Tenho interesse'}{' '}
                <Icon name="arrow" size={15} />
              </button>
            </article>
          ))}
        </div>
      )}
      {dialog === 'order' && (
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
              <small>
                As informações do seu serviço estão organizadas.
              </small>
            </li>
            <li
              className={selectedOrder.status === 'progress' ? 'done' : ''}
            >
              Recebimento de propostas
              <small>{selectedOrder.proposals} propostas recebidas.</small>
            </li>
            <li
              className={selectedOrder.status === 'progress' ? 'done' : ''}
            >
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
            Você recebeu 3 novas propostas para a infiltração na laje.
          </p>
          {proposals.map((proposal) => (
            <button
              className="notification-item"
              key={proposal.name}
              onClick={() => {
                onOpenOrder(initialOrders[0], 'proposals')
              }}
            >
              <span className="icon-tile blue">
                <Icon name="file" />
              </span>
              <span>
                <strong>{proposal.name}</strong>
                <small>
                  Enviou uma proposta de {currency(proposal.price)}
                </small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
      )}
      {(dialog === 'history' ||
        dialog === 'reviews' ||
        dialog === 'payments') && (
        <div className="dialog-stack">
          <p className="modal-description">
            {dialog === 'payments'
              ? 'Resumo dos pagamentos dos serviços concluídos. Dados de demonstração.'
              : dialog === 'reviews'
                ? 'Sua média como contratante é 4,8 de 5, com base nestes serviços.'
                : 'Serviços concluídos e avaliados. Dados de demonstração.'}
          </p>
          {completed.map((service) => (
            <article className="history-row" key={service.id}>
              <span className="icon-tile green">
                <Icon
                  name={dialog === 'payments' ? 'wallet' : service.icon}
                />
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
                  currency(service.price)
                )}
              </strong>
            </article>
          ))}
          {dialog === 'payments' && (
            <div className="payment-total">
              <span>Total pago</span>
              <strong>
                {currency(
                  completed.reduce(
                    (total, service) => total + service.price,
                    0,
                  ),
                )}
              </strong>
            </div>
          )}
        </div>
      )}
      {dialog === 'contracts' && (
        <div className="dialog-stack">
          <p className="modal-description">
            Resumo ilustrativo do serviço em andamento.
          </p>
          <article className="proposal-card">
            <span className="status-badge progress">
              <i />
              Em andamento
            </span>
            <h3>Reparo hidráulico no banheiro</h3>
            <p>
              Escopo: reparo do vazamento na pia e revisão das conexões.
              Previsão: 18 de setembro.
            </p>
            <div className="info-box">
              <Icon name="shield" />
              <p>
                A assinatura e a consulta de contratos reais estarão
                disponíveis quando a plataforma estiver conectada.
              </p>
            </div>
          </article>
        </div>
      )}
      {dialog === 'messages' && (
        <div className="dialog-stack">
          <div className="info-box">
            <Icon name="chat" />
            <p>
              Conversa demonstrativa sobre o reparo hidráulico. As mensagens
              não são enviadas a um profissional.
            </p>
          </div>
          <div
            className="chat-messages"
            role="log"
            aria-label="Histórico da conversa"
          >
            <div className="chat-bubble received">
              Olá, Ygor! A visita técnica foi concluída. O reparo está
              previsto para o dia 18.
            </div>
            {messages.map((message, index) => (
              <div className="chat-bubble sent" key={index}>
                {message}
              </div>
            ))}
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
              aria-label="Enviar mensagem de demonstração"
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
            onSaveProfile({ name, location })
            onClose()
            onNotice('Perfil atualizado nesta sessão de demonstração.')
          }}
        >
          <p className="modal-description">
            Seus dados de contratante. Alterações válidas apenas nesta
            sessão.
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
              text: 'Clique em “Criar pedido” e responda à conversa guiada sobre o problema, o ambiente, a localização e a urgência. Você pode anexar fotos. Depois, revise e edite o escopo sugerido antes de publicar. A IA é simulada e o pedido fica disponível apenas nesta sessão.',
            },
            {
              title: 'Como comparar as propostas?',
              text: 'Abra “Ver propostas” em um pedido para conferir valor, prazo e descrição de cada profissional.',
            },
            {
              title: 'Como acompanhar um serviço?',
              text: 'Nos pedidos em andamento, clique em “Acompanhar” para ver o escopo e as etapas do serviço.',
            },
            {
              title: 'Posso contratar ou pagar por aqui?',
              text: 'Esta tela é uma demonstração de interface. Contratações, pagamentos, IA e envio de mensagens ainda dependem de integração com os serviços da plataforma.',
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
