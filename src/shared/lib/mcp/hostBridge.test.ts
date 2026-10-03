import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { calendarResult } from './fixtures'

const host = vi.hoisted(() => ({
  context: { timeZone: 'Europe/Moscow', locale: 'ru-RU', theme: 'light' },
  serverTools: true,
  listeners: new Map<string, (value: unknown) => void>(),
  connect: vi.fn<() => Promise<void>>(),
  callServerTool: vi.fn(),
  close: vi.fn(),
  stopResize: vi.fn(),
  teardown: undefined as (() => Promise<unknown>) | undefined,
}))

vi.mock('@modelcontextprotocol/ext-apps', () => ({
  App: class {
    getHostContext() {
      return host.context
    }
    getHostCapabilities() {
      return { serverTools: host.serverTools }
    }
    addEventListener(name: string, callback: (value: unknown) => void) {
      host.listeners.set(name, callback)
    }
    set onteardown(callback: () => Promise<unknown>) {
      host.teardown = callback
    }
    connect = host.connect
    callServerTool = host.callServerTool
    close = host.close
    setupSizeChangedNotifications() {
      return host.stopResize
    }
  },
  PostMessageTransport: class {},
}))

import { createHostBridge, readCalendarContent } from './hostBridge'

beforeEach(() => {
  host.listeners.clear()
  host.serverTools = true
  host.context = { timeZone: 'Europe/Moscow', locale: 'ru-RU', theme: 'light' }
  host.connect.mockResolvedValue(undefined)
  host.close.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('MCP calendar content', () => {
  test('retains the full calendar including stable UIDs, recurrence and busy rules', () => {
    const result = calendarResult('2026-10-01')
    const content = readCalendarContent(result)
    expect(content).toEqual(result.structuredContent)
    expect(content.calendar).toContain('UID:secretary-preview-event')
    expect(content.calendar).toContain('RRULE:FREQ=DAILY;COUNT=4')
    expect(content.calendar).toContain('FREEBUSY;FBTYPE=BUSY:')
  })

  test('accepts a valid empty calendar', () => {
    expect(readCalendarContent(calendarResult('2026-10-01', true)).view).toBe(
      'calendar',
    )
  })

  test('surfaces tool errors even when they include a calendar', () => {
    expect(() =>
      readCalendarContent({
        ...calendarResult('2026-10-01'),
        isError: true,
        content: [{ type: 'text', text: 'Access denied' }],
      }),
    ).toThrow('Access denied')
  })

  test.each([
    { calendar: 'not an ICS feed' },
    { timezone: 'Invalid/Zone' },
    { view: 'create-form' },
    { selectedDate: 42 },
  ])('rejects malformed calendar content %j', (fields) => {
    const result = calendarResult('2026-10-01')
    expect(() =>
      readCalendarContent({
        ...result,
        structuredContent: { ...result.structuredContent, ...fields },
      }),
    ).toThrow()
  })
})

describe('MCP host bridge', () => {
  test('accepts the initial result delivered during the handshake without a second tool call', async () => {
    const bridge = createHostBridge()
    host.connect.mockImplementationOnce(async () => {
      host.listeners.get('toolresult')?.(calendarResult('2026-10-01'))
    })
    await bridge.connect()
    expect(bridge.content.value?.selectedDate).toBe('2026-10-01')
    expect(bridge.connected.value).toBe(true)
    expect(bridge.connecting.value).toBe(false)
    expect(bridge.error.value).toBeUndefined()
    expect(host.callServerTool).not.toHaveBeenCalled()
    await bridge.close()
    expect(host.stopResize).toHaveBeenCalledOnce()
    expect(host.close).toHaveBeenCalledOnce()
  })

  test('waits for an asynchronous first result and receives context updates', async () => {
    const bridge = createHostBridge()
    const connecting = bridge.connect()
    await vi.waitFor(() => expect(bridge.connected.value).toBe(true))
    expect(bridge.connecting.value).toBe(true)
    host.listeners.get('toolresult')?.(calendarResult('2026-10-02'))
    await connecting
    host.context = { timeZone: 'Europe/Berlin', locale: 'en-GB', theme: 'dark' }
    host.listeners.get('hostcontextchanged')?.({})
    expect(bridge.context.value).toEqual(host.context)
    expect(bridge.content.value?.selectedDate).toBe('2026-10-02')
  })

  test('shows the first tool error and accepts a subsequent valid result', async () => {
    const bridge = createHostBridge()
    host.connect.mockImplementationOnce(async () => {
      host.listeners.get('toolresult')?.({
        isError: true,
        content: [{ type: 'text', text: 'Calendar unavailable' }],
      })
    })
    await bridge.connect()
    expect(bridge.content.value).toBeUndefined()
    expect(bridge.error.value).toBe('Calendar unavailable')
    host.listeners.get('toolresult')?.(calendarResult('2026-10-01'))
    expect(bridge.error.value).toBeUndefined()
    expect(bridge.content.value?.calendar).toContain('BEGIN:VCALENDAR')
  })

  test('reports missing first data after the bounded startup timeout', async () => {
    vi.useFakeTimers()
    const bridge = createHostBridge()
    const connecting = bridge.connect(50)
    await vi.advanceTimersByTimeAsync(51)
    await connecting
    expect(bridge.error.value).toBe('Initial MCP tool result timed out')
    expect(bridge.connecting.value).toBe(false)
    expect(host.callServerTool).not.toHaveBeenCalled()
  })

  test('reports a handshake failure and unsupported server tools', async () => {
    host.connect.mockRejectedValueOnce(new Error('Disconnected'))
    const failed = createHostBridge()
    await failed.connect()
    expect(failed.error.value).toBe('Disconnected')
    expect(failed.connected.value).toBe(false)
    host.serverTools = false
    const unsupported = createHostBridge()
    await unsupported.connect()
    expect(unsupported.error.value).toBe(
      'MCP host does not support serverTools',
    )
    expect(unsupported.connected.value).toBe(false)
  })

  test.each([
    ['2026-03-29', '2026-03-28T23:00:00Z', '2026-03-29T21:59:59.999999999Z'],
    ['2026-10-25', '2026-10-24T22:00:00Z', '2026-10-25T22:59:59.999999999Z'],
  ])(
    'requests the complete local day across DST on %s using only read tools',
    async (day, start, end) => {
      const bridge = createHostBridge()
      host.callServerTool.mockResolvedValueOnce(calendarResult(day))
      await bridge.loadDay(day, 'Europe/Berlin')
      expect(host.callServerTool).toHaveBeenCalledExactlyOnceWith({
        name: 'list-calendar-tasks',
        arguments: { start_date: start, end_date: end },
      })
      expect(bridge.content.value?.selectedDate).toBe(day)
    },
  )

  test('teardown stops resize notifications', async () => {
    const bridge = createHostBridge()
    host.connect.mockImplementationOnce(async () => {
      host.listeners.get('toolresult')?.(calendarResult('2026-10-01'))
    })
    await bridge.connect()
    await host.teardown?.()
    expect(host.stopResize).toHaveBeenCalledOnce()
  })

  test.each(['close', 'teardown'])(
    '%s during startup cancels the first-result wait and does not report a late timeout',
    async (action) => {
      vi.useFakeTimers()
      const bridge = createHostBridge()
      const connecting = bridge.connect(50)
      await vi.advanceTimersByTimeAsync(0)
      expect(bridge.connecting.value).toBe(true)
      if (action === 'close') await bridge.close()
      else await host.teardown?.()
      expect(bridge.connecting.value).toBe(false)
      expect(bridge.connected.value).toBe(false)
      await vi.advanceTimersByTimeAsync(51)
      await connecting
      expect(bridge.error.value).not.toBe('Initial MCP tool result timed out')
    },
  )

  test('a failed read preserves the visible calendar and allows retry', async () => {
    const bridge = createHostBridge()
    host.listeners.get('toolresult')?.(calendarResult('2026-10-01'))
    const original = bridge.content.value
    host.callServerTool.mockRejectedValueOnce(new Error('Read unavailable'))
    await expect(bridge.loadDay('2026-10-02', 'Europe/Moscow')).rejects.toThrow(
      'Read unavailable',
    )
    expect(bridge.content.value).toBe(original)
    host.callServerTool.mockResolvedValueOnce(calendarResult('2026-10-02'))
    await bridge.loadDay('2026-10-02', 'Europe/Moscow')
    expect(bridge.content.value?.selectedDate).toBe('2026-10-02')
    expect(
      host.callServerTool.mock.calls.every(
        ([request]) => request.name === 'list-calendar-tasks',
      ),
    ).toBe(true)
  })

  test('stays closed when a pending handshake completes and ignores late results', async () => {
    let finishHandshake: () => void = () => undefined
    host.connect.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishHandshake = resolve
        }),
    )
    const bridge = createHostBridge()
    const connecting = bridge.connect()
    await bridge.close()
    finishHandshake()
    await connecting
    host.listeners.get('toolresult')?.(calendarResult('2026-10-01'))
    expect(bridge.connected.value).toBe(false)
    expect(bridge.connecting.value).toBe(false)
    expect(bridge.content.value).toBeUndefined()
    expect(bridge.error.value).toBeUndefined()
    expect(host.callServerTool).not.toHaveBeenCalled()
  })
})
