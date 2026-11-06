import { Link } from 'react-router-dom'
import { isUuid } from '../services/dashboardApi'

// Compartilhado com a comparação de propostas quando a #87 estiver integrada.
export function ProviderProfileLink({ providerId, name }: { providerId: string; name: string }) {
  return isUuid(providerId) ? <Link className="button button-secondary" to={`/prestadores/${providerId}`} aria-label={`Ver perfil de ${name}`}>Ver perfil do prestador</Link> : null
}
