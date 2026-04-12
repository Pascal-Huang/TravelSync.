// ── Domain types ──────────────────────────────────────────────────────────

export interface PlanDetails {
  name:     string
  location: string
  dates:    string
}

export interface IdeaItem {
  id:          string   // crypto.randomUUID()
  text:        string
  budget:      '$' | '$$' | '$$$'
  dealbreaker: string   // empty string if none
}

// The four screens of the app flow
export type Screen = 'setup' | 'sandbox' | 'draft' | 'success'
