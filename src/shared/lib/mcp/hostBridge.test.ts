import type { App } from '@modelcontextprotocol/ext-apps'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { initializeHostBridge } from './hostBridge'
import type { OpenAiGlobals } from '@/shared/lib/openai/extensions'

type Listener = (payload: unknown) => void

class FakeMcpApp {
  readonly listeners = new Map<string, Listener[]>()
  readonly callServerTool = vi.fn(async () => ({
    content: [{ type: 'text' as const, text: 'ok' }],
    structuredContent: {
      view: 'calendar',
      tasks: [],
      timezone: 'Europe/Moscow',
    },
  }))
  readonly requestTeardown = vi.fn(async () => {})

  addEventListener(name: string, listener: Listener): void {
    const listeners = this.listeners.get(name) || []
    listeners.push(listener)
    this.listeners.set(name, listeners)
  }

  getHostContext() {
    return {
      theme: 'dark' as const,
      locale: 'ru-RU',
      timeZone: 'Europe/Moscow',
    }
  }

  emit(name: string, payload: unknown): void {
    for (const listener of this.listeners.get(name) || []) {
      listener(payload)
    }
  }
}

function initializeFakeBridge(fake = new FakeMcpApp()) {
  return {
    bridge: initializeHostBridge(fake as unknown as App),
    fake,
  }
}

describe('MCP App host bridge', () => {
  beforeEach(() => {
    delete window.openai
    initializeHostBridge()
  })

  test('uses MCP events, host context and server tool calls', async () => {
    const { bridge, fake } = initializeFakeBridge()
    const subscriber = vi.fn()
    bridge.subscribe(subscriber)

    fake.emit('toolinput', { arguments: { start_date: '2026-07-27' } })
    fake.emit('toolresult', {
      content: [{ type: 'text', text: 'Календарь загружен' }],
      structuredContent: {
        view: 'calendar',
        tasks: [],
        timezone: 'Europe/Moscow',
      },
    })
    fake.emit('hostcontextchanged', { theme: 'light' })

    expect(bridge.theme).toBe('dark')
    expect(bridge.locale).toBe('ru-RU')
    expect(bridge.timezone).toBe('Europe/Moscow')
    expect(bridge.toolInput).toEqual({ start_date: '2026-07-27' })
    expect(bridge.toolOutput).toEqual({
      view: 'calendar',
      tasks: [],
      timezone: 'Europe/Moscow',
    })
    expect(subscriber).toHaveBeenCalledTimes(3)

    await expect(
      bridge.callTool('list-calendar-tasks', { start_date: '2026-07-27' }),
    ).resolves.toMatchObject({
      structuredContent: {
        view: 'calendar',
      },
    })
    expect(fake.callServerTool).toHaveBeenCalledWith({
      name: 'list-calendar-tasks',
      arguments: { start_date: '2026-07-27' },
    })

    await bridge.requestClose()
    expect(fake.requestTeardown).toHaveBeenCalledOnce()
  })

  test('uses window.openai only for native modal input and widget state', async () => {
    const requestModal = vi.fn(async () => {})
    const setWidgetState = vi.fn()
    window.openai = {
      toolInput: { mode: 'edit', taskId: 42 },
      widgetState: {
        secretaryCalendar: {
          content: { view: 'calendar', tasks: [] },
        },
      },
      requestModal,
      setWidgetState,
    } satisfies OpenAiGlobals

    const { bridge } = initializeFakeBridge()
    expect(bridge.toolInput).toEqual({ mode: 'edit', taskId: 42 })
    expect(bridge.widgetState?.content?.view).toBe('calendar')

    await expect(
      bridge.requestModal({ mode: 'edit', taskId: 42 }),
    ).resolves.toBe(true)
    expect(requestModal).toHaveBeenCalledWith({
      params: { mode: 'edit', taskId: 42 },
    })

    bridge.setWidgetState({ content: { view: 'calendar', tasks: [] } })
    expect(setWidgetState).toHaveBeenCalledWith({
      secretaryCalendar: {
        content: { view: 'calendar', tasks: [] },
      },
    })
  })
})
