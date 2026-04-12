interface TopBarProps {
  /** Step indicator shown on the right, e.g. "Step 1 / 3" or "Done ✓" */
  step?: string
}

/**
 * TopBar is a pure presentational component — no state, no 'use client' needed.
 * It renders identically across all screens.
 */
export default function TopBar({ step }: TopBarProps) {
  return (
    <div className="flex items-center justify-between py-[22px] pb-4">
      {/* Logo */}
      <div className="font-display text-xl text-ink tracking-[-0.01em]">
        TravelSync<span className="text-sage">.</span>
      </div>

      {/* Optional step pill */}
      {step && (
        <span
          className="text-[0.68rem] font-semibold tracking-[0.07em] uppercase text-ink-faint bg-cream-deep px-[11px] py-1 rounded-full"
          aria-label={step}
        >
          {step}
        </span>
      )}
    </div>
  )
}
