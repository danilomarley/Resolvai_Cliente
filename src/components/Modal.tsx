import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export type ModalSize = 'sm' | 'md' | 'lg'

type ModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
  /** sm = 440px, md = 580px (padrão), lg = 760px. */
  size?: ModalSize
  /** Texto de apoio abaixo do título, também usado como descrição acessível. */
  description?: string
  /** Ações fixas no rodapé; o corpo rola sozinho quando o conteúdo é longo. */
  footer?: ReactNode
  /** Com false, Esc, clique no fundo e botão fechar ficam bloqueados (ex.: durante um envio). */
  dismissible?: boolean
}

export function Modal({
  title,
  children,
  onClose,
  size = 'md',
  description,
  footer,
  dismissible = true,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const pressedOnBackdrop = useRef(false)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => {
      dialog?.close()
      previousFocus?.focus()
    }
  }, [])

  function requestClose() {
    if (dismissible) onClose()
  }

  return (
    <dialog
      ref={ref}
      className={`modal modal-${size}`}
      // O navegador fecha o <dialog> sozinho no Esc; quem decide é o estado do app.
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      // Só fecha se o clique começou e terminou no fundo (selecionar texto e soltar fora não fecha).
      onMouseDown={(event) => {
        pressedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedOnBackdrop.current && event.target === event.currentTarget) requestClose()
        pressedOnBackdrop.current = false
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="modal-inner">
        <div className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && (
              <p id={descriptionId} className="modal-description">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={requestClose}
            disabled={!dismissible}
            aria-label="Fechar janela"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </dialog>
  )
}
