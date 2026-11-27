import { ApiError, apiRequest } from './api'
import { isUuid } from './dashboardApi'

export type Review = { orderId: string; providerId: string; rating: number; comment?: string; createdAt: string }
export type ReviewSummary = { count: number; averageRating: number | null }
const invalid = () => new ApiError(502, 'A API retornou uma avaliação inválida.')
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
export const validRating = (rating: unknown): rating is number => typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5

export function parseReview(value: unknown): Review {
  if (!object(value) || typeof value.orderId !== 'string' || !isUuid(value.orderId)
    || typeof value.providerId !== 'string' || !isUuid(value.providerId) || !validRating(value.rating)
    || typeof value.createdAt !== 'string' || Number.isNaN(Date.parse(value.createdAt))
    || value.comment !== undefined && (typeof value.comment !== 'string' || value.comment.length > 2000)) throw invalid()
  return value as Review
}
export function parseReviewSummary(value: unknown): ReviewSummary {
  if (!object(value) || !Number.isSafeInteger(value.count) || Number(value.count) < 0
    || (value.count === 0 ? value.averageRating !== null
      : typeof value.averageRating !== 'number' || !Number.isFinite(value.averageRating) || value.averageRating < 1 || value.averageRating > 5)) throw invalid()
  return value as ReviewSummary
}
function reviewPath(id: string) {
  if (!isUuid(id)) throw new ApiError(404, 'Pedido não encontrado.')
  return `/api/v1/orders/${id}/review`
}
export async function getReview(id: string, token: string, signal?: AbortSignal) {
  const value = await apiRequest(reviewPath(id), { token, signal })
  if (value === null) return null
  const review = parseReview(value)
  if (review.orderId.toLowerCase() !== id.toLowerCase()) throw invalid()
  return review
}
export async function submitReview(id: string, token: string, rating: number, comment: string) {
  if (!validRating(rating) || comment.trim().length > 2000) throw new ApiError(400, 'Escolha de 1 a 5 estrelas e escreva até 2000 caracteres.')
  const review = parseReview(await apiRequest(reviewPath(id), { token, method: 'POST', body: { rating, comment: comment.trim() || undefined } }))
  if (review.orderId.toLowerCase() !== id.toLowerCase()) throw invalid()
  return review
}
export async function getReviewSummary(token: string, signal?: AbortSignal) {
  return parseReviewSummary(await apiRequest('/api/v1/users/me/reviews/summary', { token, signal }))
}
