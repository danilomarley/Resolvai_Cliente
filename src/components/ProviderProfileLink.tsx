import { Link, useLocation } from 'react-router-dom'
import { isUuid } from '../services/dashboardApi'

// Compartilhado com a comparação de propostas quando a #87 estiver integrada.
export function ProviderProfileLink({ providerId, name }: { providerId: string; name: string }) {
  const location = useLocation()
  return isUuid(providerId) ? <Link className="button button-secondary" to={`/prestadores/${providerId}`} state={{ from: location.pathname }} aria-label={`Ver perfil de ${name}`}>Ver perfil do prestador</Link> : null
}
