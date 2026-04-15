// page.tsx is a Server Component by default in the App Router.
// Pass `share` from the URL so shared links work reliably on Vercel (same request as HTML).

import Project3 from '@/components/Project3'

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
  return <Project3 shareFromUrl={pickShareId(sp)} />
}
