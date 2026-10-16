import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../services/api'
import { completeRegistration, type CompleteRegistration } from '../services/accountApi'
import { getCurrentUser, type UserDto } from '../services/dashboardApi'
import { orderDate } from '../services/orders'
import './AccountSettings.css'

const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const asError = (error: unknown) => error instanceof ApiError ? error : new ApiError(0, 'Não foi possível consultar sua conta. Tente novamente.')

type Props = { token: string | null; customerId: string | null; onCompleted: () => void }

export function AccountSettings({ token, customerId, onCompleted }: Props) {
  const [user, setUser] = useState<UserDto>()
  const [loadError, setLoadError] = useState<ApiError>()
  const [saveError, setSaveError] = useState<ApiError>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [contactType, setContactType] = useState<CompleteRegistration['contato']['tipo']>('telefone')
  const submission = useRef<AbortController>()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(undefined)
    if (!token || !customerId) {
      setUser(undefined)
      setLoadError(new ApiError(401, 'Entre na sua conta para consultar o cadastro.'))
      setLoading(false)
      return () => controller.abort()
    }
    getCurrentUser(token, controller.signal).then((profile) => {
      if (controller.signal.aborted) return
      if (profile.id.toLowerCase() !== customerId.toLowerCase() || !profile.isActive) {
        throw new ApiError(401, 'Sua conta não possui um perfil ativo na API.')
      }
      setUser(profile)
      setLoading(false)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) { setLoadError(asError(error)); setLoading(false) }
    })
    return () => controller.abort()
  }, [token, customerId, attempt])

  useEffect(() => () => submission.current?.abort(), [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submission.current || !user || user.cpf || !token || !customerId) return
    const form = new FormData(event.currentTarget)
    const field = (name: string) => String(form.get(name) ?? '').trim()
    const body: CompleteRegistration = {
      name: user.name,
      cpf: field('cpf').replace(/\D/g, ''),
      endereco: {
        logradouro: field('logradouro'), numero: field('numero'), complemento: field('complemento') || undefined,
        bairro: field('bairro'), cidade: field('cidade'), estado: field('estado'), cep: field('cep').replace(/\D/g, ''),
        apelido: field('apelido') || undefined,
      },
      contato: { tipo: contactType, valor: field('contato') },
    }
    setSuccess(false)
    setSaveError(undefined)
    if (![body.endereco.logradouro, body.endereco.numero, body.endereco.bairro, body.endereco.cidade, body.contato.valor].every(Boolean)) {
      setSaveError(new ApiError(400, 'Preencha os campos obrigatórios com dados válidos.'))
      return
    }
    const controller = new AbortController()
    submission.current = controller
    setSaving(true)
    try {
      const profile = await completeRegistration(body, token, customerId, controller.signal)
      if (!controller.signal.aborted) { setUser(profile); setSuccess(true); onCompleted() }
    } catch (error) {
      if (!controller.signal.aborted) setSaveError(asError(error))
    } finally {
      if (!controller.signal.aborted) { setSaving(false); submission.current = undefined }
    }
  }

  if (loading) return <p role="status">Carregando dados da conta…</p>
  if (loadError || !user) return <div className="dialog-stack" role="alert">
    <p>{loadError?.message ?? 'Não foi possível consultar sua conta.'}</p>
    <button className="button button-secondary" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button>
    {loadError?.status === 401 && <Link to="/login">Entrar novamente</Link>}
  </div>

  return <div className="account-settings dialog-stack">
    <section aria-labelledby="account-data-title">
      <h3 id="account-data-title">Dados da conta</h3>
      <dl className="account-data">
        <div><dt>Nome</dt><dd>{user.name}</dd></div>
        <div><dt>E-mail de acesso</dt><dd>{user.email}</dd></div>
        <div><dt>Tipo de conta</dt><dd>{user.role === 'Cliente' ? 'Contratante' : user.role === 'Admin' ? 'Administrador' : user.role}</dd></div>
        <div><dt>Situação da conta</dt><dd>{user.isActive ? 'Ativa' : 'Inativa'}</dd></div>
        <div><dt>Conta criada em</dt><dd>{orderDate(user.createdAt)}</dd></div>
        <div><dt>Cadastro</dt><dd>{user.cpf ? 'Finalizado' : 'Pendente de finalização'}</dd></div>
      </dl>
    </section>
    {success && <p role="status" className="account-success">Cadastro finalizado com sucesso.</p>}
    {user.cpf ? <p>Seu cadastro já foi finalizado. Para corrigir os dados cadastrados, entre em contato com o suporte.</p>
      : <form className="form-stack" onSubmit={submit}>
        <h3>Finalizar cadastro</h3>
        <p>Informe seu CPF, endereço principal e contato. Confira os dados antes de enviar: a finalização só pode ser feita uma vez.</p>
        <fieldset disabled={saving} className="account-fields">
          <legend>Documento</legend>
          <label>CPF<input name="cpf" required maxLength={14} inputMode="numeric" autoComplete="off" pattern={'(\\d{11}|\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2})'} placeholder="000.000.000-00" /></label>
        </fieldset>
        <fieldset disabled={saving} className="account-fields">
          <legend>Endereço principal</legend>
          <label>CEP<input name="cep" required maxLength={9} inputMode="numeric" autoComplete="postal-code" pattern={'(\\d{8}|\\d{5}-\\d{3})'} placeholder="00000-000" /></label>
          <label>Logradouro<input name="logradouro" required maxLength={200} autoComplete="address-line1" /></label>
          <div className="account-fields-row">
            <label>Número<input name="numero" required maxLength={20} /></label>
            <label>Complemento (opcional)<input name="complemento" maxLength={200} autoComplete="address-line2" /></label>
          </div>
          <label>Bairro<input name="bairro" required maxLength={120} /></label>
          <div className="account-fields-row">
            <label>Cidade<input name="cidade" required maxLength={120} autoComplete="address-level2" /></label>
            <div className="account-field"><label htmlFor="account-state">Estado</label><select id="account-state" name="estado" required defaultValue="" autoComplete="address-level1">
              <option value="" disabled>Selecione</option>{states.map((state) => <option key={state}>{state}</option>)}
            </select></div>
          </div>
          <label>Apelido do endereço (opcional)<input name="apelido" maxLength={60} placeholder="Ex.: Casa" /></label>
        </fieldset>
        <fieldset disabled={saving} className="account-fields">
          <legend>Contato principal</legend>
          <div className="account-field"><label htmlFor="account-contact-type">Tipo de contato</label><select id="account-contact-type" value={contactType} onChange={(event) => setContactType(event.target.value as typeof contactType)}>
            <option value="telefone">Telefone</option><option value="whatsapp">WhatsApp</option><option value="email_alt">E-mail alternativo</option>
          </select></div>
          <label>{contactType === 'email_alt' ? 'E-mail alternativo' : 'Número de contato'}<input name="contato" required maxLength={60} type={contactType === 'email_alt' ? 'email' : 'tel'} autoComplete={contactType === 'email_alt' ? 'email' : 'tel'} /></label>
        </fieldset>
        {saveError && <div role="alert"><p>{saveError.message}</p>{saveError.status === 401 && <Link to="/login">Entrar novamente</Link>}</div>}
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Finalizando cadastro…' : 'Finalizar cadastro'}</button>
      </form>}
    <button className="button button-secondary" disabled={saving} onClick={() => { setSaveError(undefined); setSuccess(false); setAttempt((value) => value + 1) }}>Atualizar dados da conta</button>
  </div>
}
