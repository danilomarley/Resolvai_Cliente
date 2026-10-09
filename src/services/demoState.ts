import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { Order } from '../data/dashboard'
import type { Profile } from '../types/dashboard'

type Setter<T> = Dispatch<SetStateAction<T>>
type DemoState = {
  orders: Order[]; setOrders: Setter<Order[]>
  profile: Profile; setProfile: Setter<Profile>
  unread: boolean; setUnread: Setter<boolean>
  messages: string[]; setMessages: Setter<string[]>
  interestedProvider: string | null; setInterestedProvider: Setter<string | null>
}
export const DemoContext = createContext<DemoState | null>(null)

export function useDemoState() {
  const state = useContext(DemoContext)
  if (!state) throw new Error('A demonstração precisa de seu provedor de estado.')
  return state
}
