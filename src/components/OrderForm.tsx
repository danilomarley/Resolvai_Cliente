import { useState, type FormEvent } from 'react'
import type { NewOrder } from '../types/orders'
import './OrderForm.css'

export function OrderForm({ onCancel, onCreate, submitting, submitError }: {
  onCancel: () => void
  onCreate: (order: NewOrder) => Promise<void>
  submitting: boolean
  submitError: string
}) {
  const [order, setOrder] = useState<NewOrder>({
    title: '', category: '', description: '', location: '',
    scope: { details: '', urgency: '', specifications: '' },
  })
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    const clean: NewOrder = {
      title: order.title.trim(), category: order.category.trim(),
      description: order.description.trim(), location: order.location.trim(),
      scope: { details: order.scope.details.trim(), urgency: order.scope.urgency,
        specifications: order.scope.specifications.trim() },
    }
    if (clean.title.length < 3 || !clean.category || clean.description.length < 10
      || clean.location.length < 3 || !clean.scope.details || !clean.scope.urgency
      || clean.scope.specifications.length < 10) {
      setError('Preencha todos os campos. Use ao menos 3 caracteres no título e local e 10 na descrição e no escopo.')
      return
    }
    setError('')
    await onCreate(clean)
  }

  return (
    <section className="order-form panel" aria-labelledby="order-form-title">
      <h1 id="order-form-title">Criar pedido</h1>
      <p>Informe os detalhes do serviço para publicar seu pedido.</p>
      <form onSubmit={submit}>
        <fieldset disabled={submitting}>
          <legend>Dados do serviço</legend>
          <label>Título
            <input required minLength={3} maxLength={90} value={order.title}
              onChange={(event) => setOrder({ ...order, title: event.target.value })} />
          </label>
          <label>Categoria
            <input required maxLength={80} value={order.category}
              onChange={(event) => setOrder({ ...order, category: event.target.value })} />
          </label>
          <label>Descrição
            <textarea required minLength={10} maxLength={1200} rows={4} value={order.description}
              onChange={(event) => setOrder({ ...order, description: event.target.value })} />
          </label>
          <label>Local do serviço
            <input required minLength={3} maxLength={120} value={order.location}
              onChange={(event) => setOrder({ ...order, location: event.target.value })} />
          </label>
          <label>Detalhes do ambiente
            <textarea required maxLength={1200} rows={3} value={order.scope.details}
              onChange={(event) => setOrder({ ...order, scope: { ...order.scope, details: event.target.value } })} />
          </label>
          <label>Urgência
            <select required value={order.scope.urgency}
              onChange={(event) => setOrder({ ...order, scope: { ...order.scope, urgency: event.target.value } })}>
              <option value="">Selecione</option>
              <option>Urgente</option>
              <option>Nos próximos dias</option>
              <option>Pode esperar</option>
            </select>
          </label>
          <label>Escopo solicitado
            <textarea required minLength={10} maxLength={2000} rows={4} value={order.scope.specifications}
              onChange={(event) => setOrder({ ...order, scope: { ...order.scope, specifications: event.target.value } })} />
          </label>
        </fieldset>
        <p>O envio de fotos ainda não está disponível.</p>
        {(error || submitError) && <p role="alert">{error || submitError}</p>}
        <div className="order-form-actions">
          <button className="button button-secondary" type="button" disabled={submitting} onClick={onCancel}>Cancelar</button>
          <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Publicando…' : 'Publicar pedido'}</button>
        </div>
      </form>
    </section>
  )
}
