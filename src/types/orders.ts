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
  status: 'Sent' | 'Viewed' | 'Chosen'
  value: number
  deadline?: string
  description?: string
  warranty?: string
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
}
