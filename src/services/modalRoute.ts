import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const param = 'modal'
const nextParam = 'next'
/** O que fazer ao fechar o modal com sucesso; só valores conhecidos são aceitos. */
const nextActions = ['criar-pedido'] as const
export type NextAction = (typeof nextActions)[number]

/** Lê o modal da query string; nomes fora da lista permitida são ignorados. */
export function readModal<T extends string>(search: string, allowed: readonly T[]): T | null {
  const value = new URLSearchParams(search).get(param)
  return allowed.find((name) => name === value) ?? null
}

export function readNext(search: string): NextAction | null {
  const value = new URLSearchParams(search).get(nextParam)
  return nextActions.find((action) => action === value) ?? null
}

/**
 * Devolve a query string com o modal definido (ou removido, com null), preservando os demais
 * parâmetros. A intenção `next` só existe junto com um modal e sai com ele.
 */
export function searchWithModal(search: string, name: string | null, next?: NextAction): string {
  const params = new URLSearchParams(search)
  params.delete(nextParam)
  if (name) {
    params.set(param, name)
    if (next) params.set(nextParam, next)
  } else params.delete(param)
  const text = params.toString()
  return text ? `?${text}` : ''
}

type ModalState = { modalOpened?: boolean }

/**
 * Mantém o modal aberto na URL (?modal=nome): recarregar a página reabre o modal e o botão
 * "voltar" do navegador fecha. Abrir empilha uma entrada no histórico; fechar volta uma entrada
 * quando fomos nós que a empilhamos e, caso contrário (link direto), apenas remove o parâmetro.
 */
export function useModalRoute<T extends string>(allowed: readonly T[]) {
  const location = useLocation()
  const navigate = useNavigate()
  const current = readModal(location.search, allowed)
  const next = current ? readNext(location.search) : null

  const open = useCallback(
    (name: T, nextAction?: NextAction) =>
      navigate(
        { pathname: location.pathname, search: searchWithModal(location.search, name, nextAction) },
        { state: { ...(location.state as object | null), modalOpened: true } satisfies ModalState },
      ),
    [navigate, location.pathname, location.search, location.state],
  )

  /** Troca o modal aberto por outro sem empilhar histórico (ex.: cadastro concluído → criar pedido). */
  const swap = useCallback(
    (name: T, nextAction?: NextAction) =>
      navigate(
        { pathname: location.pathname, search: searchWithModal(location.search, name, nextAction) },
        { replace: true, state: { ...(location.state as object | null), modalOpened: true } satisfies ModalState },
      ),
    [navigate, location.pathname, location.search, location.state],
  )

  const close = useCallback(() => {
    if ((location.state as ModalState | null)?.modalOpened) navigate(-1)
    else
      navigate(
        { pathname: location.pathname, search: searchWithModal(location.search, null) },
        { replace: true, state: location.state },
      )
  }, [navigate, location.pathname, location.search, location.state])

  return { current, next, open, swap, close }
}
