import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import '../../styles/login.css'
import { CompleteRegistrationForm } from '../../components/CompleteRegistrationForm'
import { nextAfterRegistration } from '../../services/returnPath'
import { useCustomerSession } from '../../services/useCustomerSession'
import { useDashboardData } from '../../services/useDashboardData'
import { useFinalizeRegistration } from '../../services/useFinalizeRegistration'

const formId = 'finalizar-cadastro'

/**
 * Finalizar cadastro (documento, endereço e contato): etapa obrigatória para criar pedidos, por isso é uma
 * página própria e sem menu, no mesmo estilo do login. Ao concluir, volta para o que a pessoa queria fazer.
 */
export function FinalizarCadastro() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = useCustomerSession()
  const account = useDashboardData(session.accessToken, session.customerId)
  const next = nextAfterRegistration(location.search)
  const { saving, error, submit } = useFinalizeRegistration(session.accessToken, session.customerId,
    () => navigate(next, { replace: true, state: { notice: 'Cadastro finalizado com sucesso.' } }))

  if (!session.loading && !session.error && !session.customerId) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  // Quem já finalizou não tem o que preencher (por exemplo, abriu um link antigo).
  if (account.data?.user.cpf) return <Navigate to={next} replace />

  const creating = next === '/pedidos/novo'
  return (
    <main className="login-container">
      <div className="login-card login-card-wide">
        <header className="login-header">
          <div className="logo-container">
            <div className="logo-icon">R</div>
            <h1 className="logo-text">Finalizar cadastro</h1>
          </div>
          <p>{creating
            ? 'Para criar um pedido, precisamos concluir seu cadastro. Leva menos de um minuto.'
            : 'Informe seu documento, endereço principal e contato para usar todos os recursos.'}</p>
        </header>
        {session.loading || account.loading
          ? <p role="status">Carregando seus dados…</p>
          : session.error || account.error
            ? <div role="alert">
              <p>{session.error || account.error?.message}</p>
              <button type="button" className="btn-primary" onClick={session.error ? session.retry : account.retry}>Tentar novamente</button>
              {account.error?.status === 401 && <Link to="/login" state={{ from: location.pathname + location.search }}>Entrar novamente</Link>}
            </div>
            : <>
              <CompleteRegistrationForm id={formId} defaultName={account.data?.user.name} disabled={saving} error={error} onSubmit={submit} />
              <button type="submit" form={formId} className="btn-primary" disabled={saving}>
                {saving ? 'Finalizando cadastro…' : 'Finalizar cadastro'}
              </button>
              <div className="form-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                <Link to="/" className="forgot-password">Agora não</Link>
              </div>
            </>}
      </div>
    </main>
  )
}
