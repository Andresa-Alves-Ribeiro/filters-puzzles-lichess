export type RatingTone = 'low' | 'mid' | 'high' | 'top'

export function ratingTone(rating: number): RatingTone {
  if (rating >= 2000) return 'top'
  if (rating >= 1600) return 'high'
  if (rating >= 1200) return 'mid'
  return 'low'
}
