/**
 * Infers a contextual emoji icon from an idea's text.
 * Swap this out later for an LLM classifier if needed.
 */
export function getIdeaIcon(text: string): string {
  const t = text.toLowerCase()
  if (/sushi|taco|burger|pizza|brunch|dinner|lunch|restaurant|eat|food/.test(t)) return '🍽️'
  if (/drink|bar|cocktail|wine|beer|pub|rooftop/.test(t))                         return '🍹'
  if (/museum|art|gallery|exhibit|tour/.test(t))                                  return '🎨'
  if (/hike|walk|park|outdoor|lake/.test(t))                                      return '🌿'
  if (/hotel|stay|airbnb|check.?in/.test(t))                                      return '🏨'
  if (/concert|music|show|live/.test(t))                                          return '🎵'
  if (/http|www|\.com/.test(t))                                                   return '🔗'
  return '💡'
}

/** Escapes HTML special characters for safe rendering in dangerouslySetInnerHTML.
 *  Used nowhere currently (React escapes by default), but handy to have. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
