import { useEffect, useRef, useState, type FormEvent } from 'react'
import { lookupCep } from '../services/cep'
import type { CompleteRegistration } from '../services/accountApi'
import {
  buildRegistration, emptyRegistration, maskCep, maskCpf, maskPhone, states,
  type ContactType, type RegistrationFormValues,
} from '../services/registrationForm'
import './AccountSettings.css'

type CepStatus = 'idle' | 'loading' | 'notfound' | 'error'

/**
 * Formulário único de finalização de cadastro (documento, endereço e contato), usado no modal
 * "Finalizar cadastro" e na aba de configurações da conta. Os botões ficam com quem o usa
 * (rodapé do modal ou fim do formulário) e se ligam a ele pelo atributo `form`.
 */
export function CompleteRegistrationForm({ id, defaultName = '', disabled, error, onSubmit }: {
  id: string
  defaultName?: string
  disabled: boolean
  /** Erro devolvido pela API no envio anterior. */
  error?: string
  onSubmit: (payload: CompleteRegistration) => void
}) {
  const [form, setForm] = useState<RegistrationFormValues>(() => emptyRegistration(defaultName))
  const [problem, setProblem] = useState('')
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle')
  const numberRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof RegistrationFormValues>(field: K, value: RegistrationFormValues[K]) =>
    setForm((current) => ({ ...current, [field]: value }))

  // O nome pode chegar depois do primeiro render; só preenche enquanto a pessoa não digitou nada.
  useEffect(() => { setForm((current) => current.name ? current : { ...current, name: defaultName }) }, [defaultName])

  useEffect(() => {
    if (form.cep.replace(/\D/g, '').length !== 8) { setCepStatus('idle'); return }
    const controller = new AbortController()
    setCepStatus('loading')
    lookupCep(form.cep, controller.signal).then((address) => {
      if (controller.signal.aborted) return
      if (!address) { setCepStatus('notfound'); return }
      setForm((current) => ({
        ...current,
        logradouro: address.logradouro || current.logradouro,
        bairro: address.bairro || current.bairro,
        cidade: address.cidade || current.cidade,
        estado: states.includes(address.estado) ? address.estado : current.estado,
      }))
      setCepStatus('idle')
      numberRef.current?.focus()
    }).catch(() => { if (!controller.signal.aborted) setCepStatus('error') })
    return () => controller.abort()
  }, [form.cep])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = buildRegistration(form)
    if ('error' in result) { setProblem(result.error); return }
    setProblem('')
    onSubmit(result.payload)
  }

  const emailContact = form.contactType === 'email_alt'
  const message = problem || error
  return (
    <form id={id} className="form-stack" onSubmit={submit} noValidate>
      <fieldset disabled={disabled} className="account-fields">
        <legend>Identificação</legend>
        <label>Nome completo<input name="name" required maxLength={200} autoComplete="name" value={form.name}
          onChange={(event) => set('name', event.target.value)} /></label>
        <label>CPF<input name="cpf" required inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={form.cpf}
          onChange={(event) => set('cpf', maskCpf(event.target.value))} aria-describedby={`${id}-cpf-hint`} /></label>
        <small id={`${id}-cpf-hint`}>Confira o CPF antes de enviar: ele não pode ser alterado depois.</small>
      </fieldset>
      <fieldset disabled={disabled} className="account-fields">
        <legend>Endereço principal</legend>
        <label>CEP<input name="cep" required inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={form.cep}
          onChange={(event) => set('cep', maskCep(event.target.value))} /></label>
        {cepStatus !== 'idle' && <small role="status">
          {cepStatus === 'loading' && 'Buscando endereço…'}
          {cepStatus === 'notfound' && 'CEP não encontrado. Preencha o endereço manualmente.'}
          {cepStatus === 'error' && 'Não foi possível buscar o CEP. Preencha o endereço manualmente.'}
        </small>}
        <label>Logradouro<input name="logradouro" required maxLength={200} autoComplete="address-line1" value={form.logradouro}
          onChange={(event) => set('logradouro', event.target.value)} /></label>
        <div className="account-fields-row">
          <label>Número<input ref={numberRef} name="numero" required maxLength={20} value={form.numero}
            onChange={(event) => set('numero', event.target.value)} /></label>
          <label>Complemento (opcional)<input name="complemento" maxLength={200} autoComplete="address-line2" value={form.complemento}
            onChange={(event) => set('complemento', event.target.value)} /></label>
        </div>
        <label>Bairro<input name="bairro" required maxLength={120} value={form.bairro}
          onChange={(event) => set('bairro', event.target.value)} /></label>
        <div className="account-fields-row">
          <label>Cidade<input name="cidade" required maxLength={120} autoComplete="address-level2" value={form.cidade}
            onChange={(event) => set('cidade', event.target.value)} /></label>
          <label>Estado<select name="estado" required autoComplete="address-level1" value={form.estado}
            onChange={(event) => set('estado', event.target.value)}>
            <option value="" disabled>Selecione</option>
            {states.map((state) => <option key={state}>{state}</option>)}
          </select></label>
        </div>
      </fieldset>
      <fieldset disabled={disabled} className="account-fields">
        <legend>Contato principal</legend>
        <label>Tipo de contato<select name="contactType" value={form.contactType}
          onChange={(event) => setForm((current) => ({ ...current, contactType: event.target.value as ContactType, contactValue: '' }))}>
          <option value="whatsapp">WhatsApp</option>
          <option value="telefone">Telefone</option>
          <option value="email_alt">E-mail alternativo</option>
        </select></label>
        <label>{emailContact ? 'E-mail alternativo' : 'Número de contato'}<input name="contactValue" required
          type={emailContact ? 'email' : 'tel'} inputMode={emailContact ? 'email' : 'numeric'}
          autoComplete={emailContact ? 'email' : 'tel-national'} maxLength={emailContact ? 254 : 15}
          placeholder={emailContact ? 'nome@exemplo.com' : '(00) 00000-0000'} value={form.contactValue}
          onChange={(event) => set('contactValue', emailContact ? event.target.value : maskPhone(event.target.value))} /></label>
      </fieldset>
      {message && <p role="alert" className="form-error">{message}</p>}
    </form>
  )
}
