import type { IconName } from '../components/Icon'

export type OrderScope = {
  details: string
  urgency: string
  specifications: string
}

export type NewOrder = {
  title: string
  category: string
  description: string
  location: string
  scope: OrderScope
}

export type OrderProposal = {
  id: string
  providerName: string
  status: 'Sent' | 'Viewed' | 'Chosen' | 'NotChosen'
  value: number
  deadline?: string
  /** Prazo em dias; base da ordenação por prazo e do destaque "menor prazo". */
  deadlineDays?: number
  description?: string
  warranty?: string
  createdAt?: string
  /** Média das avaliações do prestador (null quando ainda não foi avaliado). */
  providerRating?: { average: number | null; count: number }
}

export type Order = {
  id: string
  customerId: string
  createdAt?: string
  updatedAt?: string
  title: string
  category: string
  location: string
  status: 'waiting' | 'progress' | 'completed' | 'cancelled'
  proposals: number
  icon: IconName
  description: string
  scope?: OrderScope
  chosenProposalValue?: number
  proposalList?: OrderProposal[]
  photoUrls?: string[]
  /** Motivo informado pelo contratante ao cancelar o pedido (#88). */
  cancellationReason?: string
}
