'use client'

import { useState, useCallback } from 'react'
import { Screen, PlanDetails, IdeaItem } from '../types'
import CreatorSetup from './screens/CreatorSetup'
import IdeaSandbox  from './screens/IdeaSandbox'
import AIDraft      from './screens/AIDraft'
import SuccessState from './screens/SuccessState'
import Toast        from './Toast'

/**
 * HarmonyApp is the 'use client' boundary.
 * It owns the app-level state and passes down only what each screen needs.
 *
 * State owned here:
 *  - screen       → which of the 4 screens is visible
 *  - planDetails  → set by CreatorSetup, read by all subsequent screens
 *  - ideas        → accumulated IdeaItems from IdeaSandbox
 *  - draftKey     → incrementing key forces AIDraft to re-mount on Regenerate
 *  - toastMessage → null = hidden, string = visible
 */
export default function HarmonyApp() {
  const [screen, setScreen]       = useState<Screen>('setup')
  const [planDetails, setPlan]    = useState<PlanDetails>({ name: '', location: '', dates: '' })
  const [ideas, setIdeas]         = useState<IdeaItem[]>([])
  const [draftKey, setDraftKey]   = useState(0)
  const [toastMsg, setToastMsg]   = useState<string | null>(null)

  // ── Toast helper ────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2600)
  }, [])

  // ── Navigation handlers ─────────────────────────────────────
  const handleSetupSubmit = (details: PlanDetails) => {
    setPlan(details)
    showToast('✓ Invite link copied to clipboard!')
    setScreen('sandbox')
  }

  const handleAddIdea = (idea: IdeaItem) => {
    setIdeas(prev => [...prev, idea])
  }

  const handleGenerate = () => {
    setScreen('draft')
  }

  const handleApprove = () => {
    setScreen('success')
  }

  /**
   * Incrementing draftKey forces React to unmount + remount <AIDraft>,
   * re-triggering its useEffect loading sequence — no extra prop needed.
   */
  const handleRegenerate = () => {
    showToast('Generating a fresh itinerary…')
    setDraftKey(k => k + 1)
  }

  const handleStartOver = () => {
    setPlan({ name: '', location: '', dates: '' })
    setIdeas([])
    setDraftKey(0)
    setScreen('setup')
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    // Outer wrapper centres screens and keeps the paper texture behind everything
    <div className="flex flex-col items-center min-h-screen relative">
      {/*
       * Conditional rendering (not CSS hide/show) means each screen mounts fresh,
       * so animate-fade-up plays every time a screen becomes active.
       */}
      {screen === 'setup' && (
        <CreatorSetup
          key="setup"
          onSubmit={handleSetupSubmit}
        />
      )}

      {screen === 'sandbox' && (
        <IdeaSandbox
          key="sandbox"
          planDetails={planDetails}
          ideas={ideas}
          onAddIdea={handleAddIdea}
          onGenerate={handleGenerate}
          showToast={showToast}
        />
      )}

      {screen === 'draft' && (
        <AIDraft
          key={draftKey}           // re-mount triggers fresh loading animation
          planDetails={planDetails}
          onApprove={handleApprove}
          onRegenerate={handleRegenerate}
          showToast={showToast}
        />
      )}

      {screen === 'success' && (
        <SuccessState
          key="success"
          planDetails={planDetails}
          onStartOver={handleStartOver}
          showToast={showToast}
        />
      )}

      <Toast message={toastMsg} />
    </div>
  )
}
