'use client'

import { PlanDetails } from '../../types'
import TopBar from '../TopBar'

interface Props {
  planDetails: PlanDetails
  onStartOver: () => void
  showToast:   (msg: string) => void
}

// ── Confirmed itinerary data ────────────────────────────────────────────────
// Replace with a prop passed down from AIDraft once you wire up a real API.

interface FinalStop {
  num:       number
  numCls:    string    // Tailwind bg-* for the numbered circle
  accentFrom: string   // Tailwind from-* for the top accent gradient
  accentTo:   string   // Tailwind to-* (use arbitrary value for one-off colours)
  when:      string
  name:      string
  desc:      string
  icon:      string
}

const FINAL_STOPS: FinalStop[] = [
  {
    num: 1, numCls: 'bg-sage',
    accentFrom: 'from-sage', accentTo: 'to-sage-light',
    when: 'Day 1 · 12:00 PM — Logistics',
    name: 'Arrival & Check-In',
    desc: 'Settle in, sync up, low-key start.',
    icon: '🏨',
  },
  {
    num: 2, numCls: 'bg-sand',
    accentFrom: 'from-sand', accentTo: 'to-[#d4b896]',
    when: 'Day 1 · 2:00 PM — Outdoor',
    name: 'Lakefront Walk',
    desc: 'Accessible scenic route, no stairs.',
    icon: '🌿',
  },
  {
    num: 3, numCls: 'bg-terra',
    accentFrom: 'from-terra', accentTo: 'to-[#cc8a6a]',
    when: 'Day 1 · 7:00 PM — Dinner',
    name: 'El Camino Kitchen',
    desc: 'Street tacos & cocktails. Dealbreaker-safe.',
    icon: '🌮',
  },
  {
    num: 4, numCls: 'bg-sage',
    accentFrom: 'from-sage', accentTo: 'to-sand',
    when: 'Day 2 · 10:00 AM — Brunch',
    name: 'The Publican',
    desc: 'Communal tables, all dietary needs covered.',
    icon: '🍳',
  },
  {
    num: 5, numCls: 'bg-ink-mid',
    accentFrom: 'from-ink-mid', accentTo: 'to-[#7a7875]',
    when: 'Day 2 · 1:00 PM — Culture',
    name: 'Art Institute of Chicago',
    desc: 'High group consensus. Fully accessible.',
    icon: '🎨',
  },
]

// ── Screen component ────────────────────────────────────────────────────────

export default function SuccessState({ planDetails, onStartOver, showToast }: Props) {

  const handleCopyLink = () => {
    const url = `https://harmony.app/p/${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied! 🔗'))
    } else {
      showToast('Link copied! 🔗')
    }
  }

  const handleShareText = () => {
    const stops = FINAL_STOPS.map(s => `${s.num}. ${s.when} — ${s.name}`).join('\n')
    const msg   = `✅ ${planDetails.name} — Plan Locked!\n📍 ${planDetails.location}  ·  🗓️ ${planDetails.dates}\n\n${stops}\n\nSee you there! 🎉`
    if (navigator.share) {
      navigator.share({ title: planDetails.name, text: msg })
    } else {
      navigator.clipboard?.writeText(msg)
      showToast('Plan text copied! 💬')
    }
  }

  return (
    <section
      className="flex flex-col w-full max-w-[480px] min-h-[100dvh] px-5 pb-[52px] relative z-[1] animate-fade-up"
      role="main"
      aria-labelledby="s4-title"
      aria-live="polite"
    >
      <TopBar step="Done ✓" />

      <div className="flex-1 flex flex-col gap-5">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="text-center pt-6 pb-1">
          {/* Lock badge — spring animation via animate-lock-pop */}
          <div
            className="w-[66px] h-[66px] bg-sage rounded-full flex items-center justify-center mx-auto mb-4 text-[1.65rem] shadow-[0_4px_18px_rgba(122,158,142,0.28)] animate-lock-pop"
            role="img"
            aria-label="Plan locked"
          >
            🔒
          </div>
          <h2
            id="s4-title"
            className="font-display text-[clamp(1.55rem,6.5vw,2rem)] leading-[1.13] tracking-[-0.02em] text-ink mb-2"
          >
            Plan Locked!
          </h2>
          <p className="text-[0.9rem] text-ink-mid leading-relaxed max-w-[270px] mx-auto">
            A balanced itinerary where everyone's ideas were heard.
          </p>
        </div>

        {/* Celebration strip */}
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {(['🎉', '✨', '🌟', '✨', '🎉'] as const).map((emoji, i) => (
            <span
              key={i}
              className="text-[1.05rem] animate-cel-wiggle"
              style={{ animationDelay: `${i * 0.14}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* ── Confirmed itinerary ────────────────────────────────── */}
        <div role="region" aria-label="Final confirmed itinerary">
          <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-ink-faint mb-2">
            Confirmed Itinerary
          </p>

          <div className="flex flex-col gap-[9px]">
            {FINAL_STOPS.map((stop, i) => (
              <article
                key={stop.num}
                className="bg-white border border-cream-deep rounded-panel overflow-hidden shadow-soft animate-fade-up"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                {/* Colour accent bar */}
                <div
                  className={`h-[3px] bg-gradient-to-r ${stop.accentFrom} ${stop.accentTo}`}
                  aria-hidden="true"
                />
                <div className="flex items-start gap-3 p-[13px] px-[15px]">
                  {/* Numbered circle */}
                  <div
                    className={`w-[28px] h-[28px] rounded-full flex items-center justify-center text-[0.78rem] font-bold text-white flex-shrink-0 ${stop.numCls}`}
                    aria-hidden="true"
                  >
                    {stop.num}
                  </div>
                  {/* Info */}
                  <div className="flex-1">
                    <div className="text-[0.72rem] font-semibold text-ink-faint uppercase tracking-[0.06em]">
                      {stop.when}
                    </div>
                    <div className="text-[0.97rem] font-semibold text-ink my-0.5">
                      {stop.name}
                    </div>
                    <div className="text-[0.79rem] text-ink-mid leading-relaxed">
                      {stop.desc}
                    </div>
                  </div>
                  {/* Icon */}
                  <span className="text-[1.3rem] flex-shrink-0 mt-px" aria-hidden="true">
                    {stop.icon}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ── Share row ──────────────────────────────────────────── */}
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.1em] uppercase text-ink-faint mb-2">
            Share with the group
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-4 py-[10px] rounded-card bg-transparent text-ink border-[1.5px] border-cream-deep font-semibold text-[0.83rem] transition-all active:scale-[0.97] hover:bg-parchment hover:border-ink-faint [-webkit-tap-highlight-color:transparent]"
              aria-label="Copy invite link"
            >
              🔗 Copy Link
            </button>
            <button
              onClick={handleShareText}
              className="flex items-center justify-center gap-2 px-4 py-[10px] rounded-card bg-transparent text-ink border-[1.5px] border-cream-deep font-semibold text-[0.83rem] transition-all active:scale-[0.97] hover:bg-parchment hover:border-ink-faint [-webkit-tap-highlight-color:transparent]"
              aria-label="Share as text message"
            >
              💬 Share Text
            </button>
          </div>
        </div>

        {/* Start over */}
        <button
          onClick={onStartOver}
          className="btn-primary bg-ink text-white shadow-[0_2px_10px_rgba(44,43,40,0.16)] hover:bg-[#1c1b18]"
          aria-label="Start a new plan"
        >
          Plan Something New ↗
        </button>
      </div>
    </section>
  )
}
