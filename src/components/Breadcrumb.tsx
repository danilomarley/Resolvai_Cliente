import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import type { Crumb } from '../services/breadcrumb'

/** Trilha "Meu espaço > ... > tela atual": a tela atual é o último item e não tem link. */
export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="breadcrumb-nav" aria-label="Você está em">
      <ol className="breadcrumb-trail">
        <li><Link to="/">Meu espaço</Link></li>
        {crumbs.map((crumb, index) => (
          <li key={`${index}-${crumb.label}`}>
            <Icon name="chevron" size={13} />
            {crumb.to && index < crumbs.length - 1
              ? <Link to={crumb.to}>{crumb.label}</Link>
              : <strong aria-current="page">{crumb.label}</strong>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
