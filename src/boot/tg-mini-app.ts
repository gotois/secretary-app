import { boot } from 'quasar/wrappers'
import { init, retrieveLaunchParams, viewport } from '@tma.js/sdk'
import type { Router } from 'vue-router'
import { isChatGPT, isTMA, isWebApp } from '@/shared/lib/detector'
import { appendErundaScript } from '@/shared/lib/debug'
import { appendTelegramWebAppScript } from '@/shared/lib/telegram'

function getParams(params: string) {
  const { to, debug, twa } = JSON.parse(atob(params))

  return {
    to,
    debug,
    twa,
  }
}

export default boot(({ router }: { router: Router }) => {
  if (isChatGPT.value) {
    return
  }

  if (!isTMA.value && !isWebApp.value) {
    console.log('It is not TMA. Skipping...')
    return
  }
  init()
  viewport.expand()
  const { payload, tgWebAppStartParam } = retrieveLaunchParams()
  const startParams =
    typeof payload === 'string'
      ? payload
      : typeof tgWebAppStartParam === 'string'
        ? tgWebAppStartParam
        : ''
  if (startParams) {
    const { to, debug, twa } = getParams(startParams)
    if (typeof to === 'string') {
      router
        .isReady()
        .then(() => router.replace(decodeURIComponent(to)))
        .catch((error) => console.error(error))
    }
    if (debug) {
      appendErundaScript()
    }
    if (twa) {
      appendTelegramWebAppScript()
    }
  }
})
