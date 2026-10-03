import { defineStore } from 'pinia'
import useSecretaryStore from '@/entities/secretary-auth'
import useGeoStore from '@/shared/model/geo'
import { queryClient } from '@/shared/api/queryClient'
import { queryKeys } from '@/shared/api/queryKeys'

interface TelegramGroup {
  id: number
  title: string
  type: 'group' | 'supergroup'
}

export default defineStore('event', {
  actions: {
    async getTelegramGroups(query?: string) {
      const secretaryStore = useSecretaryStore()

      const headers = new Headers()
      if (secretaryStore.auth) {
        headers.set('Authorization', secretaryStore.auth)
      }

      const params = new URLSearchParams()
      if (query?.trim()) {
        params.set('query', query.trim())
      }

      const response = await fetch(
        import.meta.env.server + '/groups?' + params.toString(),
        {
          method: 'GET',
          headers,
          credentials: 'include',
        },
      )
      if (!response.ok) {
        throw new Error('Response groups failed')
      }
      const groups = await response.json()
      return groups as TelegramGroup[]
    },
    async getEvent(taskId: number | string) {
      const secretaryStore = useSecretaryStore()

      const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      })
      if (secretaryStore.auth) {
        headers.set('Authorization', secretaryStore.auth)
      }

      const response = await fetch(
        import.meta.env.server + `/event/${taskId}`,
        {
          method: 'GET',
          headers,
          credentials: 'include',
        },
      )
      if (!response.ok) {
        throw new Error('Unable to load task')
      }
      const result = await response.json()
      return result
    },
    // TODO: описать входную модель события и убрать `any`: деструктуризация ниже не
    // валидирует payload, поэтому UI может отправить в API произвольные поля.
    async createEvent(body: Record<string, unknown>) {
      const { ...event } = body
      const secretaryStore = useSecretaryStore()
      const geoStore = useGeoStore()

      const headers = new Headers({
        'Content-Type': 'application/json',
      })
      if (secretaryStore.auth) {
        headers.set('Authorization', secretaryStore.auth)
      }
      if (geoStore.geolocation) {
        headers.set('Geolocation', geoStore.geolocation)
      }
      if (geoStore.timeZone) {
        headers.set('Timezone', geoStore.timeZone)
      }
      const response = await fetch(import.meta.env.server + '/event', {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
        credentials: 'include',
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.calendar.all,
        refetchType: 'all',
      })
      console.log('Данные успешно добавлены')
    },
    async editEvent(body: Record<string, unknown>) {
      const secretaryStore = useSecretaryStore()
      const geoStore = useGeoStore()

      const headers = new Headers({
        'Content-Type': 'application/json',
      })
      if (secretaryStore.auth) {
        headers.set('Authorization', secretaryStore.auth)
      }
      if (geoStore.timeZone) {
        headers.set('Timezone', geoStore.timeZone)
      }
      const response = await fetch(import.meta.env.server + '/event', {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error((await response.text()) || 'Response failed')
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.calendar.all,
        refetchType: 'all',
      })
      console.log('Данные успешно изменены')
    },
    async deleteEvent(body: unknown) {
      const secretaryStore = useSecretaryStore()

      const headers = new Headers({
        'Content-Type': 'application/json',
      })
      if (secretaryStore.auth) {
        headers.set('Authorization', secretaryStore.auth)
      }
      const response = await fetch(import.meta.env.server + '/event', {
        method: 'DELETE',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Response failed')
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.calendar.all,
        refetchType: 'all',
      })
      console.log('Данные успешно удалены')
    },
  },
})
