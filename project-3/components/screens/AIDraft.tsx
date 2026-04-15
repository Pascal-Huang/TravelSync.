'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PlanDetails, IdeaItem } from '../../types'
import { buildOrderData, isGeneratedTrip, type GeneratedTrip } from '../../lib/buildTripOrder'
import { ItineraryDayTabBar } from '../ItineraryDayTabBar'
import TopBar from '../TopBar'

interface Props {
  planDetails:  PlanDetails
  ideas:        IdeaItem[]
  initialTrip:  GeneratedTrip | null
  onApprove: (trip: GeneratedTrip) => void
  /** Return to the idea sandbox to add or change ideas before generating again. */
  onRevise: () => void
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

type DayBlock = GeneratedTrip['itinerary'][number]

/** One day’s activities. When `multiDay`, the tab shows the day — left column is time only. */
function dayBlockToStops(day: DayBlock, multiDay: boolean): Stop[] {
  const formattedStops: Stop[] = []
  const colors = ['bg-sage', 'bg-sand', 'bg-terra']

  day.activities.forEach((activity, index) => {
    const dotCls = colors[(day.day + index) % colors.length]
    formattedStops.push({
      when: multiDay ? activity.time : `Day ${day.day}`,
      time: multiDay ? '' : activity.time,
      dotCls,
      hasLine: true,
      name: activity.name,
      desc: activity.description,
      tags: activity.tags.map((tagStr: string) => ({
        label: tagStr,
        cls: 'bg-sage-dim text-sage',
      })),
    })
  })

  if (formattedStops.length > 0) {
    formattedStops[formattedStops.length - 1].hasLine = false
  }
  return formattedStops
}

export default function AIDraft({ planDetails, ideas, initialTrip, onApprove, onRevise, showToast }: Props) {
  const [isLoading, setIsLoading] = useState(!initialTrip)
  const [loadLabel, setLoadLabel] = useState(PHRASES[0])

  const [tripData, setTripData] = useState<GeneratedTrip | null>(initialTrip)
  const [tripTitle, setTripTitle] = useState(initialTrip?.tripName ?? 'Proposed Itinerary ✦')
  const [activeDayIndex, setActiveDayIndex] = useState(0)

  const applyTripJson = useCallback((aiData: GeneratedTrip) => {
    setTripData(aiData)
    setTripTitle(aiData.tripName)
    setActiveDayIndex(0)
  }, [])

  const itineraryDays = tripData?.itinerary
  const multiDay = (itineraryDays?.length ?? 0) > 1
  const itineraryStops = useMemo(() => {
    if (!itineraryDays?.length) return []
    const idx = Math.min(Math.max(0, activeDayIndex), itineraryDays.length - 1)
    return dayBlockToStops(itineraryDays[idx], multiDay)
  }, [itineraryDays, activeDayIndex, multiDay])

  const generateRealTrip = useCallback(async () => {
    setIsLoading(true)

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

              {itineraryDays != null && itineraryDays.length > 1 && (
                <div className="px-[14px] pt-3 pb-0 bg-parchment/40 border-b border-cream-deep">
                  <ItineraryDayTabBar
                    days={itineraryDays}
                    activeIndex={activeDayIndex}
                    onChange={setActiveDayIndex}
                  />
                </div>
              )}

              <div
                role="tabpanel"
                id={
                  itineraryDays?.[activeDayIndex]
                    ? `itinerary-day-panel-${itineraryDays[activeDayIndex].day}`
                    : undefined
                }
                aria-labelledby={
                  itineraryDays?.[activeDayIndex]
                    ? `itinerary-day-tab-${itineraryDays[activeDayIndex].day}`
                    : undefined
                }
              >
              {itineraryStops.map((stop, i) => (
                <div key={i} className="px-[18px] py-[14px] flex items-start gap-3.5 border-b border-cream-deep last:border-b-0">
                  <div className="flex-shrink-0 min-w-[52px]">
                    <div className="text-[0.79rem] font-semibold text-sage">{stop.when}</div>
                    {stop.time ? (
                      <div className="text-[0.65rem] font-semibold uppercase tracking-[0.07em] text-ink-faint mt-0.5">
                        {stop.time}
                      </div>
                    ) : null}
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
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => tripData && onApprove(tripData)} className="flex flex-col items-center gap-[5px] py-4 px-2.5 border-[1.5px] border-cream-deep rounded-panel bg-white font-semibold text-[0.84rem] text-ink-mid shadow-soft transition-all active:scale-[0.95] hover:border-sage hover:bg-sage-dim hover:text-sage">
                  <span className="text-[1.6rem] leading-none">👍</span>
                  Looks Good
                </button>
                <button
                  type="button"
                  onClick={onRevise}
                  className="flex flex-col items-center gap-[5px] py-4 px-2.5 border-[1.5px] border-cream-deep rounded-panel bg-white font-semibold text-[0.84rem] text-ink-mid shadow-soft transition-all active:scale-[0.95] hover:border-sand hover:bg-sand-light hover:text-sand"
                >
                  <span className="text-[1.6rem] leading-none">🔄</span>
                  Revise
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}