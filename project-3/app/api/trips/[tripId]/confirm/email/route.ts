import { NextResponse } from 'next/server'
import { ensureTravelSyncTables } from '@/lib/ensureTravelSyncTables'
import { sendAttendanceConfirmationEmail } from '@/lib/sendAttendanceConfirmationEmail'

interface ConfirmEmailBody {
  userId?: unknown
}

function parsePositiveId(input: unknown): number | null {
  if (typeof input === 'number' && Number.isInteger(input) && input > 0) return input
  if (typeof input === 'string' && /^\d+$/.test(input.trim())) {
    const n = Number(input.trim())
    return Number.isSafeInteger(n) && n > 0 ? n : null
  }
  return null
}

function parseTripId(req: Request): number | null {
  const segments = new URL(req.url).pathname.split('/').filter(Boolean)
  // URL pattern: /api/trips/[tripId]/confirm/email
  const raw = segments[segments.length - 3]
  return parsePositiveId(raw)
}

export async function POST(req: Request) {
  try {
    await ensureTravelSyncTables()
    const tripId = parseTripId(req)
    const body = (await req.json()) as ConfirmEmailBody
    const userId = parsePositiveId(body.userId)

    if (!tripId || !userId) {
      return NextResponse.json(
        { error: 'Valid tripId and userId are required.', code: 'INVALID_INPUT' },
        { status: 400 },
      )
    }

    await sendAttendanceConfirmationEmail(tripId, userId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : 'EMAIL_SEND_FAILED'

    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to send attendance confirmation email.'

    console.error('confirm attendance email POST error:', error)

    const status =
      code === 'INVALID_INPUT' ? 400 : code === 'TRIP_NOT_FOUND' ? 404 : code === 'ACCESS_DENIED' ? 403 : 500

    return NextResponse.json({ error: message, code }, { status })
  }
}
