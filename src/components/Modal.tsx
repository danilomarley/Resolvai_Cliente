import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

type ModalProps = {
  title: string
  children: ReactNode
  onClose: () => void
  /** sm = 440px, md = 580px (padrão), lg = 760px, xl = 1120px (fluxos em duas colunas). */
  size?: ModalSize
  /** Texto de apoio abaixo do título, também usado como descrição acessível. */
  description?: string
  /** Ações fixas no rodapé; o corpo rola sozinho quando o conteúdo é longo. */
  footer?: ReactNode
  /** Com false, Esc, clique no fundo e botão fechar ficam bloqueados (ex.: durante um envio). */
  dismissible?: boolean
  /** Quando este valor muda (ex.: a etapa de um fluxo), o corpo volta ao topo. */
  scrollKey?: unknown
}

export function Modal({
  title,
  children,
  onClose,
  size = 'md',
  description,
  footer,
  dismissible = true,
  scrollKey,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const pressedOnBackdrop = useRef(false)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement as HTMLElement | null
    dialog?.showModal()
    // O navegador foca o primeiro elemento focável (o botão de fechar); em modais com formulário
    // é melhor começar pelo primeiro campo.
    // preventScroll: o cabeçalho do fluxo (ex.: título do assistente) continua visível ao abrir.
    dialog?.querySelector<HTMLElement>('.modal-body :is(input, textarea, select):not([disabled]):not([type=hidden])')?.focus({ preventScroll: true })
    return () => {
      dialog?.close()
      previousFocus?.focus()
    }
  }, [])

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }) }, [scrollKey])

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
        <div className="modal-body" ref={bodyRef}>{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </dialog>
  )
}
