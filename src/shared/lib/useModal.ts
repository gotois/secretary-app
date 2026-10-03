import { popup } from '@tma.js/sdk'
import { useQuasar } from 'quasar'
import { isTMA } from './detector'

export function useModal() {
  const $q = useQuasar()

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

  async function alert(message: string): Promise<void> {
    if (isTMA.value) {
      await telegramAlert(message)
      return
    }
    await quasarAlert(message)
  }

  async function confirm(message: string): Promise<boolean> {
    if (isTMA.value) {
      return telegramConfirm(message)
    }
    return quasarConfirm(message)
  }

  return { alert, confirm }
}
