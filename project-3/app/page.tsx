// Server loads `/?share=` from JSONBin so the sandbox opens on first paint (reliable on Vercel).

import Project3 from '@/components/Project3'
import { loadSharedSandboxOnServer } from '@/lib/loadSharedSandboxOnServer'

export const dynamic = 'force-dynamic'

type ShareSearchParams = { share?: string | string[] }

function pickShareId(sp: ShareSearchParams | undefined): string | undefined {
  const raw = sp?.share
  if (typeof raw === 'string') {
    const t = raw.trim()
    return t || undefined
  }
  if (Array.isArray(raw)) {
    const t = raw[0]?.trim()
    return t || undefined
  }
  return undefined
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ShareSearchParams>
}) {
  const sp = await searchParams
  const shareId = pickShareId(sp)
  const initialShareData = shareId ? await loadSharedSandboxOnServer(shareId) : null

  return <Project3 shareFromUrl={shareId} initialShareData={initialShareData} />
}
