import { popup } from '@tma.js/sdk'
import { useQuasar } from 'quasar'
import { isMcpApp, isTMA } from './detector'
import {
  isMcpTaskModalState,
  useHostBridge,
  type McpMessageModalState,
} from './mcp/hostBridge'

const MCP_MODAL_TIMEOUT_MS = 60_000
const MCP_MODAL_CHANNEL_PREFIX = 'secretary-modal:'

export interface McpModalResult {
  requestId: string
  confirmed: boolean
}

export function getMcpModalChannelName(requestId: string): string {
  return `${MCP_MODAL_CHANNEL_PREFIX}${requestId}`
}

function isMcpAppModalResult(
  value: unknown,
  requestId: string,
): value is McpModalResult {
  if (!value || typeof value !== 'object') {
    return false
  }
  const result = value as Record<string, unknown>
  return result.requestId === requestId && typeof result.confirmed === 'boolean'
}

export function useModal() {
  const $q = useQuasar()
  const bridge = useHostBridge()

  function quasarAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      $q.dialog({ message }).onDismiss(resolve)
    })
  }

  function quasarConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false
      const finish = (confirmed: boolean) => {
        if (settled) {
          return
        }
        settled = true
        resolve(confirmed)
      }
      $q.dialog({ message, cancel: true })
        .onOk(() => finish(true))
        .onCancel(() => finish(false))
        .onDismiss(() => finish(false))
    })
  }

  async function telegramAlert(message: string): Promise<void> {
    if (!popup.isSupported()) {
      await quasarAlert(message)
      return
    }
    try {
      await popup.show({ message, buttons: [{ type: 'close' }] })
    } catch (error) {
      console.error('Unable to open Telegram alert:', error)
      await quasarAlert(message)
    }
  }

  async function telegramConfirm(message: string): Promise<boolean> {
    if (!popup.isSupported()) {
      return quasarConfirm(message)
    }
    try {
      const buttonId = await popup.show({
        message,
        buttons: [
          { id: 'confirm', type: 'ok' },
          { id: 'cancel', type: 'cancel' },
        ],
      })
      return buttonId === 'confirm'
    } catch (error) {
      console.error('Unable to open Telegram confirm:', error)
      return quasarConfirm(message)
    }
  }

  function mcpModal(
    mode: McpMessageModalState['mode'],
    message: string,
  ): Promise<boolean> {
    const requestId = crypto.randomUUID()
    const channel = new BroadcastChannel(getMcpModalChannelName(requestId))
    return new Promise((resolve) => {
      let settled = false
      const finish = (confirmed: boolean) => {
        if (settled) {
          return
        }
        settled = true
        window.clearTimeout(timeout)
        channel.close()
        resolve(confirmed)
      }
      const timeout = window.setTimeout(
        () => finish(false),
        MCP_MODAL_TIMEOUT_MS,
      )
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (isMcpAppModalResult(event.data, requestId)) {
          finish(event.data.confirmed)
        }
      }
      void bridge
        .requestModal({ mode, message, requestId })
        .then((opened) => {
          if (!opened) {
            finish(false)
          }
        })
        .catch((error) => {
          console.error('Unable to open Mcp modal:', error)
          finish(false)
        })
    })
  }

  async function alert(message: string): Promise<void> {
    if (isMcpApp.value) {
      if (isMcpTaskModalState(bridge.toolInput)) {
        await quasarAlert(message)
        return
      }
      await mcpModal('alert', message)
      return
    }
    if (isTMA.value) {
      await telegramAlert(message)
      return
    }
    await quasarAlert(message)
  }

  async function confirm(message: string): Promise<boolean> {
    if (isMcpApp.value) {
      if (isMcpTaskModalState(bridge.toolInput)) {
        return quasarConfirm(message)
      }
      return mcpModal('confirm', message)
    }
    if (isTMA.value) {
      return telegramConfirm(message)
    }
    return quasarConfirm(message)
  }

  return { alert, confirm }
}
