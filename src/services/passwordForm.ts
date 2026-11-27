/** Limites da nova senha: os mesmos da API (8 a 128 caracteres). */
export const passwordLimits = { min: 8, max: 128 }

/** Confere a nova senha e a confirmação antes de enviar; devolve a mensagem do problema ou texto vazio. */
export function validateNewPassword(password: string, confirmation: string): string {
  if (password.length < passwordLimits.min) return `A nova senha precisa ter pelo menos ${passwordLimits.min} caracteres.`
  if (password.length > passwordLimits.max) return `A nova senha pode ter no máximo ${passwordLimits.max} caracteres.`
  if (password !== confirmation) return 'As senhas não coincidem. Confira e tente novamente.'
  return ''
}
