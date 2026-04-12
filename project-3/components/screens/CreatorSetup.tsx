'use client'

import { useState } from 'react'
import { PlanDetails } from '../../types'
import TopBar from '../TopBar'

interface Props {
  onSubmit: (details: PlanDetails) => void
}

// ── Small internal helpers ──────────────────────────────────────────────────

/** Divider line that trails a section label — mirrors the CSS ::after trick */
function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-[14px]">
      <span className="text-[0.7rem] font-semibold tracking-[0.09em] uppercase text-ink-faint whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-cream-deep" />
    </div>
  )
}

interface FieldProps {
  id:          string
  label:       string
  value:       string
  onChange:    (v: string) => void
  placeholder: string
  maxLength?:  number
  className?:  string
}

function Field({ id, label, value, onChange, placeholder, maxLength, className = '' }: FieldProps) {
  return (
    <div className={`last:mb-0 mb-[13px] ${className}`}>
      <label
        htmlFor={id}
        className="block text-[0.74rem] font-semibold tracking-[0.05em] uppercase text-ink-mid mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        className="input-field"
      />
    </div>
  )
}

// ── Screen component ────────────────────────────────────────────────────────

export default function CreatorSetup({ onSubmit }: Props) {
  const [name,     setName]     = useState('')
  const [location, setLocation] = useState('')
  const [dates,    setDates]    = useState('')

  const handleSubmit = () => {
    onSubmit({
      name:     name.trim()     || 'My Plan',
      location: location.trim() || 'Location TBD',
      dates:    dates.trim()    || 'Dates TBD',
    })
  }

  const FEATURES = ['🗳️ Group voting', '🚫 Dealbreaker aware', '✦ AI synthesis']

  return (
    <section
      className="flex flex-col w-full max-w-[480px] min-h-[100dvh] px-5 pb-[52px] relative z-[1] animate-fade-up"
      role="main"
      aria-labelledby="s1-title"
    >
      <TopBar />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center gap-6 py-2 pb-7">

        {/* Copy */}
        <div className="flex flex-col gap-3">
          <h1
            id="s1-title"
            className="font-display text-[clamp(1.9rem,7.5vw,2.6rem)] leading-[1.13] tracking-[-0.02em] text-ink max-w-[310px]"
          >
            Collaborative<br />planning,<br />
            {/* DM Serif Display italic + terra accent */}
            <em className="text-terra">perfected.</em>
          </h1>
          <p className="text-[0.9rem] text-ink-mid leading-relaxed">
            Set the basics, invite the group, and let AI synthesize the perfect plan.
          </p>
        </div>

        {/* Social proof bar */}
        <div
          className="flex items-center gap-2.5 bg-white border border-cream-deep rounded-panel px-4 py-3 shadow-soft"
          aria-label="Social proof"
        >
          <div className="flex" aria-hidden="true">
            {(['😉', '📺', '😍'] as const).map((emoji, i) => (
              <div
                key={emoji}
                className={[
                  'w-[26px] h-[26px] rounded-full border-2 border-white',
                  'text-[0.75rem] flex items-center justify-center',
                  i > 0 ? '-ml-[7px]' : '',
                  i === 0 ? 'bg-sage-dim' : i === 1 ? 'bg-sand-light' : 'bg-terra-light',
                ].join(' ')}
              >
                {emoji}
              </div>
            ))}
          </div>
          <p className="text-[0.8rem] text-ink-mid flex-1">
            Works for{' '}
            <strong className="text-ink font-semibold">weekend trips</strong>,{' '}
            <strong className="text-ink font-semibold">dinner hangs</strong>,
            {' '}and everything in between
          </p>
        </div>

        {/* Plan details form */}
        <div className="bg-white border border-cream-deep rounded-panel p-[18px] shadow-soft">
          <CardLabel>Plan Details</CardLabel>
          <Field id="inp-name"  label="Plan Name"       value={name}     onChange={setName}     placeholder="e.g. Ottawa Weekend, Friday Dinner" maxLength={52} />
          <Field id="inp-loc"   label="Location"        value={location} onChange={setLocation} placeholder="e.g. Downtown Toronto, Japan"                maxLength={60} />
          <Field id="inp-dates" label="Dates / Duration" value={dates}   onChange={setDates}    placeholder="e.g. Aug 12–14  or  4 hours"          maxLength={40} />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className="btn-primary bg-ink text-white shadow-[0_2px_10px_rgba(44,43,40,0.16)] hover:bg-[#1c1b18]"
          aria-label="Create plan and get invite link"
        >
          Create Plan &amp; Get Invite Link{' '}
          <span aria-hidden="true">→</span>
        </button>

        {/* Feature tags */}
        <div className="flex gap-[7px] flex-wrap" role="list" aria-label="Platform features">
          {FEATURES.map(tag => (
            <span
              key={tag}
              role="listitem"
              className="inline-flex items-center gap-[5px] text-[0.73rem] font-medium text-ink-mid bg-white border border-cream-deep rounded-full px-[11px] py-[5px] shadow-soft"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
