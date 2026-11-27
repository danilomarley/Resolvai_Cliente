import { useState, type FormEvent } from 'react'
import { passwordLimits, validateNewPassword } from '../services/passwordForm'

/** Troca de senha da conta: nova senha e confirmação. O envio e as mensagens da API ficam com quem usa o formulário. */
export function ChangePasswordForm({ saving, error, success, onSubmit }: {
  saving: boolean
  /** Erro devolvido pela API no envio anterior. */
  error?: string
  /** Mensagem de sucesso depois de trocar a senha. */
  success?: string
  onSubmit: (newPassword: string) => void
}) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [problem, setProblem] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const invalid = validateNewPassword(password, confirmation)
    setProblem(invalid)
    if (!invalid) onSubmit(password)
  }

  return (
    <form className="form-stack" onSubmit={submit} aria-labelledby="password-title">
      <h2 id="password-title">Alterar senha</h2>
      <p>Escolha uma senha nova com {passwordLimits.min} a {passwordLimits.max} caracteres.</p>
      <fieldset disabled={saving} className="account-fields">
        <legend>Nova senha</legend>
        <label>Nova senha
          <input type="password" name="new-password" required minLength={passwordLimits.min} maxLength={passwordLimits.max}
            autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>Confirmar nova senha
          <input type="password" name="confirm-password" required minLength={passwordLimits.min} maxLength={passwordLimits.max}
            autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </label>
      </fieldset>
      {(problem || error) && <p role="alert">{problem || error}</p>}
      {success && !problem && !error && <p role="status" className="account-success">{success}</p>}
      <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Alterando senha…' : 'Alterar senha'}</button>
    </form>
  )
}
