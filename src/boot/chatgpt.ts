import type {
  McpUiToolResultNotification,
  PostMessageTransport as McpPostMessageTransport,
} from '@modelcontextprotocol/ext-apps'
import { Dark, LocalStorage } from 'quasar'
import { boot } from 'quasar/wrappers'
import type { RouteLocationRaw, Router } from 'vue-router'
import packageInfo from '../../package.json' with { type: 'json' }
import { normalizeLocale } from '@/i18n'
import { ROUTE_NAMES } from '@/shared/config/routes'
import { appendErundaScript } from '@/shared/lib/debug'
import { isChatGPT } from '@/shared/lib/detector'
import {
  HOST_BRIDGE_KEY,
  initializeHostBridge,
  isChatGPTMessageModalState,
  type ChatGPTModalState,
  type HostBridge,
} from '@/shared/lib/hostBridge'

const MCP_CONNECT_TIMEOUT_MS = 30_000
const MCP_RESULT_TIMEOUT_MS = 30_000

type ToolResult = McpUiToolResultNotification['params']
type TransportMessage = Parameters<McpPostMessageTransport['send']>[0]
type TransportSendOptions = Parameters<McpPostMessageTransport['send']>[1]
type LifecycleDetails = Record<string, string | number | boolean | undefined>
type LifecycleLogger = (event: string, details?: LifecycleDetails) => void

export function getModalState(
  input?: Record<string, unknown>,
): ChatGPTModalState | undefined {
  if (isChatGPTMessageModalState(input)) {
    return {
      mode: input.mode,
      message: input.message,
      requestId: input.requestId,
    }
  }
  if (
    input?.mode !== 'create' &&
    input?.mode !== 'view' &&
    input?.mode !== 'edit'
  ) {
    return undefined
  }
  const taskId =
    typeof input.taskId === 'number' && Number.isFinite(input.taskId)
      ? input.taskId
      : undefined
  if (input.mode !== 'create' && taskId === undefined) {
    return undefined
  }
  return {
    mode: input.mode,
    taskId,
  }
}

export function getInitialRoute(
  input?: Record<string, unknown>,
): RouteLocationRaw {
  const modal = getModalState(input)
  if (modal?.mode === 'create') {
    return { name: ROUTE_NAMES.NEW }
  }
  if (modal?.mode === 'view') {
    return {
      name: ROUTE_NAMES.VIEW,
      params: { taskId: modal.taskId },
    }
  }
  if (modal?.mode === 'edit') {
    return {
      name: ROUTE_NAMES.EDIT,
      params: { taskId: modal.taskId },
    }
  }
  return { name: ROUTE_NAMES.CALENDAR }
}

function applyHostPreferences(bridge: HostBridge): void {
  Dark.set(bridge.theme === 'dark')
  if (bridge.locale) {
    LocalStorage.set('locale', normalizeLocale(bridge.locale))
  }
}

async function openInitialRoute(
  router: Router,
  bridge: HostBridge,
): Promise<void> {
  await router.isReady()
  await router.replace(getInitialRoute(bridge.toolInput))
}

function createLifecycleLogger(): LifecycleLogger {
  const startedAt = performance.now()
  return (event, details = {}) => {
    console.info('[Secretary MCP]', {
      event,
      timestamp: new Date().toISOString(),
      elapsedMs: Math.round(performance.now() - startedAt),
      ...details,
    })
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function installLifecycleDiagnostics(log: LifecycleLogger): void {
  window.addEventListener('pagehide', () => log('pagehide'), { passive: true })
  document.addEventListener(
    'visibilitychange',
    () => log('visibilitychange', { state: document.visibilityState }),
    { passive: true },
  )
  window.addEventListener(
    'error',
    (event) => log('error', { message: event.message || 'Unknown error' }),
    { passive: true },
  )
  window.addEventListener(
    'unhandledrejection',
    (event) =>
      log('unhandledrejection', {
        message: errorMessage(event.reason),
      }),
    { passive: true },
  )
}

function renderStartupState(
  title: string,
  detail?: string,
  isError = false,
): void {
  const root = document.getElementById('q-app')
  if (!root) {
    return
  }

  const status = document.createElement('main')
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.style.cssText = [
    'min-height:160px',
    'display:flex',
    'flex-direction:column',
    'gap:8px',
    'align-items:center',
    'justify-content:center',
    'padding:24px',
    'font:14px system-ui,sans-serif',
    `color:${isError ? '#b42318' : '#667085'}`,
    'text-align:center',
  ].join(';')

  const heading = document.createElement('strong')
  heading.textContent = title
  status.append(heading)
  if (detail) {
    const description = document.createElement('span')
    description.textContent = detail
    status.append(description)
  }
  root.replaceChildren(status)
}

function toolResultError(result: ToolResult): string | undefined {
  const message = result.content
    ?.filter((item) => item.type === 'text')
    .map((item) => item.text)
    .filter(Boolean)
    .join('\n')
  return message?.slice(0, 500)
}

async function waitForInitialViewData(
  bridge: HostBridge,
  firstToolResult: Promise<ToolResult>,
): Promise<{ kind: 'modal' } | { kind: 'result'; result: ToolResult }> {
  if (getModalState(bridge.toolInput)) {
    return { kind: 'modal' }
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (
      value: { kind: 'modal' } | { kind: 'result'; result: ToolResult },
    ) => {
      if (settled) {
        return
      }
      settled = true
      window.clearTimeout(timeout)
      unsubscribe()
      resolve(value)
    }
    const timeout = window.setTimeout(() => {
      if (settled) {
        return
      }
      settled = true
      unsubscribe()
      reject(new Error('Initial MCP tool result timed out'))
    }, MCP_RESULT_TIMEOUT_MS)
    const unsubscribe = bridge.subscribe(() => {
      if (getModalState(bridge.toolInput)) {
        finish({ kind: 'modal' })
      }
    })
    firstToolResult.then((result) => finish({ kind: 'result', result }), reject)
  })
}

function applyConnectedHostPreferences(bridge: HostBridge): () => void {
  applyHostPreferences(bridge)
  return bridge.subscribe(() => {
    applyHostPreferences(bridge)
  })
}

export default boot(async ({ app: vueApp, router }) => {
  if (!isChatGPT.value) {
    vueApp.provide(HOST_BRIDGE_KEY, initializeHostBridge())
    return
  }

  const log = createLifecycleLogger()
  log('iframe started')
  installLifecycleDiagnostics(log)
  document.documentElement.classList.add('chatgpt-host')
  renderStartupState('Загрузка JavaScript…')

  try {
    appendErundaScript()
  } catch (error) {
    console.warn('[Secretary MCP] Unable to start Eruda:', error)
  }

  const { App, PostMessageTransport } =
    await import('@modelcontextprotocol/ext-apps')
  const mcpApp = new App(
    { name: 'Secretary Calendar', version: packageInfo.version },
    {},
    { autoResize: false, strict: true },
  )
  log('App created')

  const bridge = initializeHostBridge(mcpApp)
  vueApp.provide(HOST_BRIDGE_KEY, bridge)

  let resolveFirstToolResult!: (result: ToolResult) => void
  let initialToolResultReceived = false
  const firstToolResult = new Promise<ToolResult>((resolve) => {
    resolveFirstToolResult = resolve
  })
  mcpApp.addEventListener('toolinput', () => {
    log('tool input received')
  })
  mcpApp.addEventListener('toolresult', (result) => {
    log('tool result received', {
      isError: result.isError === true,
      hasStructuredContent: result.structuredContent !== undefined,
    })
    if (!initialToolResultReceived) {
      initialToolResultReceived = true
      resolveFirstToolResult(result)
    }
  })
  mcpApp.addEventListener('hostcontextchanged', () => {
    log('host context changed')
  })

  let unsubscribeHostPreferences = () => {}
  let stopAutoResize = () => {}
  mcpApp.onteardown = async () => {
    log('teardown requested')
    unsubscribeHostPreferences()
    stopAutoResize()
    bridge.dispose()
    return {}
  }

  class LifecyclePostMessageTransport extends PostMessageTransport {
    private initializeRequestId?: string | number
    private initializeResponseLogged = false

    constructor() {
      super(window.parent, window.parent)
    }

    private readonly receiveListener = (event: MessageEvent): void => {
      if (
        event.source !== window.parent ||
        !event.data ||
        typeof event.data !== 'object'
      ) {
        return
      }
      const message = event.data as Record<string, unknown>
      if (
        !this.initializeResponseLogged &&
        message.id === this.initializeRequestId &&
        ('result' in message || 'error' in message)
      ) {
        this.initializeResponseLogged = true
        log('ui/initialize response received', {
          isError: 'error' in message,
        })
      }
    }

    override async start(): Promise<void> {
      window.addEventListener('message', this.receiveListener)
      await super.start()
    }

    override async send(
      message: TransportMessage,
      options?: TransportSendOptions,
    ): Promise<void> {
      if (
        'method' in message &&
        message.method === 'ui/initialize' &&
        'id' in message &&
        (typeof message.id === 'string' || typeof message.id === 'number')
      ) {
        this.initializeRequestId = message.id
      }
      await super.send(message, options)
      if (
        'method' in message &&
        message.method === 'ui/notifications/initialized'
      ) {
        log('ui/notifications/initialized sent')
      }
    }

    override async close(): Promise<void> {
      window.removeEventListener('message', this.receiveListener)
      await super.close()
    }
  }

  renderStartupState('Подключение к MCP-хосту…')
  log('connect started')
  try {
    await mcpApp.connect(new LifecyclePostMessageTransport(), {
      timeout: MCP_CONNECT_TIMEOUT_MS,
      maxTotalTimeout: MCP_CONNECT_TIMEOUT_MS,
    })
  } catch (error) {
    log('connect failed', { message: errorMessage(error) })
    renderStartupState(
      'Не удалось подключиться к MCP-хосту',
      errorMessage(error),
      true,
    )
    throw error
  }
  log('handshake completed')
  stopAutoResize = mcpApp.setupSizeChangedNotifications()

  if (!mcpApp.getHostCapabilities()?.serverTools) {
    const error = new Error('MCP host does not support serverTools')
    log('connect failed', { message: error.message })
    renderStartupState(
      'Не удалось подключиться к MCP-хосту',
      error.message,
      true,
    )
    throw error
  }

  unsubscribeHostPreferences = applyConnectedHostPreferences(bridge)
  renderStartupState('Получение данных от MCP-хоста…')

  let initialViewData: Awaited<ReturnType<typeof waitForInitialViewData>>
  try {
    initialViewData = await waitForInitialViewData(bridge, firstToolResult)
  } catch (error) {
    log('initial tool result failed', { message: errorMessage(error) })
    renderStartupState(
      'Не удалось получить данные от MCP-хоста',
      errorMessage(error),
      true,
    )
    throw error
  }

  if (initialViewData.kind === 'result' && initialViewData.result.isError) {
    const detail =
      toolResultError(initialViewData.result) || 'MCP tool returned an error'
    const error = new Error(detail)
    log('initial tool result failed', { message: detail })
    renderStartupState('Не удалось получить данные от MCP-хоста', detail, true)
    throw error
  }

  log(
    initialViewData.kind === 'modal'
      ? 'native modal input detected'
      : 'initial tool result accepted',
  )
  renderStartupState('Открытие календаря…')
  openInitialRoute(router, bridge).catch((error) => {
    console.error('Unable to open ChatGPT route:', error)
  })
})
