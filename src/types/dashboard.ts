export type Dialog =
  | 'create'
  | 'notifications'
  | 'profile'
  | 'help'
  | 'contracts'
  | 'payments'
  | 'reviews'
  | 'messages'
  | 'history'
  | 'proposals'
  | 'order'
  | null
export type Tab = 'all' | 'waiting' | 'progress'


export type Profile = {
  rating: any; name: string; location: string 
}
