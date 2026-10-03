import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ROUTE_NAMES } from '@/shared/config/routes'

const mocks = vi.hoisted(() => ({
  authStore: {
    isLoggedIn: false,
    restoreSession: vi.fn<() => Promise<boolean>>(),
  },
  notify: vi.fn(),
}))

vi.mock('quasar', () => ({
  LocalStorage: { clear: vi.fn() },
  Notify: { create: mocks.notify },
  SessionStorage: { clear: vi.fn() },
}))

vi.mock('@/entities/oidc-session', () => ({
  default: () => mocks.authStore,
}))

vi.mock('@/shared/model/lang', () => ({
  default: () => ({
    isRussian: true,
    setLang: vi.fn(),
  }),
}))

vi.mock('@/shared/lib/databaseService', () => ({
  deleteDatabases: vi.fn(),
  reset: vi.fn(),
}))

vi.mock('./routes', () => ({
  default: [
    { path: '/', name: 'archive', component: { template: '<div />' } },
    { path: '/login', name: 'login', component: { template: '<div />' } },
    { path: '/promo', name: 'promo', component: { template: '<div />' } },
    { path: '/privacy', name: 'privacy', component: { template: '<div />' } },
  ],
}))

import { createAppRouter } from './createAppRouter'

describe('createAppRouter', () => {
  beforeEach(() => {
    vi.stubEnv('QUASAR_VUE_ROUTER_BASE', '/')
    vi.stubGlobal('scrollTo', vi.fn())
    mocks.authStore.isLoggedIn = false
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test('opens the local app with a persistent toast when the backend is unavailable', async () => {
    const error = new TypeError(
      'NetworkError when attempting to fetch resource',
    )
    mocks.authStore.restoreSession.mockRejectedValueOnce(error)
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const router = createAppRouter()

    await router.push({ name: ROUTE_NAMES.ARCHIVE })

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.ARCHIVE)
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: 'cloud_off',
        message: 'Бэкенд недоступен. Приложение работает локально.',
        timeout: 0,
        type: 'warning',
      }),
    )
  })

  test('does not block public content while restoring the backend session', async () => {
    let rejectSession: (reason: unknown) => void = () => undefined
    mocks.authStore.restoreSession.mockReturnValueOnce(
      new Promise<boolean>((_resolve, reject) => {
        rejectSession = reject
      }),
    )
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const router = createAppRouter()

    await router.push({ name: ROUTE_NAMES.PROMO })

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.PROMO)
    expect(mocks.notify).not.toHaveBeenCalled()

    rejectSession(new TypeError('NetworkError'))
    await vi.waitFor(() => expect(mocks.notify).toHaveBeenCalledOnce())
  })

  test('redirects to login when the backend reports no authenticated session', async () => {
    mocks.authStore.restoreSession.mockResolvedValueOnce(false)
    const router = createAppRouter()

    await router.push({ name: ROUTE_NAMES.ARCHIVE })

    expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.LOGIN)
    expect(mocks.notify).not.toHaveBeenCalled()
  })
})
