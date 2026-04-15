/**
 * Local `.env.local` may use `\$` so Next does not treat `$2a` as variable expansion.
 * On Vercel, use the raw key; escaped `\$` in the value is normalized here.
 */
export function getJsonBinMasterKey(): string | null {
  const normalize = (raw: string | undefined): string | null => {
    if (raw == null) return null
    let k = raw.trim()
    if (!k) return null
    if (k.includes('\\$')) k = k.replace(/\\\$/g, '$')
    return k
  }
  return (
    normalize(process.env.JSONBIN_API_KEY) ||
    normalize(process.env.NEXT_PUBLIC_JSONBIN_API_KEY) ||
    null
  )
}
