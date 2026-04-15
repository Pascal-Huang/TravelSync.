import { NextResponse } from 'next/server'
import { getJsonBinMasterKey } from '@/lib/jsonbinKey'
import {
  buildSharedRecord,
  isIdeaItem,
  isPlanDetails,
  isSharedSandboxRecord,
} from '@/lib/sharedSandbox'

export const dynamic = 'force-dynamic'

const JSONBIN = 'https://api.jsonbin.io/v3/b'

/** Public URL for share links (Vercel often needs forwarded host, not internal `req.url`). */
function getPublicOrigin(req: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  if (configured) return configured

  const xfHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const xfProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
  const host = xfHost || req.headers.get('host')?.trim()
  if (host) {
    const proto = xfProto.replace(/:+$/, '')
    return `${proto}://${host}`
  }

  try {
    const o = new URL(req.url).origin
    if (o && o !== 'null') return o
  } catch {
    /* ignore */
  }

  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`

  return ''
}

function jsonbinHeaders(): HeadersInit {
  const key = getJsonBinMasterKey()
  if (!key) throw new Error('MISSING_KEY')
  return {
    'Content-Type': 'application/json',
    'X-Master-Key': key,
  }
}

async function readJsonbinJson(res: Response): Promise<unknown> {
  const text = await res.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { raw: text }
  }
}

function extractRecord(data: unknown): unknown {
  if (data && typeof data === 'object' && 'record' in data) {
    return (data as { record: unknown }).record
  }
  return data
}

function extractBinMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const m = (data as { message: unknown }).message
    return typeof m === 'string' ? m : 'JSONBin request failed'
  }
  return 'JSONBin request failed'
}

function jsonBinErrorResponse(res: Response, data: unknown): NextResponse {
  const msg = extractBinMessage(data)
  const status =
    res.status === 404
      ? 404
      : res.status === 401 || res.status === 403
        ? res.status
        : 502
  const hint =
    res.status === 401
      ? ' On Vercel: Project → Settings → Environment Variables → add JSONBIN_API_KEY with your Master Key from https://jsonbin.io/app/api-keys (paste the key as-is with $ characters, not \\$ like local .env). Redeploy after saving.'
      : ''
  return NextResponse.json({ error: msg + hint }, { status })
}

export async function POST(req: Request) {
  try {
    if (!getJsonBinMasterKey()) {
      return NextResponse.json(
        { error: 'JSONBin API key is not configured (JSONBIN_API_KEY).' },
        { status: 500 },
      )
    }
    const body = (await req.json()) as unknown
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const { planDetails, ideas } = body as { planDetails?: unknown; ideas?: unknown }
    if (!isPlanDetails(planDetails)) {
      return NextResponse.json({ error: 'Invalid planDetails' }, { status: 400 })
    }
    const ideaList = Array.isArray(ideas) ? ideas : []
    for (const item of ideaList) {
      if (!isIdeaItem(item)) {
        return NextResponse.json({ error: 'Invalid idea in ideas list' }, { status: 400 })
      }
    }
    const record = buildSharedRecord(planDetails, ideaList)

    const binRes = await fetch(JSONBIN, {
      method: 'POST',
      headers: jsonbinHeaders(),
      body: JSON.stringify(record),
    })
    const data = await readJsonbinJson(binRes)
    if (!binRes.ok) {
      return jsonBinErrorResponse(binRes, data)
    }
    const meta =
      data && typeof data === 'object' && 'metadata' in data
        ? (data as { metadata: { id?: string } }).metadata
        : null
    const binId = meta?.id
    if (typeof binId !== 'string' || !binId) {
      return NextResponse.json({ error: 'JSONBin did not return a bin id' }, { status: 502 })
    }

    const origin = getPublicOrigin(req)
    const sharePath = `/?share=${encodeURIComponent(binId)}`
    const shareUrl = origin ? `${origin}${sharePath}` : sharePath
    const out = NextResponse.json({ binId, shareUrl, record })
    out.headers.set('Cache-Control', 'no-store, max-age=0')
    return out
  } catch (e) {
    if (e instanceof Error && e.message === 'MISSING_KEY') {
      return NextResponse.json({ error: 'JSONBin API key missing' }, { status: 500 })
    }
    console.error('share-bin POST', e)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    if (!getJsonBinMasterKey()) {
      return NextResponse.json(
        { error: 'JSONBin API key is not configured (JSONBIN_API_KEY).' },
        { status: 500 },
      )
    }
    const binId = new URL(req.url).searchParams.get('binId')
    if (!binId?.trim()) {
      return NextResponse.json({ error: 'Missing binId query parameter' }, { status: 400 })
    }

    const binRes = await fetch(`${JSONBIN}/${encodeURIComponent(binId)}/latest`, {
      method: 'GET',
      headers: jsonbinHeaders(),
    })
    const data = await readJsonbinJson(binRes)
    if (!binRes.ok) {
      return jsonBinErrorResponse(binRes, data)
    }
    const record = extractRecord(data)
    if (!isSharedSandboxRecord(record)) {
      return NextResponse.json({ error: 'Shared data is missing or invalid' }, { status: 422 })
    }
    const out = NextResponse.json({ binId, record })
    out.headers.set('Cache-Control', 'no-store, max-age=0')
    return out
  } catch (e) {
    if (e instanceof Error && e.message === 'MISSING_KEY') {
      return NextResponse.json({ error: 'JSONBin API key missing' }, { status: 500 })
    }
    console.error('share-bin GET', e)
    return NextResponse.json({ error: 'Failed to load shared sandbox' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    if (!getJsonBinMasterKey()) {
      return NextResponse.json(
        { error: 'JSONBin API key is not configured (JSONBIN_API_KEY).' },
        { status: 500 },
      )
    }
    const body = (await req.json()) as unknown
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const { binId, planDetails, ideas } = body as {
      binId?: unknown
      planDetails?: unknown
      ideas?: unknown
    }
    if (typeof binId !== 'string' || !binId.trim()) {
      return NextResponse.json({ error: 'Missing binId' }, { status: 400 })
    }
    if (!isPlanDetails(planDetails)) {
      return NextResponse.json({ error: 'Invalid planDetails' }, { status: 400 })
    }
    const ideaList = Array.isArray(ideas) ? ideas : []
    for (const item of ideaList) {
      if (!isIdeaItem(item)) {
        return NextResponse.json({ error: 'Invalid idea in ideas list' }, { status: 400 })
      }
    }
    const record = buildSharedRecord(planDetails, ideaList)

    const res = await fetch(`${JSONBIN}/${encodeURIComponent(binId)}`, {
      method: 'PUT',
      headers: jsonbinHeaders(),
      body: JSON.stringify(record),
    })
    const data = await readJsonbinJson(res)
    if (!res.ok) {
      return jsonBinErrorResponse(res, data)
    }
    return NextResponse.json({ ok: true, record })
  } catch (e) {
    if (e instanceof Error && e.message === 'MISSING_KEY') {
      return NextResponse.json({ error: 'JSONBin API key missing' }, { status: 500 })
    }
    console.error('share-bin PUT', e)
    return NextResponse.json({ error: 'Failed to update shared sandbox' }, { status: 500 })
  }
}
