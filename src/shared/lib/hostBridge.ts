import type {
  App,
  McpUiToolInputNotification,
  McpUiToolResultNotification,
} from '@modelcontextprotocol/ext-apps'
import { inject, type InjectionKey } from 'vue'

export const CHATGPT_WIDGET_STATE_KEY = 'secretaryCalendar'

export interface ChatGPTTask {
  id_task: number
  name: string
  description?: string | null
  id_tasks_status?: number
  task_status_name?: string
  id_category?: number
  category_name?: string
  priority?: number
  created_at?: string
  updated_at?: string
  estimated_unix_time?: number
  start_date: string
  end_date?: string | null
  id_parent_task?: number
  latitude?: number
  longitude?: number
  location?: string | null
  id_cal_class?: number
  link_meeting?: string | null
  actual_start_date?: string
  actual_end_date?: string
  uid_task?: string
  i_cal_class_name?: string
  id_recurrence?: number
  notification_date_time?: string
  remind_before?: number
  sequence?: number
  attendee?: number[]
  targetType?: 'Group' | 'Person'
}

export interface ChatGPTStructuredContent {
  view: 'calendar' | 'create-form'
  tasks?: ChatGPTTask[]
  selectedDate?: string
  timezone?: string
}

export interface ChatGPTTaskModalState {
  mode: 'view' | 'edit' | 'create'
  taskId?: number
}

export interface ChatGPTMessageModalState {
  mode: 'alert' | 'confirm'
  message: string
  requestId: string
}

export type ChatGPTModalState = ChatGPTTaskModalState | ChatGPTMessageModalState

export interface ChatGPTWidgetState {
  content?: ChatGPTStructuredContent
}

export interface ChatGPTToolResult {
  structuredContent?: ChatGPTStructuredContent
  content?: Array<{ type: string; text?: string }>
  isError?: boolean
}

export interface OpenAIGlobals {
  toolInput?: Record<string, unknown>
  widgetState?: Record<string, unknown>
  requestModal?: (options?: {
    params?: Record<string, unknown>
    template?: string
  }) => Promise<unknown>
  setWidgetState?: (state: Record<string, unknown>) => void
}

export interface HostBridge {
  readonly isAvailable: boolean
  readonly theme?: 'light' | 'dark'
  readonly locale?: string
  readonly timezone?: string
  readonly toolInput?: Record<string, unknown>
  readonly toolOutput?: ChatGPTStructuredContent
  readonly widgetState?: ChatGPTWidgetState
  callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ChatGPTToolResult>
  requestModal(params: ChatGPTModalState): Promise<boolean>
  requestClose(): Promise<void>
  setWidgetState(state: ChatGPTWidgetState): void
  subscribe(callback: () => void): () => void
  dispose(): void
}

class PassiveHostBridge implements HostBridge {
  readonly isAvailable = false

  async callTool(): Promise<ChatGPTToolResult> {
    throw new Error('ChatGPT tools are unavailable')
  }

  async requestModal(): Promise<boolean> {
    return false
  }

  async requestClose(): Promise<void> {}

  setWidgetState(): void {}

  subscribe(): () => void {
    return () => {}
  }

  dispose(): void {}
}

type ToolInput = McpUiToolInputNotification['params']['arguments']
type ToolResult = McpUiToolResultNotification['params']

function isModalInput(
  input?: Record<string, unknown>,
): input is Record<string, unknown> & ChatGPTModalState {
  if (input?.mode === 'alert' || input?.mode === 'confirm') {
    return (
      typeof input.message === 'string' && typeof input.requestId === 'string'
    )
  }
  return (
    input?.mode === 'create' || input?.mode === 'view' || input?.mode === 'edit'
  )
}

export function isChatGPTMessageModalState(
  input?: Record<string, unknown>,
): input is Record<string, unknown> & ChatGPTMessageModalState {
  return (
    (input?.mode === 'alert' || input?.mode === 'confirm') &&
    typeof input.message === 'string' &&
    typeof input.requestId === 'string'
  )
}

export function isChatGPTTaskModalState(
  input?: Record<string, unknown>,
): input is Record<string, unknown> & ChatGPTTaskModalState {
  return (
    input?.mode === 'create' || input?.mode === 'view' || input?.mode === 'edit'
  )
}

function isChatGPTStructuredContent(
  content: unknown,
): content is ChatGPTStructuredContent {
  if (!content || typeof content !== 'object') {
    return false
  }
  const value = content as Record<string, unknown>
  return (
    (value.view === 'calendar' || value.view === 'create-form') &&
    (value.tasks === undefined || Array.isArray(value.tasks)) &&
    (value.selectedDate === undefined ||
      typeof value.selectedDate === 'string') &&
    (value.timezone === undefined || typeof value.timezone === 'string')
  )
}

function normalizeToolResult(result: ToolResult): ChatGPTToolResult {
  return {
    structuredContent: isChatGPTStructuredContent(result.structuredContent)
      ? result.structuredContent
      : undefined,
    content: result.content?.map((item) =>
      item.type === 'text'
        ? { type: item.type, text: item.text }
        : { type: item.type },
    ),
    isError: result.isError,
  }
}

class McpAppHostBridge implements HostBridge {
  readonly isAvailable = true
  private input?: ToolInput
  private output?: ChatGPTStructuredContent
  private readonly subscribers = new Set<() => void>()

  constructor(private readonly mcpApp: App) {
    const modalInput = window.openai?.toolInput
    if (isModalInput(modalInput)) {
      this.input = modalInput
    }
    this.mcpApp.addEventListener('toolinput', ({ arguments: input }) => {
      this.input = input
      this.notifySubscribers()
    })
    this.mcpApp.addEventListener('toolresult', (result) => {
      this.output = normalizeToolResult(result).structuredContent
      this.notifySubscribers()
    })
    this.mcpApp.addEventListener('hostcontextchanged', () => {
      this.notifySubscribers()
    })
    window.addEventListener('openai:set_globals', this.onOpenAIGlobals, {
      passive: true,
    })
  }

  get theme(): 'light' | 'dark' | undefined {
    return this.mcpApp.getHostContext()?.theme
  }

  get locale(): string | undefined {
    return this.mcpApp.getHostContext()?.locale
  }

  get timezone(): string | undefined {
    return this.mcpApp.getHostContext()?.timeZone
  }

  get toolInput(): Record<string, unknown> | undefined {
    return this.input
  }

  get toolOutput(): ChatGPTStructuredContent | undefined {
    return this.output
  }

  get widgetState(): ChatGPTWidgetState | undefined {
    const state = window.openai?.widgetState?.[CHATGPT_WIDGET_STATE_KEY]
    return state && typeof state === 'object'
      ? (state as ChatGPTWidgetState)
      : undefined
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<ChatGPTToolResult> {
    const result = normalizeToolResult(
      await this.mcpApp.callServerTool({
        name,
        arguments: args,
      }),
    )
    if (result.isError) {
      const message = result.content
        ?.map((item) => item.text)
        .filter(Boolean)
        .join('\n')
      throw new Error(message || `Tool ${name} failed`)
    }
    return result
  }

  async requestModal(params: ChatGPTModalState): Promise<boolean> {
    if (!window.openai?.requestModal) {
      return false
    }
    await window.openai.requestModal({
      params: params as unknown as Record<string, unknown>,
    })
    return true
  }

  async requestClose(): Promise<void> {
    await this.mcpApp.requestTeardown()
  }

  setWidgetState(state: ChatGPTWidgetState): void {
    window.openai?.setWidgetState?.({
      ...window.openai.widgetState,
      [CHATGPT_WIDGET_STATE_KEY]: state,
    })
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  dispose(): void {
    window.removeEventListener('openai:set_globals', this.onOpenAIGlobals)
    this.subscribers.clear()
  }

  private readonly onOpenAIGlobals = (
    event: WindowEventMap['openai:set_globals'],
  ): void => {
    const input = event.detail.globals.toolInput
    if (isModalInput(input)) {
      this.input = input
    }
    this.notifySubscribers()
  }

  private notifySubscribers(): void {
    for (const callback of this.subscribers) {
      callback()
    }
  }
}

export const HOST_BRIDGE_KEY: InjectionKey<HostBridge> = Symbol(
  'secretary-host-bridge',
)

let hostBridge: HostBridge = new PassiveHostBridge()

export function initializeHostBridge(mcpApp?: App): HostBridge {
  hostBridge = mcpApp ? new McpAppHostBridge(mcpApp) : new PassiveHostBridge()
  return hostBridge
}

export function getHostBridge(): HostBridge {
  return hostBridge
}

export function useHostBridge(): HostBridge {
  return inject(HOST_BRIDGE_KEY, hostBridge)
}

declare global {
  interface Window {
    openai?: OpenAIGlobals
  }

  interface WindowEventMap {
    'openai:set_globals': CustomEvent<{
      globals: Partial<OpenAIGlobals>
    }>
  }
}
