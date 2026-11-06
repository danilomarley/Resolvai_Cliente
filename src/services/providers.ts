import { ApiError, apiRequest } from './api'
import { isUuid } from './dashboardApi'

export type PublicProvider = {
  id: string; name: string; photoUrl: string | null; categories: string[] | null; region: string | null
  completedServices: number; reviewsAvailable: boolean; averageRating: number | null
  reviews: { rating: number; comment?: string; createdAt: string }[]
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const invalid = () => new ApiError(502, 'A API retornou um perfil de prestador inválido.')
export function parsePublicProvider(value: unknown): PublicProvider {
  if (!object(value) || typeof value.id !== 'string' || !isUuid(value.id) || typeof value.name !== 'string' || !value.name.trim()
    || value.photoUrl !== null && (typeof value.photoUrl !== 'string' || !/^https:\/\//i.test(value.photoUrl))
    || value.categories !== null && (!Array.isArray(value.categories) || !value.categories.every(c => typeof c === 'string'))
    || value.region !== null && typeof value.region !== 'string'
    || !Number.isSafeInteger(value.completedServices) || Number(value.completedServices) < 0 || typeof value.reviewsAvailable !== 'boolean'
    || value.averageRating !== null && (typeof value.averageRating !== 'number' || !Number.isFinite(value.averageRating) || value.averageRating < 1 || value.averageRating > 5)
    || !Array.isArray(value.reviews) || value.reviews.length > 5 || !value.reviews.every(r => object(r)
      && Number.isInteger(r.rating) && Number(r.rating) >= 1 && Number(r.rating) <= 5
      && (r.comment === undefined || typeof r.comment === 'string') && typeof r.createdAt === 'string' && !Number.isNaN(Date.parse(r.createdAt)))
    || value.reviewsAvailable === false && (value.averageRating !== null || value.reviews.length !== 0)) throw invalid()
  return value as PublicProvider
}
export async function getPublicProvider(id: string, token: string, signal?: AbortSignal) {
  if (!isUuid(id)) throw new ApiError(404, 'Prestador não encontrado.')
  const provider = parsePublicProvider(await apiRequest(`/api/v1/providers/${id}/public-profile`, { token, signal }))
  if (provider.id.toLowerCase() !== id.toLowerCase()) throw invalid()
  return provider
}
