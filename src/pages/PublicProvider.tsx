import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getPublicProvider, type PublicProvider as Provider } from '../services/providers'
import { orderDate } from '../services/orders'
import { ApiError } from '../services/api'
import './PublicProvider.css'

export function PublicProviderContent({ provider }: { provider: Provider }) {
  return <>
    <div className="provider-heading">
      {provider.photoUrl ? <img className="provider-photo" src={provider.photoUrl} alt={`Foto de ${provider.name}`} referrerPolicy="no-referrer" /> : <span className="provider-photo provider-no-photo">Foto não informada</span>}
      <div><h1 tabIndex={-1}>{provider.name}</h1><p>{provider.region ?? 'Região não informada'}</p></div>
    </div>
    <h2>Categorias atendidas</h2>
    {provider.categories?.length ? <ul>{provider.categories.map((category) => <li key={category}>{category}</li>)}</ul> : <p>Categorias não informadas</p>}
    <dl>
      <div><dt>Serviços concluídos</dt><dd>{provider.completedServices}</dd></div>
      <div><dt>Avaliação média</dt><dd>{!provider.reviewsAvailable ? 'Avaliações indisponíveis' : provider.averageRating === null ? 'Sem avaliações' : `${provider.averageRating.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} de 5`}</dd></div>
      {provider.reviewsCount !== null && <div><dt>Avaliações recebidas</dt><dd>{provider.reviewsCount}</dd></div>}
    </dl>
    <h2>Últimas avaliações</h2>
    {!provider.reviewsAvailable ? <p>As avaliações ainda não estão disponíveis na API.</p> : !provider.reviews.length ? <p>Este prestador ainda não recebeu avaliações.</p>
      : <ul className="provider-reviews">{provider.reviews.map((review, index) => <li key={`${review.createdAt}:${index}`}>
        <p aria-label={`Nota: ${review.rating} de 5 estrelas`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
        <p>{review.comment || 'Sem comentário'}</p><time dateTime={review.createdAt}>{orderDate(review.createdAt)}</time>
      </li>)}</ul>}
  </>
}

export function PublicProvider({ providerId, token }: { providerId: string; token: string }) {
  const location = useLocation()
  const from: unknown = location.state?.from
  const back = typeof from === 'string' && /^\/pedidos\/[0-9a-f-]{36}\/propostas$/i.test(from) ? from : '/pedidos'
  const [state, setState] = useState<{ data?: Provider; error?: ApiError }>({})
  const [attempt, setAttempt] = useState(0)
  const section = useRef<HTMLElement>(null)
  useEffect(() => { section.current?.querySelector<HTMLElement>('h1')?.focus() }, [state.data, state.error])
  useEffect(() => {
    const controller = new AbortController()
    setState({})
    getPublicProvider(providerId, token, controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ data })
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ error: error instanceof ApiError ? error : new ApiError(0, 'Não foi possível carregar o prestador.') })
    })
    return () => controller.abort()
  }, [providerId, token, attempt])
  return <section ref={section} className="panel order-summary public-provider" aria-label="Perfil público do prestador">
    <Link className="button button-secondary" to={back}>{back === '/pedidos' ? 'Voltar para meus pedidos' : 'Voltar às propostas'}</Link>
    {state.error ? <div role="alert"><h1>Perfil indisponível</h1><p>{state.error.status === 404 ? 'Prestador não encontrado ou indisponível para sua conta.' : state.error.message}</p>
      <button className="button button-secondary" onClick={() => setAttempt(n => n + 1)}>Tentar novamente</button>
      {state.error.status === 401 && <Link to="/login" state={{ from: `/prestadores/${providerId}` }}>Entrar novamente</Link>}</div>
      : state.data ? <PublicProviderContent provider={state.data} /> : <p role="status">Carregando perfil do prestador…</p>}
  </section>
}
