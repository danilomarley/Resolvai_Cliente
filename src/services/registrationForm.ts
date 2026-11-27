import type { CompleteRegistration } from './accountApi'

export type ContactType = CompleteRegistration['contato']['tipo']

export const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export const digits = (value: string) => value.replace(/\D/g, '')

export const maskCpf = (value: string) => digits(value).slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d)/, '$1.$2')
  .replace(/(\d{3})(\d{1,2})$/, '$1-$2')

export const maskCep = (value: string) => {
  const d = digits(value).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export const maskPhone = (value: string) => {
  const d = digits(value).slice(0, 11)
  if (d.length < 3) return d
  const split = d.length > 10 ? 7 : 6
  return `(${d.slice(0, 2)}) ${d.slice(2, split)}${d.length > split ? `-${d.slice(split)}` : ''}`
}

// DDD de 11 a 99; celular (11 dígitos) começa com 9.
export const isValidPhone = (value: string) => {
  const d = digits(value)
  return /^[1-9][1-9]/.test(d) && (d.length === 10 || (d.length === 11 && d[2] === '9'))
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export type RegistrationFormValues = {
  name: string; cpf: string; cep: string; logradouro: string; numero: string; complemento: string
  bairro: string; cidade: string; estado: string; contactType: ContactType; contactValue: string
}

export const emptyRegistration = (name = ''): RegistrationFormValues => ({
  name, cpf: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
  contactType: 'whatsapp', contactValue: '',
})

/** Valida o formulário e monta o corpo enviado à API; devolve a mensagem do primeiro problema encontrado. */
export function buildRegistration(form: RegistrationFormValues): { payload: CompleteRegistration } | { error: string } {
  const emailContact = form.contactType === 'email_alt'
  if (!form.name.trim()) return { error: 'Informe seu nome completo.' }
  if (digits(form.cpf).length !== 11) return { error: 'Informe um CPF com 11 dígitos.' }
  if (digits(form.cep).length !== 8) return { error: 'Informe um CEP com 8 dígitos.' }
  if (!form.logradouro.trim() || !form.numero.trim() || !form.bairro.trim() || !form.cidade.trim())
    return { error: 'Preencha logradouro, número, bairro e cidade.' }
  if (!states.includes(form.estado.toUpperCase())) return { error: 'Selecione o estado.' }
  if (emailContact ? !isEmail(form.contactValue.trim()) : !isValidPhone(form.contactValue))
    return { error: emailContact ? 'Informe um e-mail alternativo válido.' : 'Informe um telefone válido com DDD, por exemplo (85) 99999-9999.' }
  return {
    payload: {
      name: form.name.trim(),
      cpf: digits(form.cpf),
      endereco: {
        logradouro: form.logradouro.trim(),
        numero: form.numero.trim(),
        ...(form.complemento.trim() ? { complemento: form.complemento.trim() } : {}),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.toUpperCase(),
        cep: digits(form.cep),
      },
      contato: { tipo: form.contactType, valor: emailContact ? form.contactValue.trim().toLowerCase() : digits(form.contactValue) },
    },
  }
}
