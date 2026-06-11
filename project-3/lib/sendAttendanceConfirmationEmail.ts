import { dbQuery } from '@/lib/db'
import { getTripOwnerColumn } from '@/lib/tripOwnerColumn'
import { sendEmail } from '@/lib/email'
import type { PlanDetails } from '@/types'
import type { GeneratedTrip } from '@/lib/buildTripOrder'

function parsePositiveId(input: unknown): number | null {
  if (typeof input === 'number' && Number.isInteger(input) && input > 0) return input
  if (typeof input === 'string' && /^\d+$/.test(input.trim())) {
    const n = Number(input.trim())
    return Number.isSafeInteger(n) && n > 0 ? n : null
  }
  return null
}

export async function sendAttendanceConfirmationEmail(tripId: number, userId: number): Promise<void> {
  const ownerColumn = await getTripOwnerColumn()

  const tripResult = await dbQuery<{
    owner_id: string | number
    plan_details: PlanDetails
    itinerary: GeneratedTrip
  }>(
    `
      SELECT
        t.${ownerColumn} AS owner_id,
        t.plan_details,
        t.itinerary
      FROM "TravelSync".trips t
      WHERE t.id = $1
      LIMIT 1
    `,
    [tripId],
  )

  const tripRow = tripResult.rows[0]
  if (!tripRow) {
    const err = new Error('Trip not found.')
    ;(err as Error & { code?: string }).code = 'TRIP_NOT_FOUND'
    throw err
  }

  const ownerId = parsePositiveId(tripRow.owner_id)
  const isOwnerConfirmation = userId === ownerId

  if (!isOwnerConfirmation) {
    const access = await dbQuery<{ ok: number }>(
      `SELECT 1 AS ok FROM "TravelSync".trip_shares WHERE trip_id = $1 AND shared_with_user_id = $2 LIMIT 1`,
      [tripId, userId],
    )
    if (!access.rows[0]) {
      const err = new Error('You do not have access to this trip.')
      ;(err as Error & { code?: string }).code = 'ACCESS_DENIED'
      throw err
    }
  }

  const confirmerResult = await dbQuery<{ username: string; email: string }>(
    `SELECT username, email FROM public.accounts WHERE id = $1 LIMIT 1`,
    [userId],
  )

  const confirmer = confirmerResult.rows[0]
  if (!confirmer?.email) {
    const err = new Error('No email found for confirming user.')
    ;(err as Error & { code?: string }).code = 'EMAIL_NOT_FOUND'
    throw err
  }

  const planDetails = tripRow.plan_details
  const tripName = planDetails.name?.trim() || tripRow.itinerary.tripName || 'Your trip'
  const location = planDetails.location?.trim() || 'your destination'

  const subject = `You confirmed attendance for ${tripName}`
  const itinerary = (tripRow.itinerary || {}) as {
    days?: Array<{ day?: number; theme?: string; activities?: unknown }>
    itinerary?: Array<{ day?: number; theme?: string; activities?: unknown }>
  }
  const days = Array.isArray(itinerary.itinerary)
    ? itinerary.itinerary
    : Array.isArray(itinerary.days)
      ? itinerary.days
      : []

  const formatActivityItem = (item: unknown): string => {
    if (typeof item === 'string') {
      return item.trim()
    }
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      const title =
        (typeof record.title === 'string' && record.title.trim()) ||
        (typeof record.name === 'string' && record.name.trim()) ||
        (typeof record.activity === 'string' && record.activity.trim()) ||
        (typeof record.text === 'string' && record.text.trim()) ||
        ''
      const time =
        (typeof record.time === 'string' && record.time.trim()) ||
        (typeof record.startTime === 'string' && record.startTime.trim()) ||
        (typeof record.start === 'string' && record.start.trim()) ||
        ''
      const place =
        (typeof record.location === 'string' && record.location.trim()) ||
        (typeof record.place === 'string' && record.place.trim()) ||
        ''

      const parts = [title, time ? `at ${time}` : '', place ? `(${place})` : ''].filter(Boolean)
      if (parts.length > 0) return parts.join(' ')
      return ''
    }
    return String(item)
  }

  let itineraryHtml = ''
  if (days.length > 0) {
    itineraryHtml = days
      .map((day, idx: number) => {
        const dayNum = Number.isFinite(day?.day) ? Number(day.day) : idx + 1
        const rawActivities = day?.activities
        const activityItems = Array.isArray(rawActivities)
          ? rawActivities.map(item => formatActivityItem(item).trim()).filter(Boolean)
          : typeof rawActivities === 'string'
            ? rawActivities
                .split(/\r?\n|;|•/)
                .map(item => item.trim())
                .filter(Boolean)
            : []
        return `
          <div style="margin:10px 0;padding:10px 11px;border:1px solid #ece8df;border-radius:8px;background:#fcfbf8;">
            <h4 style="margin:0 0 4px;font-size:13px;font-weight:700;color:#2c2b28;">Day ${dayNum}</h4>
            <p style="margin:0 0 7px;color:#5c5a56;font-size:12px;line-height:1.4;">${day.theme || 'Planned activities'}</p>
            ${
              activityItems.length > 0
                ? `<ul style="margin:0;padding-left:18px;color:#45423d;font-size:12px;line-height:1.45;">
              ${activityItems.map(act => `<li style="margin:2px 0;">${act}</li>`).join('')}
            </ul>`
                : `<p style="margin:4px 0 0;color:#7a766f;font-size:12px;">No specific activities listed.</p>`
            }
          </div>
        `
      })
      .join('')
  } else {
    itineraryHtml = `<p style="margin:0 0 14px;color:#5c5a56;font-size:14px;">No itinerary details were saved yet for this trip.</p>`
  }

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f7f5f0;padding:14px;color:#2c2b28;">
      <div style="max-width:460px;margin:0 auto;background:#ffffff;border:1px solid #edeae2;border-radius:12px;padding:14px;">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#7a9e8e;font-weight:700;">TravelSync Attendance Confirmed</p>
        <h2 style="margin:0 0 6px;font-size:18px;font-weight:600;line-height:1.25;">${tripName}</h2>
        <p style="margin:0 0 12px;color:#5c5a56;font-size:12px;">📍 ${location}</p>
        <p style="margin:0 0 10px;line-height:1.45;font-size:12px;color:#47443f;">
          Great! You've confirmed your attendance for this trip. Here's your itinerary:
        </p>
        ${itineraryHtml}
        <hr style="border:none;border-top:1px solid #edeae2;margin:14px 0;" />
        <div style="background:#f7f5f0;border-radius:8px;padding:12px;margin:10px 0 0;">
          <h3 style="margin:0 0 8px;font-size:14px;font-weight:700;color:#2c2b28;">Manage your subscriptions</h3>
          <p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:#5c5a56;">
            Use <strong>SubSync</strong> to pause, cancel, or monitor your subscriptions while you're away — so you're not paying for services you're not using on your trip.
          </p>
          <a href="https://trackersync.sub-sync.ca/" style="display:inline-block;background:#7a9e8e;color:#ffffff;padding:9px 14px;border-radius:6px;text-decoration:none;font-weight:700;font-size:12px;">Open SubSync →</a>
        </div>
      </div>
    </div>
  `

  await sendEmail({ to: confirmer.email, subject, html })
}
