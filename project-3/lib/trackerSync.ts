interface TriggerTripReminderInput {
  tripId: number
  userId: number
}

export async function triggerTrackerSyncTripReminder({
  tripId,
  userId,
}: TriggerTripReminderInput): Promise<Record<string, unknown> | null> {
  const baseUrl = process.env.TRACKERSYNC_BASE_URL?.trim()
  if (!baseUrl) return null

  const res = await fetch(`${baseUrl}/api/trip-reminders/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tripId,
      userId,
      forceReprocess: true,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`TrackerSync trigger failed: ${res.status} ${text}`)
  }

  return (await res.json().catch(() => ({}))) as Record<string, unknown>
}