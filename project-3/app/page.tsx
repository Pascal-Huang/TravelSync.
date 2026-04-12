// page.tsx is a Server Component by default in the App Router.
// All interactive state lives one level down in HarmonyApp (a Client Component),
// keeping this file clean and allowing future server-side data fetching here
// (e.g. fetching initial plan data from a DB before hydration).

import Project3 from '@/components/Project3'

export default function Page() {
  return <Project3/>
}
