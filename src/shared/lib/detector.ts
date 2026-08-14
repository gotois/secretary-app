import { computed } from 'vue'
import { Platform } from 'quasar'
import * as tgAppSDK from '@tma.js/sdk'
import { host } from '../../../twa-manifest.json'
import { isChatGPTHost } from './chatgptHost'

export const isTWA = computed(() => {
  return Platform.is.android && document.referrer.includes('android-app://')
})

export const isTMA = computed(() => {
  return tgAppSDK.isTMA()
})

export const isWebApp = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return Boolean(window?.TelegramWebviewProxy || window?.Telegram?.WebView)
})

export const isPWA = computed(() => {
  return document.location.host === host
})

export const isChatGPT = computed(() => isChatGPTHost(document))
