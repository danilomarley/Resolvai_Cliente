import { AccountSettings } from '../../components/AccountSettings'

/** Minha conta (/conta): dados do cadastro, edição de nome, endereço e contato, troca de senha e saída da conta. */
export function AccountPage({ token, customerId, onUpdated }: {
  token: string | null
  customerId: string | null
  /** Chamado quando os dados da conta mudam, para a Visão geral e o menu mostrarem o nome novo. */
  onUpdated: () => void
}) {
  return (
    <section className="account-page">
      <div className="page-heading">
        <div>
          <h1>Minha conta</h1>
          <p>Seus dados de cadastro, contato e acesso.</p>
        </div>
      </div>
      <AccountSettings key={`${customerId}:${token}`} token={token} customerId={customerId} onCompleted={onUpdated} />
    </section>
  )
}
