import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../services/api'
import {
  completeRegistration, getProfile, updateProfile,
  type CompleteRegistration, type Profile, type ProfileContact,
} from '../services/accountApi'
import { orderDate } from '../services/orders'
import { customerSession } from '../services/session'
import './AccountSettings.css'

const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const asError = (error: unknown) => error instanceof ApiError ? error : new ApiError(0, 'Não foi possível consultar sua conta. Tente novamente.')
const onlyDigits = (value: string) => value.replace(/\D/g, '')

type Props = { token: string | null; customerId: string | null; onCompleted: () => void }
type FormField = (name: string) => string

// Campos de endereço e contato, usados tanto na finalização do cadastro quanto na edição (#61).
function AddressAndContactFields({ disabled, profile, contactType, setContactType }: {
  disabled: boolean
  profile?: Profile
  contactType: ProfileContact['tipo']
  setContactType: (value: ProfileContact['tipo']) => void
}) {
  const address = profile?.endereco
  const contact = profile?.contato
  return <>
    <fieldset disabled={disabled} className="account-fields">
      <legend>Endereço principal</legend>
      <label>CEP<input name="cep" required maxLength={9} inputMode="numeric" autoComplete="postal-code" pattern={'(\\d{8}|\\d{5}-\\d{3})'} placeholder="00000-000" defaultValue={address?.cep} /></label>
      <label>Logradouro<input name="logradouro" required maxLength={200} autoComplete="address-line1" defaultValue={address?.logradouro} /></label>
      <div className="account-fields-row">
        <label>Número<input name="numero" required maxLength={20} defaultValue={address?.numero} /></label>
        <label>Complemento (opcional)<input name="complemento" maxLength={200} autoComplete="address-line2" defaultValue={address?.complemento} /></label>
      </div>
      <label>Bairro<input name="bairro" required maxLength={120} defaultValue={address?.bairro} /></label>
      <div className="account-fields-row">
        <label>Cidade<input name="cidade" required maxLength={120} autoComplete="address-level2" defaultValue={address?.cidade} /></label>
        <div className="account-field"><label htmlFor="account-state">Estado</label><select id="account-state" name="estado" required defaultValue={address?.estado ?? ''} autoComplete="address-level1">
          <option value="" disabled>Selecione</option>{states.map((state) => <option key={state}>{state}</option>)}
        </select></div>
      </div>
      <label>Apelido do endereço (opcional)<input name="apelido" maxLength={60} placeholder="Ex.: Casa" defaultValue={address?.apelido} /></label>
    </fieldset>
    <fieldset disabled={disabled} className="account-fields">
      <legend>Contato principal</legend>
      <div className="account-field"><label htmlFor="account-contact-type">Tipo de contato</label><select id="account-contact-type" value={contactType} onChange={(event) => setContactType(event.target.value as ProfileContact['tipo'])}>
        <option value="telefone">Telefone</option><option value="whatsapp">WhatsApp</option><option value="email_alt">E-mail alternativo</option>
      </select></div>
      <label>{contactType === 'email_alt' ? 'E-mail alternativo' : 'Número de contato'}<input name="contato" required maxLength={60} type={contactType === 'email_alt' ? 'email' : 'tel'} autoComplete={contactType === 'email_alt' ? 'email' : 'tel'} defaultValue={contact?.valor} /></label>
    </fieldset>
  </>
}

function readAddress(field: FormField): CompleteRegistration['endereco'] {
  return {
    logradouro: field('logradouro'), numero: field('numero'), complemento: field('complemento') || undefined,
    bairro: field('bairro'), cidade: field('cidade'), estado: field('estado'), cep: onlyDigits(field('cep')),
    apelido: field('apelido') || undefined,
  }
}

export function AccountSettings({ token, customerId, onCompleted }: Props) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile>()
  const [loadError, setLoadError] = useState<ApiError>()
  const [saveError, setSaveError] = useState<ApiError>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [contactType, setContactType] = useState<ProfileContact['tipo']>('telefone')
  const submission = useRef<AbortController>()
  const user = profile?.user

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(undefined)
    if (!token || !customerId) {
      setProfile(undefined)
      setLoadError(new ApiError(401, 'Entre na sua conta para consultar o cadastro.'))
      setLoading(false)
      return () => controller.abort()
    }
    getProfile(token, controller.signal).then((data) => {
      if (controller.signal.aborted) return
      if (data.user.id.toLowerCase() !== customerId.toLowerCase() || !data.user.isActive) {
        throw new ApiError(401, 'Sua conta não possui um perfil ativo na API.')
      }
      setProfile(data)
      if (data.contato) setContactType(data.contato.tipo)
      setLoading(false)
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) { setLoadError(asError(error)); setLoading(false) }
    })
    return () => controller.abort()
  }, [token, customerId, attempt])

  useEffect(() => () => submission.current?.abort(), [])

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (submission.current) return
    const controller = new AbortController()
    submission.current = controller
    setSaving(true)
    setSuccess('')
    setSaveError(undefined)
    try {
      await action(controller.signal)
    } catch (error) {
      if (!controller.signal.aborted) setSaveError(asError(error))
    } finally {
      if (!controller.signal.aborted) { setSaving(false); submission.current = undefined }
    }
  }

  async function finalize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || user.cpf || !token || !customerId) return
    const form = new FormData(event.currentTarget)
    const field: FormField = (name) => String(form.get(name) ?? '').trim()
    const body: CompleteRegistration = {
      name: user.name, cpf: onlyDigits(field('cpf')), endereco: readAddress(field),
      contato: { tipo: contactType, valor: field('contato') },
    }
    await run(async (signal) => {
      await completeRegistration(body, token, customerId, signal)
      setSuccess('Cadastro finalizado com sucesso.')
      setAttempt((value) => value + 1)
      onCompleted()
    })
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user?.cpf || !token) return
    const form = new FormData(event.currentTarget)
    const field: FormField = (name) => String(form.get(name) ?? '').trim()
    await run(async (signal) => {
      const updated = await updateProfile(token, {
        name: field('name'), endereco: readAddress(field), contato: { tipo: contactType, valor: field('contato') },
      }, signal)
      setProfile(updated)
      setSuccess('Dados da conta atualizados.')
      onCompleted()
    })
  }

  function logout() {
    submission.current?.abort()
    customerSession.clear()
    navigate('/login', { replace: true })
  }

  const logoutButton = <button className="button button-secondary" type="button" onClick={logout}>Sair da conta</button>

  if (loading) return <p role="status">Carregando dados da conta…</p>
  if (loadError || !user) return <div className="dialog-stack" role="alert">
    <p>{loadError?.message ?? 'Não foi possível consultar sua conta.'}</p>
    <button className="button button-secondary" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button>
    {loadError?.status === 401 && <Link to="/login">Entrar novamente</Link>}
    {logoutButton}
  </div>

  return <div className="account-settings dialog-stack">
    <section aria-labelledby="account-data-title">
      <h3 id="account-data-title">Dados da conta</h3>
      <dl className="account-data">
        <div><dt>E-mail de acesso</dt><dd>{user.email}</dd></div>
        <div><dt>Tipo de conta</dt><dd>{user.role === 'Cliente' ? 'Contratante' : user.role === 'Admin' ? 'Administrador' : user.role}</dd></div>
        <div><dt>Situação da conta</dt><dd>{user.isActive ? 'Ativa' : 'Inativa'}</dd></div>
        <div><dt>Conta criada em</dt><dd>{orderDate(user.createdAt)}</dd></div>
        <div><dt>Cadastro</dt><dd>{user.cpf ? 'Finalizado' : 'Pendente de finalização'}</dd></div>
      </dl>
    </section>
    {success && <p role="status" className="account-success">{success}</p>}
    {user.cpf
      ? <form className="form-stack" onSubmit={saveChanges} key={`editar-${attempt}`}>
        <h3>Editar dados</h3>
        <p>Atualize seu nome, endereço principal e contato. O CPF não pode ser alterado.</p>
        <fieldset disabled={saving} className="account-fields">
          <legend>Identificação</legend>
          <label>Nome<input name="name" required maxLength={200} autoComplete="name" defaultValue={user.name} /></label>
          <label>CPF<input value={user.cpf} disabled readOnly /></label>
        </fieldset>
        <AddressAndContactFields disabled={saving} profile={profile} contactType={contactType} setContactType={setContactType} />
        {saveError && <div role="alert"><p>{saveError.message}</p>{saveError.status === 401 && <Link to="/login">Entrar novamente</Link>}</div>}
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button>
      </form>
      : <form className="form-stack" onSubmit={finalize}>
        <h3>Finalizar cadastro</h3>
        <p>Informe seu CPF, endereço principal e contato. Confira o CPF antes de enviar: ele não pode ser alterado depois.</p>
        <fieldset disabled={saving} className="account-fields">
          <legend>Documento</legend>
          <label>CPF<input name="cpf" required maxLength={14} inputMode="numeric" autoComplete="off" pattern={'(\\d{11}|\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2})'} placeholder="000.000.000-00" /></label>
        </fieldset>
        <AddressAndContactFields disabled={saving} contactType={contactType} setContactType={setContactType} />
        {saveError && <div role="alert"><p>{saveError.message}</p>{saveError.status === 401 && <Link to="/login">Entrar novamente</Link>}</div>}
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Finalizando cadastro…' : 'Finalizar cadastro'}</button>
      </form>}
    <button className="button button-secondary" disabled={saving} onClick={() => { setSaveError(undefined); setSuccess(''); setAttempt((value) => value + 1) }}>Atualizar dados da conta</button>
    {logoutButton}
  </div>
}
