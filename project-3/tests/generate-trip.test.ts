import { vi, describe, it, expect } from 'vitest'

// Mock the Google GenAI client so tests don't call real API
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: async ({ contents }: { contents: string }) => {
          // Return a predictable JSON string similar to the real service
          const payload = {
            tripName: 'My Trip',
            harmonyPlan: { note: 'All good', conflicts: [] },
            itinerary: [],
          }
          return { text: JSON.stringify(payload) }
        },
      },
    })),
  }
})

// Mock NextResponse.json to return the payload directly for assertions
vi.mock('next/server', () => ({
  NextResponse: {
    json: (payload: unknown, init?: { status?: number }) => ({ payload, status: init?.status ?? 200 }),
  },
}))

import { POST } from '../app/api/generate-trip/route'

describe('generate-trip API (mocked)', () => {
  it('returns parsed JSON from mocked AI', async () => {
    const req = { json: async () => ({ location: 'Paris', days: 3, ideas: 'sightseeing', plan: { name: 'Test Trip' } }) }
    const res = await (POST as any)(req)
    expect(res).toBeDefined()
    expect(res.payload).toBeDefined()
    expect(res.payload.tripName).toBe('My Trip')
    expect(res.status).toBe(200)
  })
})
