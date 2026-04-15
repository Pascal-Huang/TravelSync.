'use client'

import { useState, useCallback, useEffect } from 'react'
import { Screen, PlanDetails, IdeaItem } from '../types'
import type { GeneratedTrip } from '../lib/buildTripOrder'
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
 *  - toastMessage → null = hidden, string = visible
 */

interface InitialShareData {
  binId: string
  planDetails: PlanDetails
  ideas: IdeaItem[]
}

interface HarmonyAppProps {
  /** From `/?share=` — passed from the server page. */
  shareFromUrl?: string
  /** Loaded on the server when opening a share link (avoids client fetch races on Vercel). */
  initialShareData?: InitialShareData | null
}

const EMPTY_PLAN: PlanDetails = { name: '', location: '', dates: '', group: '', budget: '' }

export default function HarmonyApp({ shareFromUrl, initialShareData = null }: HarmonyAppProps) {
  const [screen, setScreen]       = useState<Screen>(() => (initialShareData ? 'sandbox' : 'setup'))
  const [planDetails, setPlan]    = useState<PlanDetails>(
    () => initialShareData?.planDetails ?? EMPTY_PLAN,
  )
  const [ideas, setIdeas]         = useState<IdeaItem[]>(() => initialShareData?.ideas ?? [])
  const [generatedTrip, setGeneratedTrip] = useState<GeneratedTrip | null>(null)
  const [toastMsg, setToastMsg]   = useState<string | null>(null)
  const [shareBinId, setShareBinId] = useState<string | null>(() => initialShareData?.binId ?? null)

  // ── Toast helper ────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2600)
  }, [])

  // Client fallback: server already hydrated `initialShareData` when possible.
  useEffect(() => {
    if (initialShareData) return

    const fromQuery =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('share')?.trim()
        : undefined
    const id = (shareFromUrl?.trim() || fromQuery || '').trim()
    if (!id) return

    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await fetch(`/api/share-bin?binId=${encodeURIComponent(id)}`, {
          cache: 'no-store',
          signal: ac.signal,
        })
        const data = await res.json()
        if (!res.ok) {
          showToast(typeof data.error === 'string' ? data.error : 'Could not open shared trip.')
          return
        }
        const rec = data.record as { planDetails?: PlanDetails; ideas?: IdeaItem[] } | undefined
        if (rec?.planDetails && Array.isArray(rec.ideas)) {
          setPlan(rec.planDetails)
          setIdeas(rec.ideas)
          setShareBinId(id)
          setScreen('sandbox')
          showToast('Loaded shared sandbox — collaborate on the idea board.')
        } else {
          showToast('Shared plan data was missing or invalid.')
        }
      } catch (e) {
        if (e && typeof e === 'object' && (e as { name?: string }).name === 'AbortError') return
        showToast('Could not load shared link.')
      }
    })()
    return () => ac.abort()
  }, [showToast, shareFromUrl, initialShareData])

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

  const handleApprove = (trip: GeneratedTrip) => {
    setGeneratedTrip(trip)
    setScreen('success')
  }

  /** Back to the sandbox so the user can add or change ideas before generating again. */
  const handleReviseInSandbox = () => {
    showToast('Edit your ideas on the board, then tap Generate Itinerary again.')
    setGeneratedTrip(null)
    setScreen('sandbox')
  }

  const handleStartOver = () => {
    setPlan({ name: '', location: '', dates: '', group: '', budget: '' })
    setIdeas([])
    setGeneratedTrip(null)
    setShareBinId(null)
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
          shareBinId={shareBinId}
          onShareBinId={setShareBinId}
          onAddIdea={handleAddIdea}
          onTripReady={setGeneratedTrip}
          onGenerate={handleGenerate}
          showToast={showToast}
        />
      )}

      {screen === 'draft' && (
        <AIDraft
          key="draft"
          planDetails={planDetails}
          ideas={ideas}
          initialTrip={generatedTrip}
          onApprove={handleApprove}
          onRevise={handleReviseInSandbox}
          showToast={showToast}
        />
      )}

      {screen === 'success' && (
        <SuccessState
          key="success"
          planDetails={planDetails}
          trip={generatedTrip!}
          onStartOver={handleStartOver}
          showToast={showToast}
        />
      )}

      <Toast message={toastMsg} />
    </div>
  )
}
