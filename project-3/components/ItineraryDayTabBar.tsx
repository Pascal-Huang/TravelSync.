'use client'

import type { GeneratedTrip } from '@/lib/buildTripOrder'

type DayBlock = GeneratedTrip['itinerary'][number]

export function ItineraryDayTabBar({
  days,
  activeIndex,
  onChange,
}: {
  days: DayBlock[]
  activeIndex: number
  onChange: (index: number) => void
}) {
  if (days.length <= 1) return null

  return (
    <div className="mb-3 -mx-0.5">
      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory"
        role="tablist"
        aria-label="Switch itinerary day"
      >
        {days.map((d, i) => {
          const selected = i === activeIndex
          return (
            <button
              key={d.day}
              type="button"
              role="tab"
              id={`itinerary-day-tab-${d.day}`}
              aria-selected={selected}
              aria-controls={`itinerary-day-panel-${d.day}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(i)}
              className={[
                'flex-shrink-0 snap-start min-w-[76px] max-w-[148px] px-3 py-2 rounded-card text-left transition-all border',
                selected
                  ? 'bg-sage-dim border-sage text-sage shadow-soft'
                  : 'bg-white border-cream-deep text-ink-mid hover:border-ink-faint',
              ].join(' ')}
            >
              <span className="block text-[0.78rem] font-bold tracking-tight">Day {d.day}</span>
              <span className="block text-[0.65rem] font-medium leading-snug mt-0.5 truncate opacity-90">
                {d.theme}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
