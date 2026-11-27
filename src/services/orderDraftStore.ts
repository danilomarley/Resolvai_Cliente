import type { AssistantMessage, AssistantScope } from './dashboardApi'
import type { NewOrder } from '../types/orders'

/** Conversa com o assistente de IA e o que ele já entendeu do pedido. */
export type AssistantDraft = { messages: AssistantMessage[]; scope: AssistantScope; complete: boolean }

/**
 * Rascunho do pedido em criação: em que etapa a pessoa está, a conversa com o assistente e os campos do
 * formulário. `fromAssistant` diz se o formulário veio da revisão do assistente (e então dá para voltar a ele).
 * As fotos não entram: arquivos não cabem no armazenamento do navegador.
 */
export type OrderDraft = { step: 'assistant' | 'form'; assistant: AssistantDraft; form?: NewOrder; fromAssistant: boolean }

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const emptyDraft = (): OrderDraft => ({ step: 'assistant', assistant: { messages: [], scope: {}, complete: false }, fromAssistant: false })

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const strings = (value: Record<string, unknown>, keys: string[]) => keys.every((key) => typeof value[key] === 'string')
const scopeKeys = ['titulo', 'categoria', 'descricao', 'localizacao', 'detalhes', 'urgencia', 'especificacoes']

function parseForm(value: unknown): NewOrder | undefined {
  if (!object(value) || !strings(value, ['title', 'category', 'description', 'location']) || !object(value.scope)
    || !strings(value.scope, ['details', 'urgency', 'specifications'])) return undefined
  const scope = value.scope as Record<string, string>
  return { title: value.title as string, category: value.category as string, description: value.description as string, location: value.location as string,
    scope: { details: scope.details, urgency: scope.urgency, specifications: scope.specifications } }
}

/** Lê o que foi guardado; qualquer coisa fora do formato esperado é descartada, nunca confiada. */
export function parseDraft(value: unknown): OrderDraft | null {
  if (!object(value) || !['assistant', 'form'].includes(String(value.step)) || typeof value.fromAssistant !== 'boolean' || !object(value.assistant)) return null
  const { messages, scope, complete } = value.assistant
  if (!Array.isArray(messages) || messages.length > 60 || typeof complete !== 'boolean' || !object(scope)) return null
  if (!messages.every((message) => object(message) && ['user', 'assistant'].includes(String(message.role)) && typeof message.content === 'string' && message.content.length <= 4000)) return null
  const known: AssistantScope = {}
  for (const key of scopeKeys) {
    const entry = scope[key]
    if (entry !== undefined && typeof entry !== 'string') return null
    if (typeof entry === 'string') known[key as keyof AssistantScope] = entry
  }
  const form = value.form === undefined ? undefined : parseForm(value.form)
  if (value.form !== undefined && !form) return null
  if (value.step === 'form' && !form) return null
  return { step: value.step as OrderDraft['step'], fromAssistant: value.fromAssistant, form,
    assistant: { messages: messages as AssistantMessage[], scope: known, complete } }
}

/** Só vale guardar quando há algo escrito: conversa começada ou campos preenchidos. */
export function draftHasContent(draft: OrderDraft): boolean {
  const form = draft.form
  return draft.assistant.messages.length > 0
    || !!form && [form.title, form.category, form.description, form.location, form.scope.details, form.scope.urgency, form.scope.specifications].some((text) => text.trim() !== '')
}

/** Rascunho por pessoa e por aba (sessionStorage): outra conta no mesmo navegador não vê o pedido. Falhas de armazenamento são ignoradas. */
export function createOrderDraftStore(storage: () => DraftStorage) {
  const key = (customerId: string) => `resolvai.rascunho-pedido.${customerId}`
  return {
    read(customerId: string): OrderDraft | null {
      try {
        const raw = storage().getItem(key(customerId))
        if (!raw) return null
        let draft: OrderDraft | null = null
        try { draft = parseDraft(JSON.parse(raw)) } catch { /* JSON quebrado: tratado como rascunho inválido. */ }
        if (!draft) storage().removeItem(key(customerId))
        return draft
      } catch {
        return null
      }
    },
    write(customerId: string, draft: OrderDraft) {
      try {
        if (draftHasContent(draft)) storage().setItem(key(customerId), JSON.stringify(draft))
        else storage().removeItem(key(customerId))
      } catch { /* Sem armazenamento (aba privada, cota cheia): o pedido segue funcionando, só sem rascunho. */ }
    },
    clear(customerId: string) {
      try { storage().removeItem(key(customerId)) } catch { /* Nada a limpar. */ }
    },
  }
}

export const orderDraftStore = createOrderDraftStore(() => window.sessionStorage)
