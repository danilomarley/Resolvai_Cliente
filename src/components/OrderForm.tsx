import { useState, type FormEvent } from 'react'
import type { NewOrder } from '../types/orders'
import { maxPhotoBytes, maxPhotos, photoTypes } from '../services/dashboardApi'
import { PhotoPreview } from './PhotoPreview'
import { urgencyOptions } from '../services/orderDraft'
import './OrderForm.css'
import './OrderScope.css'

const emptyOrder: NewOrder = {
  title: '', category: '', description: '', location: '',
  scope: { details: '', urgency: '', specifications: '' },
}

export function OrderForm({ onCancel, onCreate, submitting, submitError, initial, onBackToAssistant }: {
  onCancel: () => void
  onCreate: (order: NewOrder, photos: File[]) => Promise<void>
  submitting: boolean
  submitError: string
  /** Valores sugeridos pelo assistente (#69); o cliente revisa antes de publicar. */
  initial?: NewOrder
  onBackToAssistant?: () => void
}) {
  const [order, setOrder] = useState<NewOrder>(initial ?? emptyOrder)
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState('')

  function addPhotos(files: File[]) {
    if (!files.length) return
    if (files.length + photos.length > maxPhotos
      || files.some((file) => file.size > maxPhotoBytes || !photoTypes.includes(file.type))) {
      setError(`Selecione até ${maxPhotos} fotos JPG, PNG ou WebP, com no máximo 5 MB cada.`)
      return
    }
    setError('')
    setPhotos((current) => [...current, ...files])
  }

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
    await onCreate(clean, photos)
  }

  return (
    <section className="order-form panel" aria-labelledby="order-form-title">
      <h1 id="order-form-title">{initial ? 'Revise seu pedido' : 'Criar pedido'}</h1>
      <p>{initial
        ? 'O assistente preencheu os campos com o que você contou. Confira, ajuste o que precisar e publique.'
        : 'Informe os detalhes do serviço para publicar seu pedido.'}</p>
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
            <textarea required minLength={10} maxLength={2000} rows={4} value={order.description}
              onChange={(event) => setOrder({ ...order, description: event.target.value })} />
          </label>
          <label>Local do serviço
            <input required minLength={3} maxLength={200} value={order.location}
              onChange={(event) => setOrder({ ...order, location: event.target.value })} />
          </label>
          <label>Detalhes do ambiente
            <textarea required maxLength={2000} rows={3} value={order.scope.details}
              onChange={(event) => setOrder({ ...order, scope: { ...order.scope, details: event.target.value } })} />
          </label>
          <label>Urgência
            <select required value={order.scope.urgency}
              onChange={(event) => setOrder({ ...order, scope: { ...order.scope, urgency: event.target.value } })}>
              <option value="">Selecione</option>
              {urgencyOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <label>Escopo solicitado
            <textarea required minLength={10} maxLength={2000} rows={4} value={order.scope.specifications}
              onChange={(event) => setOrder({ ...order, scope: { ...order.scope, specifications: event.target.value } })} />
          </label>
          <label>Fotos do local <span className="scope-field-hint">Opcional · até {maxPhotos} fotos de 5 MB · JPG, PNG ou WebP</span>
            <input type="file" accept={photoTypes.join(',')} multiple disabled={photos.length >= maxPhotos}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                event.target.value = ''
                addPhotos(files)
              }} />
          </label>
          <PhotoPreview photos={photos} onRemove={(index) => setPhotos((current) => current.filter((_, i) => i !== index))} />
        </fieldset>
        {(error || submitError) && <p role="alert">{error || submitError}</p>}
        <div className="order-form-actions">
          <button className="button button-secondary" type="button" disabled={submitting} onClick={onCancel}>Cancelar</button>
          {onBackToAssistant && (
            <button className="button button-secondary" type="button" disabled={submitting} onClick={onBackToAssistant}>
              Voltar ao assistente
            </button>
          )}
          <button className="button button-primary" type="submit" disabled={submitting}>
            {submitting ? (photos.length ? 'Enviando fotos e publicando…' : 'Publicando…') : 'Publicar pedido'}
          </button>
        </div>
      </form>
    </section>
  )
}
