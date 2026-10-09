import { useState, type ReactNode } from 'react'
import { initialOrders } from '../data/dashboard'
import { DemoContext } from '../services/demoState'

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState(initialOrders)
  const [profile, setProfile] = useState({ name: 'Ygor Chagas', location: 'Aldeota, Fortaleza' })
  const [unread, setUnread] = useState(true)
  const [messages, setMessages] = useState<string[]>([])
  const [interestedProvider, setInterestedProvider] = useState<string | null>(null)
  return <DemoContext.Provider value={{ orders, setOrders, profile, setProfile, unread, setUnread,
    messages, setMessages, interestedProvider, setInterestedProvider }}>{children}</DemoContext.Provider>
}
