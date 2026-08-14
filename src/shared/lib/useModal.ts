import { popup } from '@tma.js/sdk'
import { useQuasar } from 'quasar'
import { isChatGPT, isTMA } from './detector'
import {
  isChatGPTTaskModalState,
  useHostBridge,
  type ChatGPTMessageModalState,
} from './hostBridge'

const CHATGPT_MODAL_TIMEOUT_MS = 60_000
const CHATGPT_MODAL_CHANNEL_PREFIX = 'secretary-modal:'

export interface ChatGPTModalResult {
  requestId: string
  confirmed: boolean
}

export function getChatGPTModalChannelName(requestId: string): string {
  return `${CHATGPT_MODAL_CHANNEL_PREFIX}${requestId}`
}

function isChatGPTModalResult(
  value: unknown,
  requestId: string,
): value is ChatGPTModalResult {
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

  function chatGPTModal(
    mode: ChatGPTMessageModalState['mode'],
    message: string,
  ): Promise<boolean> {
    const requestId = crypto.randomUUID()
    const channel = new BroadcastChannel(getChatGPTModalChannelName(requestId))
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
        CHATGPT_MODAL_TIMEOUT_MS,
      )
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (isChatGPTModalResult(event.data, requestId)) {
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
          console.error('Unable to open ChatGPT modal:', error)
          finish(false)
        })
    })
  }

  async function alert(message: string): Promise<void> {
    if (isChatGPT.value) {
      if (isChatGPTTaskModalState(bridge.toolInput)) {
        await quasarAlert(message)
        return
      }
      await chatGPTModal('alert', message)
      return
    }
    if (isTMA.value) {
      await telegramAlert(message)
      return
    }
    await quasarAlert(message)
  }

  async function confirm(message: string): Promise<boolean> {
    if (isChatGPT.value) {
      if (isChatGPTTaskModalState(bridge.toolInput)) {
        return quasarConfirm(message)
      }
      return chatGPTModal('confirm', message)
    }
    if (isTMA.value) {
      return telegramConfirm(message)
    }
    return quasarConfirm(message)
  }

  return { alert, confirm }
}
