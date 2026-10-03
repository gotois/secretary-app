import { boot } from 'quasar/wrappers'
import { silentResubscribe } from '@/features/web-push'

export default boot(() => {
  if (!import.meta.env.QUASAR_PWA_MODE) {
    return
  }
  if (!navigator.serviceWorker) {
    return
  }

  silentResubscribe().catch((error) => {
    console.error('WebPush boot error:', error)
  })
})
