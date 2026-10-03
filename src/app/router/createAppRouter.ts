import { LocalStorage, Notify, SessionStorage } from 'quasar'
import { createRouter, createWebHistory } from 'vue-router'
import useAuthStore from '@/entities/oidc-session'
import useLangStore from '@/shared/model/lang'
import { deleteDatabases, reset } from '@/shared/lib/databaseService'
import { ROUTE_NAMES } from '@/shared/config/routes'
import routes from './routes'

export function createAppRouter() {
  let backendUnavailable = false
  let sessionRestore: Promise<void> | undefined
  const router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHistory(String(import.meta.env.QUASAR_VUE_ROUTER_BASE)),
  })

  function restoreSession(authStore: ReturnType<typeof useAuthStore>) {
    sessionRestore ??= authStore
      .restoreSession()
      .then((): void => undefined)
      .catch((error: unknown) => {
        backendUnavailable = true
        const langStore = useLangStore()
        console.warn(
          'Unable to restore BFF session; continuing offline:',
          error,
        )
        Notify.create({
          group: false,
          icon: 'cloud_off',
          message: langStore.isRussian
            ? 'Бэкенд недоступен. Приложение работает локально.'
            : 'Backend unavailable. The app is working locally.',
          timeout: 0,
          type: 'warning',
        })
      })

    return sessionRestore
  }

  router.beforeEach(async (to) => {
    if (to.path === '/reset') {
      LocalStorage.clear()
      SessionStorage.clear()
      await reset()
      deleteDatabases()
      window.location.replace(ROUTE_NAMES.PROMO)
      return false
    }

    const lang = typeof to.query.lang === 'string' ? to.query.lang : undefined
    if (lang) {
      useLangStore().setLang(lang)
    }

    const authStore = useAuthStore()
    if (to.name === ROUTE_NAMES.PROMO || to.name === ROUTE_NAMES.PRIVACY) {
      void restoreSession(authStore)
      return true
    }

    await restoreSession(authStore)

    if (to.name === ROUTE_NAMES.LOGIN) {
      if (backendUnavailable || authStore.isLoggedIn) {
        return { name: ROUTE_NAMES.ARCHIVE, query: { page: 1 } }
      }
      return true
    }

    if (backendUnavailable) {
      return true
    }

    if (!authStore.isLoggedIn) {
      return { name: ROUTE_NAMES.LOGIN, query: {} }
    }

    return true
  })

  return router
}
