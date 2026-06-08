import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
  return parsePositiveId(segments[segments.length - 1])
}

export async function DELETE(req: Request) {
  try {
    const tripId = parseTripId(req)
    if (!tripId) {
      return NextResponse.json({ error: 'Valid tripId is required.' }, { status: 400 })
    }

    const body = (await req.json()) as { userId?: unknown }
    const userId = parsePositiveId(body.userId)
    if (!userId) {
      return NextResponse.json({ error: 'Valid userId is required.' }, { status: 400 })
    }

    const ownerResult = await dbQuery<{ owner_id: string | number }>(
      'SELECT owner_id FROM "TravelSync".trips WHERE id = $1 LIMIT 1',
      [tripId],
    )
    if (!ownerResult.rows[0]) {
      return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
    }

    const ownerId = parsePositiveId(ownerResult.rows[0].owner_id)
    if (ownerId !== userId) {
      return NextResponse.json({ error: 'Only the owner can delete this trip.' }, { status: 403 })
    }

    await dbQuery('DELETE FROM "TravelSync".trip_shares WHERE trip_id = $1', [tripId])
    await dbQuery('DELETE FROM "TravelSync".trips WHERE id = $1', [tripId])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('trips DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete trip.' }, { status: 500 })
  }
}
