import { defineStore } from 'pinia'
import useSecretaryStore from '@/entities/secretary-auth'
import useGeoStore from '@/shared/model/geo'
import { queryClient } from '@/shared/api/queryClient'
import { queryKeys } from '@/shared/api/queryKeys'
import { isChatGPT } from '@/shared/lib/detector'
import {
  getHostBridge,
  type ChatGPTStructuredContent,
  type ChatGPTTask,
} from '@/shared/lib/hostBridge'

interface TelegramGroup {
  id: number
  title: string
  type: 'group' | 'supergroup'
}

interface EventStoreState {
  chatGPTTasks: ChatGPTTask[]
  chatGPTSelectedDate: string
  chatGPTTimezone: string
  chatGPTStale: boolean
  chatGPTError: string | null
}

function localDateInTimeZone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return `${value.year}-${value.month}-${value.day}`
}

function normalizeToolParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(params)) as Record<string, unknown>
}

function getChatGPTContent(
  bridge: ReturnType<typeof getHostBridge>,
  content?: ChatGPTStructuredContent,
): ChatGPTStructuredContent | undefined {
  return content || bridge.widgetState?.content || bridge.toolOutput
}

export default defineStore('event', {
  state: (): EventStoreState => {
    const bridge = getHostBridge()
    const timezone = bridge.timezone || 'Europe/Moscow'
    return {
      chatGPTTasks: [],
      chatGPTSelectedDate: localDateInTimeZone(timezone),
      chatGPTTimezone: timezone,
      chatGPTStale: false,
      chatGPTError: null,
    }
  },
  actions: {
    applyChatGPTContent(content?: ChatGPTStructuredContent): boolean {
      const bridge = getHostBridge()
      const value = getChatGPTContent(bridge, content)
      if (!value) {
        return false
      }
      if (Array.isArray(value.tasks)) {
        this.chatGPTTasks = value.tasks.map((task) => ({
          ...task,
          targetType: task.targetType || 'Person',
        }))
      }
      if (value.selectedDate) {
        this.chatGPTSelectedDate = value.selectedDate.slice(0, 10)
      }
      if (value.timezone) {
        this.chatGPTTimezone = value.timezone
        useGeoStore().timeZone = value.timezone
      }
      this.chatGPTStale = false
      this.chatGPTError = null
      bridge.setWidgetState({
        ...bridge.widgetState,
        content: {
          ...value,
          tasks: this.chatGPTTasks,
          selectedDate: this.chatGPTSelectedDate,
          timezone: this.chatGPTTimezone,
        },
      })
      return true
    },
    async showChatGPTEvents(date?: string) {
      date ||= this.chatGPTSelectedDate
      const bridge = getHostBridge()
      const result = await bridge.callTool('show', {
        start_date: `${date}T00:00:00`,
        end_date: `${date}T23:59:59`,
      })
      if (!this.applyChatGPTContent(result.structuredContent)) {
        throw new Error('Show returned no structured task data')
      }
      return this.chatGPTTasks
    },
    async refreshChatGPTAfterWrite(): Promise<void> {
      try {
        await this.showChatGPTEvents()
      } catch (error) {
        console.error(error)
        this.chatGPTStale = true
        this.chatGPTError =
          error instanceof Error ? error.message : 'Не удалось обновить список'
      }
    },
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
      if (isChatGPT.value) {
        this.applyChatGPTContent()
        let task = this.chatGPTTasks.find(
          (item) => item.id_task === Number(taskId),
        )
        if (!task) {
          await this.showChatGPTEvents()
          task = this.chatGPTTasks.find(
            (item) => item.id_task === Number(taskId),
          )
        }
        if (!task) {
          throw new Error('Task not found')
        }
        return task
      }

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
      if (isChatGPT.value) {
        const bridge = getHostBridge()
        const task = { ...body }
        delete task.target
        delete task.remind_before
        delete task.id_task
        const result = await bridge.callTool(
          'create',
          normalizeToolParams(task),
        )
        if (!this.applyChatGPTContent(result.structuredContent)) {
          throw new Error('Create returned no structured task data')
        }
        return this.chatGPTTasks[0]
      }

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
      if (isChatGPT.value) {
        const bridge = getHostBridge()
        const task = { ...body }
        delete task.target
        delete task.remind_before
        await bridge.callTool('edit', normalizeToolParams(task))
        await this.refreshChatGPTAfterWrite()
        return
      }

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
      console.log('Данные успешно изменены')
    },
    async deleteEvent(body: unknown) {
      if (isChatGPT.value) {
        const bridge = getHostBridge()
        await bridge.callTool(
          'remove',
          normalizeToolParams(body as Record<string, unknown>),
        )
        await this.refreshChatGPTAfterWrite()
        return
      }

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
