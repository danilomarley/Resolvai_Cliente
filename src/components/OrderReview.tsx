import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../services/api'
import { getReview, submitReview, validRating, type Review } from '../services/reviews'
import type { Order } from '../types/orders'
import './OrderReview.css'

export function ReviewForm({ sending, error, onSubmit }: {
  sending: boolean; error: string; onSubmit: (rating: number, comment: string) => void
}) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  return <form onSubmit={(event) => { event.preventDefault(); if (!sending && validRating(rating)) onSubmit(rating, comment) }}>
    <fieldset disabled={sending} className="review-fields">
      <legend>Como foi o serviço?</legend>
      <p>Escolha de 1 a 5 estrelas. Sua avaliação será pública.</p>
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((value) => <label key={value}>
          <input type="radio" name="rating" required value={value} checked={rating === value} onChange={() => setRating(value)} aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`} />
          <span aria-hidden="true" className={value <= rating ? 'selected' : ''}>★</span>
        </label>)}
      </div>
      <label htmlFor="review-comment">Comentário (opcional)</label>
      <textarea id="review-comment" rows={5} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} aria-describedby="review-privacy" />
      <p id="review-privacy">Até 2000 caracteres. Evite telefone, endereço e outros dados pessoais.</p>
      {error && <p role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={sending || !validRating(rating)}>{sending ? 'Enviando avaliação…' : 'Enviar avaliação'}</button>
    </fieldset>
  </form>
}

export function OrderReview({ order, token, onSaved }: { order: Order; token: string; onSaved: () => void }) {
  const [review, setReview] = useState<Review | null>()
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [saved, setSaved] = useState(false)
  const sendingRef = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    setLoadError('')
    setReview(undefined)
    getReview(order.id, token, controller.signal).then((value) => {
      if (!controller.signal.aborted) setReview(value)
    }).catch((e: unknown) => { if (!controller.signal.aborted) setLoadError(e instanceof Error ? e.message : 'Não foi possível consultar a avaliação.') })
    return () => controller.abort()
  }, [order.id, token, attempt])

  async function send(rating: number, comment: string) {
    if (sendingRef.current) return
    sendingRef.current = true
    setSending(true); setError('')
    try {
      setReview(await submitReview(order.id, token, rating, comment)); setSaved(true); onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a avaliação.')
      if (e instanceof ApiError && e.status === 409) setAttempt((value) => value + 1)
    } finally { sendingRef.current = false; setSending(false) }
  }

  return <section className="panel order-summary" aria-labelledby="review-title">
    <h1 id="review-title">Avaliar serviço</h1>
    <h2>{order.title}</h2>
    {loadError ? <div role="alert"><p>{loadError}</p><button className="button button-secondary" onClick={() => setAttempt((n) => n + 1)}>Tentar novamente</button></div>
      : review === undefined ? <p role="status">Carregando avaliação…</p>
      : review ? <div><p role="status">{saved ? 'Avaliação enviada com sucesso.' : 'Este pedido já foi avaliado.'}</p>
        <p aria-label={`Nota: ${review.rating} de 5 estrelas`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
        {review.comment && <p>{review.comment}</p>}</div>
      : order.status !== 'completed' ? <p>Somente pedidos concluídos podem ser avaliados.</p>
      : <ReviewForm sending={sending} error={error} onSubmit={send} />}
    <Link className="button button-secondary" to={`/pedidos/${order.id}`}>Voltar ao pedido</Link>
  </section>
}
