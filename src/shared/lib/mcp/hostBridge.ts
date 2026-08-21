import type {
  App,
  McpUiToolInputNotification,
  McpUiToolResultNotification,
} from '@modelcontextprotocol/ext-apps'
import { inject, type InjectionKey } from 'vue'
import {
  getMcpHostCapabilities,
  getOpenAiToolInput,
  getOpenAiWidgetState,
  requestOpenAiModal,
  setOpenAiWidgetState,
  subscribeOpenAiGlobals,
  type McpHostCapabilities,
} from '@/shared/lib/openai/extensions'

export const MCP_WIDGET_STATE_KEY = 'secretaryCalendar'

export interface McpTask {
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

export interface McpStructuredContent {
  view: 'calendar' | 'create-form'
  tasks?: McpTask[]
  selectedDate?: string
  timezone?: string
}

export interface McpTaskModalState {
  mode: 'view' | 'edit' | 'create'
  taskId?: number
}

export interface McpMessageModalState {
  mode: 'alert' | 'confirm'
  message: string
  requestId: string
}

export type McpModalState = McpTaskModalState | McpMessageModalState

export interface McpWidgetState {
  content?: McpStructuredContent
}

export interface McpToolResult {
  structuredContent?: McpStructuredContent
  content?: Array<{ type: string; text?: string }>
  isError?: boolean
}

export interface HostBridge {
  readonly isAvailable: boolean
  readonly capabilities: McpHostCapabilities
  readonly theme?: 'light' | 'dark'
  readonly locale?: string
  readonly timezone?: string
  readonly toolInput?: Record<string, unknown>
  readonly toolOutput?: McpStructuredContent
  readonly widgetState?: McpWidgetState
  callTool(name: string, args: Record<string, unknown>): Promise<McpToolResult>
  requestModal(params: McpModalState): Promise<boolean>
  requestClose(): Promise<void>
  setWidgetState(state: McpWidgetState): void
  subscribe(callback: () => void): () => void
  dispose(): void
}

class PassiveHostBridge implements HostBridge {
  readonly isAvailable = false
  readonly capabilities: McpHostCapabilities = {
    nativeModal: false,
    persistentWidgetState: false,
  }

  async callTool(): Promise<McpToolResult> {
    throw new Error('Mcp tools are unavailable')
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
): input is Record<string, unknown> & McpModalState {
  if (input?.mode === 'alert' || input?.mode === 'confirm') {
    return (
      typeof input.message === 'string' && typeof input.requestId === 'string'
    )
  }
  return (
    input?.mode === 'create' || input?.mode === 'view' || input?.mode === 'edit'
  )
}

export function isMcpMessageModalState(
  input?: Record<string, unknown>,
): input is Record<string, unknown> & McpMessageModalState {
  return (
    (input?.mode === 'alert' || input?.mode === 'confirm') &&
    typeof input.message === 'string' &&
    typeof input.requestId === 'string'
  )
}

export function isMcpTaskModalState(
  input?: Record<string, unknown>,
): input is Record<string, unknown> & McpTaskModalState {
  return (
    input?.mode === 'create' || input?.mode === 'view' || input?.mode === 'edit'
  )
}

function isMcpStructuredContent(
  content: unknown,
): content is McpStructuredContent {
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

function normalizeToolResult(result: ToolResult): McpToolResult {
  return {
    structuredContent: isMcpStructuredContent(result.structuredContent)
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
  readonly capabilities = getMcpHostCapabilities()
  private input?: ToolInput
  private output?: McpStructuredContent
  private readonly subscribers = new Set<() => void>()

  constructor(private readonly mcpApp: App) {
    const modalInput = getOpenAiToolInput()
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
    this.unsubscribeOpenAiGlobals = subscribeOpenAiGlobals(this.onOpenAiGlobals)
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

  get toolOutput(): McpStructuredContent | undefined {
    return this.output
  }

  get widgetState(): McpWidgetState | undefined {
    return getOpenAiWidgetState(MCP_WIDGET_STATE_KEY)
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpToolResult> {
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

  async requestModal(params: McpModalState): Promise<boolean> {
    return requestOpenAiModal(params)
  }

  async requestClose(): Promise<void> {
    await this.mcpApp.requestTeardown()
  }

  setWidgetState(state: McpWidgetState): void {
    setOpenAiWidgetState(MCP_WIDGET_STATE_KEY, state)
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  dispose(): void {
    this.unsubscribeOpenAiGlobals()
    this.subscribers.clear()
  }

  private unsubscribeOpenAiGlobals = () => {}

  private readonly onOpenAiGlobals = (): void => {
    const input = getOpenAiToolInput()
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
