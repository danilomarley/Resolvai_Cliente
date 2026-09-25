import type { IconName } from '../components/Icon'

export type OrderScope = {
  details: string
  urgency: string
  specifications: string
  photos: File[]
}

export type Order = {
  id: number
  title: string
  category: string
  location: string
  status: 'waiting' | 'progress'
  proposals: number
  deadline: string
  icon: IconName
  description: string
  scope?: OrderScope
}
export const initialOrders: Order[] = [
  {
    id: 1042,
    title: 'Infiltração na laje do quarto',
    category: 'Impermeabilização',
    location: 'Aldeota, Fortaleza',
    status: 'waiting',
    proposals: 3,
    deadline: 'Em aberto',
    icon: 'drop',
    description:
      'Preciso identificar e corrigir uma infiltração na laje do quarto. A umidade aparece principalmente depois de chuvas.',
  },
  {
    id: 1038,
    title: 'Reparo hidráulico no banheiro',
    category: 'Hidráulica',
    location: 'Aldeota, Fortaleza',
    status: 'progress',
    proposals: 2,
    deadline: '18 set.',
    icon: 'tool',
    description:
      'Reparo do vazamento na pia e revisão das conexões do banheiro. Visita técnica realizada e serviço em execução.',
  },
]
export const completed = [
  {
    id: 1029,
    title: 'Pintura da sala e quarto',
    provider: 'Silva Pinturas',
    price: 1800,
    rating: '5,0',
    icon: 'paint' as IconName,
    date: '10 set. 2026',
  },
  {
    id: 1021,
    title: 'Impermeabilização da varanda',
    provider: 'Carlos Impermeabilizações',
    price: 2200,
    rating: '4,8',
    icon: 'drop' as IconName,
    date: '28 ago. 2026',
  },
  {
    id: 1014,
    title: 'Reforma do banheiro',
    provider: 'Fix Construções',
    price: 3400,
    rating: '4,5',
    icon: 'tool' as IconName,
    date: '12 ago. 2026',
  },
]
export const proposals = [
  {
    name: 'Carlos Impermeabilizações',
    initials: 'CI',
    price: 1450,
    rating: '4,9',
    time: '2 dias',
    description:
      'Inspeção, preparação da superfície e aplicação de manta impermeabilizante.',
  },
  {
    name: 'Fortaleza Reparos',
    initials: 'FR',
    price: 1680,
    rating: '4,8',
    time: '3 dias',
    description:
      'Tratamento da infiltração e acabamento da área afetada, com materiais inclusos.',
  },
  {
    name: 'Rafael Serviços',
    initials: 'RS',
    price: 1320,
    rating: '4,7',
    time: '2 dias',
    description:
      'Reparo localizado com impermeabilizante e teste de estanqueidade.',
  },
]
export const currency = (value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
