'use client'

import { useState, useEffect, useCallback } from 'react'
import { PlanDetails, IdeaItem } from '../../types'
import { buildOrderData, isGeneratedTrip, type GeneratedTrip } from '../../lib/buildTripOrder'
import TopBar from '../TopBar'

interface Props {
  planDetails:  PlanDetails
  ideas:        IdeaItem[]
  initialTrip:  GeneratedTrip | null
  onApprove:    () => void
  onRegenerate: () => void
  showToast:    (msg: string) => void
}

const PHRASES = [
  "AI is synthesizing everyone's ideas…",
  'Weighing group preferences…',
  'Checking dealbreakers & dietary needs…',
  'Balancing budgets across the group…',
  'Finalising the perfect itinerary…',
]

interface Stop {
  when:    string
  time:    string
  dotCls:  string
  hasLine: boolean
  name:    string
  desc:    string
  tags:    { label: string; cls: string }[]
}

function tripJsonToStops(aiData: GeneratedTrip): Stop[] {
  const formattedStops: Stop[] = []
  const colors = ['bg-sage', 'bg-sand', 'bg-terra']

  aiData.itinerary.forEach(day => {
    day.activities.forEach((activity, index) => {
      const dotCls = colors[(day.day + index) % colors.length]
      formattedStops.push({
        when: `Day ${day.day}`,
        time: activity.time,
        dotCls,
        hasLine: true,
        name: activity.description.split('.')[0] || 'Activity',
        desc: activity.description,
        tags: [{ label: day.theme, cls: 'bg-sage-dim text-sage' }],
      })
    })
  })

  if (formattedStops.length > 0) {
    formattedStops[formattedStops.length - 1].hasLine = false
  }
  return formattedStops
}

export default function AIDraft({ planDetails, ideas, initialTrip, onApprove, onRegenerate, showToast }: Props) {
  const [isLoading, setIsLoading] = useState(!initialTrip)
  const [loadLabel, setLoadLabel] = useState(PHRASES[0])

  const [tripTitle, setTripTitle] = useState(initialTrip?.tripName ?? 'Proposed Itinerary ✦')
  const [itineraryStops, setItineraryStops] = useState<Stop[]>(() =>
    initialTrip ? tripJsonToStops(initialTrip) : [],
  )

  const applyTripJson = useCallback((aiData: GeneratedTrip) => {
    setTripTitle(aiData.tripName)
    setItineraryStops(tripJsonToStops(aiData))
  }, [])

  const generateRealTrip = useCallback(async () => {
    setIsLoading(true)
    setItineraryStops([])

    const orderData = buildOrderData(planDetails, ideas)

    try {
      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const aiData = await response.json()
      if (!response.ok || aiData?.error || !isGeneratedTrip(aiData)) {
        showToast(typeof aiData?.error === 'string' ? aiData.error : 'Failed to generate trip. Please try again.')
        return
      }
      applyTripJson(aiData)
    } catch (error) {
      console.error('Failed to fetch AI data:', error)
      showToast('Failed to generate trip. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [planDetails, ideas, showToast, applyTripJson])

  useEffect(() => {
    if (!initialTrip) return
    applyTripJson(initialTrip)
    setIsLoading(false)
  }, [initialTrip, applyTripJson])

  useEffect(() => {
    if (initialTrip) return

    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % PHRASES.length
      setLoadLabel(PHRASES[idx])
    }, 1500)

    void generateRealTrip()

    return () => clearInterval(interval)
  }, [initialTrip, generateRealTrip])

  const handleRegenerate = () => {
    onRegenerate()
  }

  return (
    <section className="flex flex-col w-full max-w-[480px] min-h-[100dvh] px-5 pb-[52px] relative z-[1] animate-fade-up">
      <TopBar step="Step 2 / 3" />

      <div className="flex-1 flex flex-col">

        {/* ── Loading pane ────────────────────────────────────── */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-10 text-center">
            <div className="pulse-ring w-[66px] h-[66px] rounded-full bg-sage-dim flex items-center justify-center">
              <span className="text-[1.65rem]">✦</span>
            </div>
            <div>
              <p className="text-[0.9rem] text-ink-mid font-medium animate-load-pulse">
                {loadLabel}
              </p>
              <div className="flex gap-1.5 justify-center mt-2">
                <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce-dot" />
                <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce-dot [animation-delay:.2s]" />
                <span className="w-1.5 h-1.5 bg-sage-light rounded-full animate-bounce-dot [animation-delay:.4s]" />
              </div>
            </div>
          </div>
        )}

        {/* ── Draft result ─────────────────────────────────────── */}
        {!isLoading && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <div>
              <h2 className="font-display text-[clamp(1.9rem,7.5vw,2.6rem)] leading-[1.13] tracking-[-0.02em] text-ink mb-2">
                {tripTitle}
              </h2>
            </div>

            <div className="bg-white border-[1.5px] border-cream-deep rounded-panel overflow-hidden shadow-float">
              <div className="bg-ink text-white px-[18px] py-[13px] flex items-center gap-2.5">
                <span className="text-[0.95rem]" aria-hidden="true">🗓️</span>
                <span className="text-[0.82rem] font-semibold tracking-[0.05em] uppercase">
                  Proposed Itinerary
                </span>
              </div>

              {/* Loop over our REAL AI stops instead of the hardcoded STOPS */}
              {itineraryStops.map((stop, i) => (
                <div key={i} className="px-[18px] py-[14px] flex items-start gap-3.5 border-b border-cream-deep last:border-b-0">
                  <div className="flex-shrink-0 min-w-[52px]">
                    <div className="text-[0.79rem] font-semibold text-sage">{stop.when}</div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.07em] text-ink-faint mt-0.5">
                      {stop.time}
                    </div>
                  </div>

                  <div className="flex flex-col items-center pt-1 flex-shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${stop.dotCls}`} />
                    {stop.hasLine && <div className="flex-1 w-px bg-cream-deep min-h-[22px] mt-1" />}
                  </div>

                  <div className="flex-1 pb-1">
                    <div className="text-[0.96rem] font-semibold text-ink leading-[1.3]">
                      {stop.name}
                    </div>
                    <div className="text-[0.8rem] text-ink-mid mt-0.5 leading-relaxed">
                      {stop.desc}
                    </div>
                    <div className="flex gap-[5px] flex-wrap mt-[7px]">
                      {stop.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className={`text-[0.66rem] font-semibold tracking-[0.04em] uppercase px-2 py-[2px] rounded-full ${tag.cls}`}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={onApprove} className="flex flex-col items-center gap-[5px] py-4 px-2.5 border-[1.5px] border-cream-deep rounded-panel bg-white font-semibold text-[0.84rem] text-ink-mid shadow-soft transition-all active:scale-[0.95] hover:border-sage hover:bg-sage-dim hover:text-sage">
                  <span className="text-[1.6rem] leading-none">👍</span>
                  Looks Good
                </button>
                {/* Updated this to call our new handleRegenerate function! */}
                <button onClick={handleRegenerate} className="flex flex-col items-center gap-[5px] py-4 px-2.5 border-[1.5px] border-cream-deep rounded-panel bg-white font-semibold text-[0.84rem] text-ink-mid shadow-soft transition-all active:scale-[0.95] hover:border-sand hover:bg-sand-light hover:text-sand">
                  <span className="text-[1.6rem] leading-none">🔄</span>
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}