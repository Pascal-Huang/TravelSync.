import type { IdeaItem, PlanDetails } from '@/types'
import { getJsonBinMasterKey } from '@/lib/jsonbinKey'
import { isSharedSandboxRecord } from '@/lib/sharedSandbox'

const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b'

export type LoadedSharePayload = {
  binId: string
  planDetails: PlanDetails
  ideas: IdeaItem[]
}

/** Read a share bin directly from JSONBin (avoids SSR calling your own /api route on Vercel). */
export async function loadSharedSandboxOnServer(
  binId: string,
): Promise<LoadedSharePayload | null> {
  const key = getJsonBinMasterKey()
  if (!key) return null

  try {
    const res = await fetch(`${JSONBIN_BASE}/${encodeURIComponent(binId)}/latest`, {
      headers: { 'X-Master-Key': key },
      cache: 'no-store',
    })
    const text = await res.text()
    let data: unknown
    try {
      data = JSON.parse(text) as unknown
    } catch {
      return null
    }
    if (!res.ok) return null

    const record =
      data && typeof data === 'object' && 'record' in data
        ? (data as { record: unknown }).record
        : data
    if (!isSharedSandboxRecord(record)) return null

    return {
      binId,
      planDetails: record.planDetails,
      ideas: record.ideas,
    }
  } catch {
    return null
  }
}
