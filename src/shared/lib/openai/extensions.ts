import type { McpModalState, McpWidgetState } from '@/shared/lib/mcp/hostBridge'

export interface OpenAiGlobals {
  toolInput?: Record<string, unknown>
  widgetState?: Record<string, unknown>
  requestModal?: (options?: {
    params?: Record<string, unknown>
    template?: string
  }) => Promise<unknown>
  setWidgetState?: (state: Record<string, unknown>) => void
}

export interface McpHostCapabilities {
  nativeModal: boolean
  persistentWidgetState: boolean
}

export function getMcpHostCapabilities(): McpHostCapabilities {
  return {
    nativeModal: typeof window.openai?.requestModal === 'function',
    persistentWidgetState: typeof window.openai?.setWidgetState === 'function',
  }
}

export function getOpenAiToolInput(): Record<string, unknown> | undefined {
  return window.openai?.toolInput
}

export function getOpenAiWidgetState(key: string): McpWidgetState | undefined {
  const state = window.openai?.widgetState?.[key]
  return state && typeof state === 'object'
    ? (state as McpWidgetState)
    : undefined
}

export async function requestOpenAiModal(
  params: McpModalState,
): Promise<boolean> {
  if (!window.openai?.requestModal) {
    return false
  }
  await window.openai.requestModal({
    params: params as unknown as Record<string, unknown>,
  })
  return true
}

export function setOpenAiWidgetState(key: string, state: McpWidgetState): void {
  window.openai?.setWidgetState?.({
    ...window.openai.widgetState,
    [key]: state,
  })
}

export function subscribeOpenAiGlobals(callback: () => void): () => void {
  window.addEventListener('openai:set_globals', callback, { passive: true })
  return () => window.removeEventListener('openai:set_globals', callback)
}

declare global {
  interface Window {
    openai?: OpenAiGlobals
  }
}
