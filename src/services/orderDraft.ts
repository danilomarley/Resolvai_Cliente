import type { AssistantScope } from './dashboardApi'
import type { NewOrder } from '../types/orders'

// Mesmas opções aceitas pelo assistente da API para o campo urgencia.
export const urgencyOptions = ['Urgente', 'Nos próximos dias', 'Pode esperar']

/** Converte o escopo sugerido pelo assistente (#69) para os campos do formulário de criação de pedido. */
export function scopeToOrder(scope: AssistantScope): NewOrder {
  return {
    title: scope.titulo ?? scope.categoria ?? '',
    category: scope.categoria ?? '',
    description: scope.descricao ?? '',
    location: scope.localizacao ?? '',
    scope: {
      details: scope.detalhes ?? '',
      urgency: scope.urgencia && urgencyOptions.includes(scope.urgencia) ? scope.urgencia : '',
      specifications: scope.especificacoes ?? '',
    },
  }
}
