import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { queryClient } from '@/shared/api/queryClient'
import { queryKeys } from '@/shared/api/queryKeys'

vi.mock('@/entities/secretary-auth', () => ({
  default: () => ({ auth: null as string | null }),
}))

vi.mock('@/shared/model/geo', () => ({
  default: () => ({
    geolocation: undefined as string | undefined,
    timeZone: 'Europe/Moscow',
  }),
}))

vi.mock('@/shared/lib/detector', async () => {
  const { computed } = await import('vue')
  return { isChatGPT: computed(() => false) }
})

import useEventStore from './store'

describe('event store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('invalidates the calendar subscription after creating an event', async () => {
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await useEventStore().createEvent({ name: 'New event' })

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.calendar.all,
      refetchType: 'all',
    })
  })
})
