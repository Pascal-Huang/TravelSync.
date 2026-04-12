'use client'

interface ToastProps {
  message: string | null
}

/**
 * Controlled toast — visibility driven by whether `message` is non-null.
 * The parent (HarmonyApp) manages a setTimeout to clear it.
 */
export default function Toast({ message }: ToastProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={[
        // Base
        'fixed bottom-[22px] left-1/2 -translate-x-1/2',
        'bg-ink text-white text-[0.83rem] font-medium',
        'px-5 py-[10px] rounded-full whitespace-nowrap',
        'pointer-events-none z-[999] shadow-float',
        // Transition
        'transition-all duration-300',
        // Visible / hidden state
        message
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-[70px]',
      ].join(' ')}
    >
      {/* Keep the element mounted so the fade-out plays */}
      {message ?? ''}
    </div>
  )
}
