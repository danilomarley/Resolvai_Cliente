import { useEffect, useRef, useState } from 'react'
import { ApiError } from './api'
import { completeRegistration, type CompleteRegistration } from './accountApi'

/** Envia a finalização de cadastro uma única vez por vez e cancela o envio ao desmontar. */
export function useFinalizeRegistration(token: string | null, customerId: string | null, onDone: () => void) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController>()
  useEffect(() => () => controller.current?.abort(), [])

  async function submit(payload: CompleteRegistration) {
    if (controller.current) return
    if (!token || !customerId) { setError('Sua sessão expirou. Entre novamente.'); return }
    const current = new AbortController()
    controller.current = current
    setSaving(true)
    setError('')
    try {
      await completeRegistration(payload, token, customerId, current.signal)
      onDone()
    } catch (failure) {
      if (!current.signal.aborted) setError(failure instanceof ApiError ? failure.message : 'Não foi possível finalizar o cadastro. Tente novamente.')
    } finally {
      if (!current.signal.aborted) { setSaving(false); controller.current = undefined }
    }
  }

  return { saving, error, submit }
}
