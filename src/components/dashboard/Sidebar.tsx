import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { Icon, type IconName } from '../Icon'
import type { Dialog, Profile } from '../../types/dashboard'

type SidebarProps = {
  mobileOpen: boolean
  setMobileOpen: Dispatch<SetStateAction<boolean>>
  activeNav: string
  navigate: (label: string, target?: Dialog) => void
  openDialog: (dialog: Dialog) => void
  profile: Profile
  unread: boolean
}

export function Sidebar({
  mobileOpen,
  setMobileOpen,
  activeNav,
  navigate,
  openDialog,
  profile,
  unread,
}: SidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!mobileOpen) return
    const previousFocus = document.activeElement as HTMLElement | null
    const elements =
      sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button')
    const first = elements?.[0]
    const last = elements?.[elements.length - 1]
    first?.focus()
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previousFocus?.focus()
    }
  }, [mobileOpen, setMobileOpen])

  function navItem(
    label: string,
    icon: IconName,
    target?: Dialog,
    badge?: string,
  ) {
    return (
      <button
        className={`nav-item ${activeNav === label ? 'active' : ''}`}
        aria-current={activeNav === label ? 'page' : undefined}
        onClick={() => navigate(label, target)}
      >
        <Icon name={icon} />
        <span>{label}</span>
        {badge && <span className="nav-badge">{badge}</span>}
      </button>
    )
  }

  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar ${mobileOpen ? 'is-open' : ''}`}
        aria-label="Menu principal"
      >
        <div className="sidebar-content">
          <a
            className="brand"
            href="#"
            aria-label="ResolvAI — início do contratante"
            onClick={(event) => {
              event.preventDefault()
              navigate('Visão geral')
            }}
          >
           <img src="/brand/resolvai-original.svg" alt="ResolvAI" />
          </a>
          <nav>
            <p className="nav-label">PRINCIPAL</p>
            {navItem('Visão geral', 'grid')}
            {navItem('Criar pedido', 'plus', 'create')}
            {navItem('Meus pedidos', 'bag')}
            {navItem(
              'Propostas',
              'file',
              'proposals',
              unread ? '3' : undefined,
            )}
            {navItem('Mensagens', 'chat', 'messages')}
            <p className="nav-label management-label">GERENCIAMENTO</p>
            {navItem('Contratos', 'shield', 'contracts')}
            {navItem('Pagamentos', 'wallet', 'payments')}
            {navItem('Avaliações', 'star', 'reviews')}
          </nav>
          <button
            className="sidebar-help-link"
            onClick={() => openDialog('help')}
          >
            <Icon name="help" size={18} />
            <span>Central de ajuda</span>
            <Icon name="chevron" size={14} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button
            className="sidebar-profile"
            aria-label={`Abrir perfil de ${profile.name}`}
            onClick={() => openDialog('profile')}
          >
            <span className="avatar">
              {profile.name
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span>
              <strong>{profile.name}</strong>
              <small>Contratante</small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </aside>

    </>
  )
}
