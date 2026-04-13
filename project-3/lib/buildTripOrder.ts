import type { IdeaItem, PlanDetails } from '../types'

/** JSON shape returned by `/api/generate-trip` (Gemini). */
export interface GeneratedTrip {
  tripName: string
  itinerary: {
    day: number
    theme: string
    activities: { time: string; description: string }[]
  }[]
}

export function isGeneratedTrip(x: unknown): x is GeneratedTrip {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.tripName === 'string' && Array.isArray(o.itinerary)
}

/** Best-effort day count from CreatorSetup's free-text dates (e.g. "Aug 12–14", "3 days"). */
export function inferTripDays(dates: string): number {
  const d = dates.trim()
  if (!d) return 3
  const dayWord = d.match(/(\d+)\s*days?/i)
  if (dayWord) return Math.min(14, Math.max(1, parseInt(dayWord[1], 10)))
  if (/\d+\s*hours?/i.test(d)) return 1
  const span = d.match(/(\d{1,2})\s*[–-]\s*(\d{1,2})/)
  if (span) {
    const a = parseInt(span[1], 10)
    const b = parseInt(span[2], 10)
    if (b >= a && b - a <= 30) return Math.min(14, Math.max(1, b - a + 1))
  }
  const n = parseInt(d.match(/\b(\d{1,2})\b/)?.[1] ?? '', 10)
  if (n >= 1 && n <= 14) return n
  return 3
}

/** Builds the single `ideas` string the generate-trip API sends to the model. */
export function buildIdeasPayload(
  plan: PlanDetails,
  board: IdeaItem[],
  draftText: string,
  draftBudget: string,
  draftDealbreaker: string,
): string {
  const lines: string[] = []
  if (plan.name.trim()) lines.push(`Trip name: ${plan.name.trim()}`)
  if (plan.dates.trim()) lines.push(`Dates / duration: ${plan.dates.trim()}`)
  if (lines.length) lines.push('')
  board.forEach((idea, i) => {
    let row = `${i + 1}. ${idea.text} [max budget: ${idea.budget}]`
    if (idea.dealbreaker.trim()) row += ` [dealbreakers: ${idea.dealbreaker.trim()}]`
    lines.push(row)
  })
  const draft = draftText.trim()
  if (draft) {
    if (board.length) lines.push('')
    lines.push(
      `${board.length ? 'Also typed in the form (not yet on the board)' : 'Idea from the form'}: ${draft} [max budget: ${draftBudget}]` +
        (draftDealbreaker.trim() ? ` [dealbreakers: ${draftDealbreaker.trim()}]` : ''),
    )
  }
  return lines.join('\n')
}

export interface DraftFields {
  text: string
  budget: string
  dealbreaker: string
}

/** Body for `POST /api/generate-trip` — same shape from Sandbox (with draft) and Draft (board only). */
export function buildOrderData(
  plan: PlanDetails,
  ideas: IdeaItem[],
  draft?: DraftFields,
) {
  const d = draft ?? { text: '', budget: '$$', dealbreaker: '' }
  return {
    location: plan.location.trim() || 'your destination',
    days: inferTripDays(plan.dates),
    ideas: buildIdeasPayload(plan, ideas, d.text, d.budget, d.dealbreaker),
  }
}
