import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import type { OrderScope } from '../data/dashboard'
import './OrderAssistant.css'

const categories = [
  'Impermeabilização',
  'Hidráulica',
  'Elétrica',
  'Pintura',
  'Alvenaria',
  'Reforma',
  'Outros serviços',
]
const urgencyOptions = ['Urgente', 'Nos próximos dias', 'Pode esperar']
const detailPrompts: Record<string, string> = {
  Impermeabilização:
    'Qual é a área aproximada afetada? Existe algum revestimento, como cerâmica ou manta? Se não souber, tudo bem.',
  Hidráulica:
    'Em qual ambiente acontece? Conte quais peças ou pontos de água estão envolvidos e há quanto tempo percebe o problema.',
  Elétrica:
    'Em qual ambiente acontece e quais pontos ou equipamentos estão envolvidos? Descreva apenas o que você já observou.',
  Pintura:
    'Qual ambiente será pintado e qual a área aproximada? Como estão as paredes e qual acabamento você deseja?',
  Alvenaria:
    'Qual estrutura precisa do serviço? Informe as medidas aproximadas e as condições atuais, se souber.',
  Reforma:
    'Quais ambientes você quer reformar? Conte as medidas aproximadas e o que deseja mudar.',
  'Outros serviços':
    'Conte um pouco sobre o ambiente, as medidas aproximadas e o resultado que você espera.',
}
const tasks: Record<string, string> = {
  Impermeabilização:
    'Avaliar a origem da infiltração e as condições da área; definir a solução e os materiais com o profissional; executar o tratamento aprovado; verificar o resultado e realizar a limpeza final.',
  Hidráulica:
    'Avaliar os pontos hidráulicos informados; identificar os reparos e materiais necessários; executar os serviços aprovados; verificar o funcionamento e a ausência de vazamentos.',
  Elétrica:
    'Solicitar avaliação dos pontos informados por profissional qualificado; definir os serviços e materiais necessários; executar as correções aprovadas e verificar o funcionamento.',
  Pintura:
    'Avaliar e medir as superfícies; combinar preparação, cores e materiais; proteger o ambiente; executar a pintura e conferir o acabamento com o contratante.',
  Alvenaria:
    'Avaliar a estrutura e confirmar as medidas no local; definir os serviços e materiais; executar o trabalho aprovado e conferir o acabamento.',
  Reforma:
    'Avaliar os ambientes e confirmar medidas; detalhar etapas, materiais e prazos com o profissional; executar o escopo aprovado e realizar a conferência de entrega.',
  'Outros serviços':
    'Avaliar a necessidade no local; combinar escopo, materiais e prazo com o profissional; executar o serviço aprovado e conferir a entrega.',
}

export type NewOrder = {
  title: string
  category: string
  description: string
  location: string
  scope: OrderScope
}
type Draft = {
  category: string
  description: string
  details: string
  location: string
  urgency: string
  photos: File[]
}
type Message = { role: 'assistant' | 'user'; text: string }
const greeting =
  'Olá! Vamos organizar seu pedido juntos. Qual tipo de serviço você precisa? Escolha uma categoria para começar.'

export function PhotoPreview({
  photos,
  onRemove,
}: {
  photos: File[]
  onRemove?: (index: number) => void
}) {
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    const next = photos.map((photo) => URL.createObjectURL(photo))
    setUrls(next)
    return () => next.forEach((url) => URL.revokeObjectURL(url))
  }, [photos])
  return (
    <div className="scope-photos">
      {photos.map((photo, index) => (
        <figure key={`${photo.name}-${index}`}>
          <img src={urls[index]} alt={`Foto anexada: ${photo.name}`} />
          <figcaption>{photo.name}</figcaption>
          {onRemove && (
            <button
              type="button"
              aria-label={`Remover foto ${photo.name}`}
              onClick={() => onRemove(index)}
            >
              <Icon name="close" size={15} />
            </button>
          )}
        </figure>
      ))}
    </div>
  )
}

export function OrderAssistant({
  location,
  onCancel,
  onCreate,
}: {
  location: string
  onCancel: () => void
  onCreate: (order: NewOrder) => void
}) {
  const [draft, setDraft] = useState<Draft>({
    category: '',
    description: '',
    details: '',
    location: '',
    urgency: '',
    photos: [],
  })
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: greeting },
  ])
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [review, setReview] = useState<NewOrder | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const conversation = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (conversation.current)
      conversation.current.scrollTop = conversation.current.scrollHeight
  }, [messages, step, reviewing])
  useEffect(() => {
    heading.current?.focus()
  }, [reviewing])
  useEffect(() => {
    if (step > 0 && step < 4) input.current?.focus()
  }, [step])

  function respond(raw: string) {
    const value = raw.trim()
    if (
      !value ||
      (step === 1 && value.length < 10) ||
      (step === 3 && value.length < 3)
    ) {
      setError(
        step === 1
          ? 'Descreva o problema com pelo menos 10 caracteres.'
          : 'Preencha sua resposta antes de continuar.',
      )
      return
    }
    const fields = [
      'category',
      'description',
      'details',
      'location',
      'urgency',
    ] as const
    const field = fields[step]
    if (!field) return
    setDraft((current) => ({ ...current, [field]: value }))
    const nextQuestion = [
      'Entendido! O que você precisa resolver? Descreva o problema e o resultado que espera.',
      detailPrompts[draft.category],
      'Em qual bairro e cidade o serviço será realizado? Você pode usar o local do seu perfil ou informar outro.',
      'Qual é o nível de urgência do serviço?',
      'Quer incluir fotos do local? Elas ajudam o profissional a entender seu pedido. Você também pode continuar sem fotos.',
    ][step]
    setMessages((current) => [
      ...current,
      { role: 'user', text: value },
      { role: 'assistant', text: nextQuestion },
    ])
    setAnswer(step === 2 ? location : '')
    setStep((current) => current + 1)
    setError('')
  }
  function finishPhotos() {
    setMessages((current) => [
      ...current,
      {
        role: 'user',
        text: draft.photos.length
          ? `${draft.photos.length} foto(s) anexada(s).`
          : 'Continuar sem fotos.',
      },
      {
        role: 'assistant',
        text: 'Seu pedido está organizado! Confira a sugestão de escopo e edite o que precisar antes de publicar nesta demonstração.',
      },
    ])
    setStep(6)
    setError('')
  }
  function openReview() {
    setReview(
      (current) =>
        current ?? {
          title: `${draft.category}: ${draft.description}`.slice(0, 90),
          category: draft.category,
          description: draft.description,
          location: draft.location,
          scope: {
            details: draft.details,
            urgency: draft.urgency,
            specifications: tasks[draft.category],
            photos: draft.photos,
          },
        },
    )
    setError('')
    setReviewing(true)
  }
  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!review) return
    const clean = {
      ...review,
      title: review.title.trim(),
      description: review.description.trim(),
      location: review.location.trim(),
      scope: {
        ...review.scope,
        details: review.scope.details.trim(),
        specifications: review.scope.specifications.trim(),
      },
    }
    if (
      clean.title.length < 3 ||
      clean.description.length < 10 ||
      clean.location.length < 3 ||
      !clean.scope.details ||
      clean.scope.specifications.length < 10
    ) {
      setError(
        'Revise os campos: título e local precisam de pelo menos 3 caracteres; descrição e escopo, de 10. Informe também os detalhes do ambiente.',
      )
      return
    }
    onCreate(clean)
  }

  return (
    <section className="order-assistant" aria-labelledby="assistant-title">
      <button className="text-button assistant-back" onClick={onCancel}>
        <Icon name="arrow" size={16} /> Voltar à visão geral
      </button>
      <div className="assistant-page-heading">
        <div>
          <p className="eyebrow">NOVO PEDIDO</p>
          <h1 id="assistant-title" ref={heading} tabIndex={-1}>
            {reviewing
              ? 'Revise o escopo do seu pedido'
              : 'Vamos resolver, juntos.'}
          </h1>
          <p>
            {reviewing
              ? 'Confira os detalhes e ajuste a sugestão antes de publicar.'
              : 'Conte o que você precisa. O assistente ajuda a organizar o escopo.'}
          </p>
        </div>
        <span className="assistant-demo">
          <Icon name="sparkles" size={15} /> IA simulada
        </span>
      </div>
      <ol className="assistant-steps" aria-label="Etapas de criação">
        <li
          className={!reviewing ? 'current' : 'complete'}
          aria-current={!reviewing ? 'step' : undefined}
        >
          <span>1</span> Conte seu problema
        </li>
        <li
          className={reviewing ? 'current' : ''}
          aria-current={reviewing ? 'step' : undefined}
        >
          <span>2</span> Revise o escopo
        </li>
        <li>
          <span>3</span> Publique o pedido
        </li>
      </ol>
      {!reviewing ? (
        <div className="assistant-layout">
          <section
            className="assistant-chat panel"
            aria-label="Conversa com o assistente de escopo"
          >
            <header className="assistant-chat-header">
              <span className="assistant-avatar">
                <Icon name="sparkles" size={23} />
              </span>
              <div>
                <h2>Assistente ResolvAI</h2>
                <p>Vamos transformar sua necessidade em um pedido.</p>
              </div>
              <span className="assistant-simulation">Demonstração</span>
            </header>
            <div className="assistant-progress">
              <div>
                <span>Progresso do escopo</span>
                <strong>{Math.round((step / 6) * 100)}%</strong>
              </div>
              <progress max={6} value={step} aria-label="Progresso do escopo" />
            </div>
            <div
              className="assistant-conversation"
              ref={conversation}
              tabIndex={0}
              role="log"
              aria-label="Conversa de criação do pedido"
              aria-relevant="additions"
            >
              {messages.map((message, index) => (
                <div
                  className={`assistant-message ${message.role}`}
                  key={index}
                >
                  <span className="message-author">
                    {message.role === 'assistant' ? 'ResolvAI' : 'Você'}
                  </span>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
            <div className="assistant-composer">
              {step === 0 && (
                <div
                  className="assistant-chips"
                  aria-label="Escolha uma categoria"
                >
                  {categories.map((category) => (
                    <button key={category} onClick={() => respond(category)}>
                      {category}
                    </button>
                  ))}
                </div>
              )}
              {step > 0 && step < 4 && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    respond(answer)
                  }}
                >
                  <label htmlFor="assistant-answer">
                    {step === 1
                      ? 'Descreva seu problema'
                      : step === 2
                        ? 'Detalhes do ambiente'
                        : 'Local do serviço'}
                  </label>
                  <div className="assistant-input-row">
                    <textarea
                      id="assistant-answer"
                      ref={input}
                      rows={2}
                      maxLength={step === 3 ? 120 : 1200}
                      value={answer}
                      onChange={(event) => {
                        setAnswer(event.target.value)
                        setError('')
                      }}
                      placeholder={
                        step === 1
                          ? 'Ex.: A laje do quarto está gotejando quando chove…'
                          : step === 2
                            ? 'Área, condições atuais e outros detalhes…'
                            : 'Bairro e cidade'
                      }
                      aria-invalid={!!error}
                      aria-describedby={error ? 'assistant-error' : undefined}
                    />
                    <button
                      className="button button-primary"
                      type="submit"
                      aria-label="Enviar resposta"
                    >
                      <Icon name="arrow" size={20} />
                    </button>
                  </div>
                  {step === 2 && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        respond('A confirmar na visita do profissional.')
                      }
                    >
                      Não sei informar esses detalhes
                    </button>
                  )}
                </form>
              )}
              {step === 4 && (
                <div
                  className="assistant-chips"
                  aria-label="Urgência do serviço"
                >
                  {urgencyOptions.map((urgency) => (
                    <button key={urgency} onClick={() => respond(urgency)}>
                      <Icon name="clock" size={15} />
                      {urgency}
                    </button>
                  ))}
                </div>
              )}
              {step === 5 && (
                <div className="assistant-upload">
                  <label htmlFor="scope-photos">
                    Fotos do local{' '}
                    <span>
                      Opcional · até 4 fotos de 5 MB · JPG, PNG ou WebP
                    </span>
                  </label>
                  <input
                    id="scope-photos"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? [])
                      event.target.value = ''
                      if (!files.length) return
                      if (
                        files.length + draft.photos.length > 4 ||
                        files.some(
                          (file) =>
                            file.size > 5 * 1024 * 1024 ||
                            !['image/jpeg', 'image/png', 'image/webp'].includes(
                              file.type,
                            ),
                        )
                      ) {
                        setError(
                          'Selecione até 4 fotos JPG, PNG ou WebP, com no máximo 5 MB cada.',
                        )
                        return
                      }
                      setDraft((current) => ({
                        ...current,
                        photos: [...current.photos, ...files],
                      }))
                      setError('')
                    }}
                  />
                  <PhotoPreview
                    photos={draft.photos}
                    onRemove={(index) =>
                      setDraft((current) => ({
                        ...current,
                        photos: current.photos.filter((_, i) => i !== index),
                      }))
                    }
                  />
                  <button
                    className="button button-secondary"
                    onClick={finishPhotos}
                  >
                    {draft.photos.length
                      ? 'Continuar com as fotos'
                      : 'Continuar sem fotos'}
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              )}
              {step === 6 && (
                <button className="button button-primary" onClick={openReview}>
                  Revisar escopo sugerido <Icon name="arrow" size={17} />
                </button>
              )}
              {error && (
                <p
                  className="assistant-error"
                  id="assistant-error"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <p className="assistant-disclosure">
                Conversa demonstrativa, com perguntas e sugestões predefinidas.
                Nenhuma IA está conectada.
              </p>
            </div>
          </section>
          <aside
            className="scope-panel panel"
            aria-label="Escopo em construção"
          >
            <div className="scope-panel-title">
              <span className="icon-tile blue">
                <Icon name="file" />
              </span>
              <div>
                <h2>Escopo em construção</h2>
                <p>Seu pedido ganha forma a cada resposta.</p>
              </div>
            </div>
            <dl>
              {[
                ['Categoria', draft.category],
                ['Problema', draft.description],
                ['Detalhes do ambiente', draft.details],
                ['Localização', draft.location],
                ['Urgência', draft.urgency],
                [
                  'Fotos',
                  step >= 6
                    ? draft.photos.length
                      ? `${draft.photos.length} foto(s) anexada(s)`
                      : 'Sem fotos'
                    : '',
                ],
              ].map(([label, value]) => (
                <div
                  className={value ? 'scope-field filled' : 'scope-field'}
                  key={label}
                >
                  <dt>
                    {label}
                    {value && <Icon name="check" size={13} />}
                  </dt>
                  <dd>{value || 'Aguardando sua resposta'}</dd>
                </div>
              ))}
            </dl>
            <p className="scope-tip">
              <Icon name="help" size={17} /> Mais detalhes ajudam os
              profissionais a preparar propostas mais precisas.
            </p>
            <button
              className="button button-primary"
              disabled={step < 6}
              onClick={openReview}
            >
              Revisar escopo <Icon name="arrow" size={16} />
            </button>
          </aside>
        </div>
      ) : (
        review && (
          <form className="assistant-layout scope-review" onSubmit={publish}>
            <section className="panel scope-review-fields">
              <h2>Detalhes do pedido</h2>
              <p className="modal-description">
                Esta é uma sugestão ilustrativa. Todos os campos podem ser
                editados.
              </p>
              <div className="form-stack">
                <label>
                  Título do pedido
                  <input
                    required
                    maxLength={90}
                    value={review.title}
                    onChange={(event) =>
                      setReview({ ...review, title: event.target.value })
                    }
                  />
                </label>
                <label>
                  Descrição do problema
                  <textarea
                    required
                    minLength={10}
                    maxLength={1200}
                    rows={3}
                    value={review.description}
                    onChange={(event) =>
                      setReview({ ...review, description: event.target.value })
                    }
                  />
                </label>
                <div className="scope-form-pair">
                  <label>
                    Categoria
                    <select
                      aria-label="Categoria"
                      value={review.category}
                      onChange={(event) =>
                        setReview({
                          ...review,
                          category: event.target.value,
                          scope: {
                            ...review.scope,
                            specifications:
                              review.scope.specifications ===
                              tasks[review.category]
                                ? tasks[event.target.value]
                                : review.scope.specifications,
                          },
                        })
                      }
                    >
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Urgência
                    <select
                      aria-label="Urgência"
                      value={review.scope.urgency}
                      onChange={(event) =>
                        setReview({
                          ...review,
                          scope: {
                            ...review.scope,
                            urgency: event.target.value,
                          },
                        })
                      }
                    >
                      {urgencyOptions.map((urgency) => (
                        <option key={urgency}>{urgency}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Local do serviço
                  <input
                    required
                    maxLength={120}
                    value={review.location}
                    onChange={(event) =>
                      setReview({ ...review, location: event.target.value })
                    }
                  />
                </label>
                <label>
                  Detalhes do ambiente
                  <textarea
                    required
                    maxLength={1200}
                    rows={2}
                    value={review.scope.details}
                    onChange={(event) =>
                      setReview({
                        ...review,
                        scope: { ...review.scope, details: event.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Escopo sugerido
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={4}
                    value={review.scope.specifications}
                    onChange={(event) =>
                      setReview({
                        ...review,
                        scope: {
                          ...review.scope,
                          specifications: event.target.value,
                        },
                      })
                    }
                  />
                  <span className="scope-field-hint">
                    Materiais, medidas e solução técnica serão confirmados com o
                    profissional.
                  </span>
                </label>
              </div>
              {error && (
                <p className="assistant-error" role="alert">
                  {error}
                </p>
              )}
              <div className="scope-review-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setReviewing(false)}
                >
                  Voltar à conversa
                </button>
                <button type="submit" className="button button-primary">
                  Publicar pedido <Icon name="arrow" size={17} />
                </button>
              </div>
            </section>
            <aside className="scope-panel panel">
              <div className="scope-panel-title">
                <span className="icon-tile blue">
                  <Icon name="bag" />
                </span>
                <div>
                  <h2>Prévia do pedido</h2>
                  <p>Confira como o serviço será apresentado.</p>
                </div>
              </div>
              <span className="status-badge waiting">{review.category}</span>
              <h3 className="scope-preview-title">{review.title}</h3>
              <p className="scope-preview-description">{review.description}</p>
              <dl>
                <div className="scope-field">
                  <dt>Localização</dt>
                  <dd>{review.location}</dd>
                </div>
                <div className="scope-field">
                  <dt>Urgência</dt>
                  <dd>{review.scope.urgency}</dd>
                </div>
              </dl>
              <h3 className="scope-photos-title">
                Fotos anexadas ({review.scope.photos.length})
              </h3>
              {review.scope.photos.length ? (
                <PhotoPreview
                  photos={review.scope.photos}
                  onRemove={(index) =>
                    setReview({
                      ...review,
                      scope: {
                        ...review.scope,
                        photos: review.scope.photos.filter(
                          (_, i) => i !== index,
                        ),
                      },
                    })
                  }
                />
              ) : (
                <p className="modal-description">Nenhuma foto anexada.</p>
              )}
              <div className="info-box">
                <Icon name="sparkles" size={18} />
                <p>
                  Ao publicar, o pedido aparece no seu painel nesta sessão de
                  demonstração. Ele não será enviado a profissionais.
                </p>
              </div>
            </aside>
          </form>
        )
      )}
    </section>
  )
}
