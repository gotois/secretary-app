import { App, PostMessageTransport } from '@modelcontextprotocol/ext-apps'
import type { McpUiToolResultNotification } from '@modelcontextprotocol/ext-apps'
import { shallowRef } from 'vue'
import packageInfo from '../../../../package.json'
import {
  getCalendarSubscriptionStatus,
  type CalendarContent,
} from '@/shared/lib/calendarFeed'
export type { CalendarContent } from '@/shared/lib/calendarFeed'

type ToolResult = McpUiToolResultNotification['params']

export function readCalendarContent(result: ToolResult): CalendarContent {
  if (result.isError) {
    throw new Error(
      result.content
        ?.filter((item) => item.type === 'text')
        .map((item) => item.text)
        .join('\n') || 'Не удалось получить данные от MCP-хоста',
    )
  }
  const content = result.structuredContent
  if (
    content?.view !== 'calendar' ||
    typeof content.calendar !== 'string' ||
    typeof content.timezone !== 'string'
  ) {
    throw new Error('MCP tool returned no calendar feed')
  }
  getCalendarSubscriptionStatus(content.calendar)
  new Intl.DateTimeFormat('en', { timeZone: content.timezone })
  if (
    content.selectedDate !== undefined &&
    typeof content.selectedDate !== 'string'
  ) {
    throw new Error('Invalid calendar date')
  }
  return content as unknown as CalendarContent
}

export function createHostBridge() {
  const sdk = new App(
    { name: 'Secretary Calendar', version: packageInfo.version },
    {},
    { autoResize: false, strict: true },
  )
  const content = shallowRef<CalendarContent>()
  const context = shallowRef(sdk.getHostContext())
  const error = shallowRef<string>()
  const connected = shallowRef(false)
  const connecting = shallowRef(false)
  let firstResult: ToolResult | undefined
  let settle: ((result: ToolResult) => void) | undefined
  let stopResize = () => {}
  let closed = false
  let cancelInitial: (() => void) | undefined
  function stop() {
    closed = true
    connected.value = false
    connecting.value = false
    stopResize()
    cancelInitial?.()
    cancelInitial = undefined
  }
  const onResult = (result: ToolResult) => {
    if (closed) return
    firstResult = result
    settle?.(result)
    try {
      content.value = readCalendarContent(result)
      error.value = undefined
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
    }
  }
  sdk.addEventListener('toolresult', onResult)
  sdk.addEventListener('hostcontextchanged', () => {
    context.value = sdk.getHostContext()
  })
  sdk.onteardown = async () => {
    stop()
    return {}
  }
  return {
    content,
    context,
    error,
    connected,
    connecting,
    async connect(timeout = 30_000) {
      if (closed || connecting.value) return
      connecting.value = true
      error.value = undefined
      try {
        await sdk.connect(
          new PostMessageTransport(window.parent, window.parent),
          {
            timeout,
            maxTotalTimeout: timeout,
          },
        )
        if (closed) return
        context.value = sdk.getHostContext()
        if (!sdk.getHostCapabilities()?.serverTools) {
          throw new Error('MCP host does not support serverTools')
        }
        connected.value = true
        stopResize = sdk.setupSizeChangedNotifications()
        const result =
          firstResult ??
          (await new Promise<ToolResult>((resolve, reject) => {
            const timer = setTimeout(() => {
              settle = undefined
              cancelInitial = undefined
              reject(new Error('Initial MCP tool result timed out'))
            }, timeout)
            cancelInitial = () => {
              clearTimeout(timer)
              settle = undefined
              reject(new Error('MCP view closed'))
            }
            settle = (value) => {
              clearTimeout(timer)
              settle = undefined
              cancelInitial = undefined
              resolve(value)
            }
          }))
        content.value = readCalendarContent(result)
      } catch (cause) {
        if (!closed)
          error.value = cause instanceof Error ? cause.message : String(cause)
      } finally {
        connecting.value = false
      }
    },
    async loadDay(day: string, timezone: string) {
      const start = Temporal.PlainDate.from(day).toZonedDateTime(timezone)
      const end = start.add({ days: 1 }).subtract({ nanoseconds: 1 })
      const result = await sdk.callServerTool({
        name: 'list-calendar-tasks',
        arguments: {
          start_date: start.toInstant().toString(),
          end_date: end.toInstant().toString(),
        },
      })
      content.value = readCalendarContent(result)
      error.value = undefined
    },
    async close() {
      stop()
      await sdk.close()
    },
  }
}

export type CalendarHostBridge = ReturnType<typeof createHostBridge>
