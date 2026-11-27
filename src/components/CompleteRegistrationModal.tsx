import { Modal } from './Modal'
import { CompleteRegistrationForm } from './CompleteRegistrationForm'
import { useFinalizeRegistration } from '../services/useFinalizeRegistration'

const formId = 'finalizar-cadastro'

/** Modal "Finalizar cadastro": abre sobre a tela atual e devolve a pessoa ao que ela estava fazendo. */
export function CompleteRegistrationModal({ token, customerId, defaultName, reason, onClose, onCompleted }: {
  token: string | null
  customerId: string | null
  defaultName?: string
  /** Por que o cadastro é necessário agora (ex.: para criar um pedido). */
  reason?: string
  onClose: () => void
  onCompleted: () => void
}) {
  const { saving, error, submit } = useFinalizeRegistration(token, customerId, onCompleted)
  return (
    <Modal size="lg" title="Finalizar cadastro" onClose={onClose} dismissible={!saving}
      description={reason ?? 'Informe seu documento, endereço principal e contato para usar todos os recursos.'}
      footer={<>
        <button type="button" className="button button-secondary" onClick={onClose} disabled={saving}>Agora não</button>
        <button type="submit" form={formId} className="button button-primary" disabled={saving}>
          {saving ? 'Finalizando cadastro…' : 'Finalizar cadastro'}
        </button>
      </>}>
      <CompleteRegistrationForm id={formId} defaultName={defaultName} disabled={saving} error={error} onSubmit={submit} />
    </Modal>
  )
}
