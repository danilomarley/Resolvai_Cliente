import { Link } from 'react-router-dom'
import './NotFound.css'

/** Endereços que não existem no app (rota coringa). */
export function NotFound() {
  return (
    <main className="not-found" id="main">
      <p className="eyebrow">ERRO 404</p>
      <h1>Página não encontrada</h1>
      <p>O endereço que você acessou não existe ou foi movido.</p>
      <Link className="button button-primary" to="/">Ir para o início</Link>
    </main>
  )
}
