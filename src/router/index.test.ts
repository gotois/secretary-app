import { afterEach, expect, test, vi } from 'vitest'

const browser = vi.hoisted(() => ({ create: vi.fn(() => ({ browser: true })) }))
vi.mock('quasar/wrappers', () => ({ route: (factory: unknown) => factory }))
vi.mock('@/app/router', () => ({ createAppRouter: browser.create }))
import createRouter from './index'

afterEach(() => vi.unstubAllEnvs())

test('embedded router uses memory history and does not initialize browser auth', async () => {
  vi.stubEnv('MCP_APP', 'true')
  const router = await createRouter({} as never)
  await router.push('/')
  expect(router.getRoutes()).toHaveLength(1)
  expect(browser.create).not.toHaveBeenCalled()
  expect(router.options.history.location).toBe('/')
})

test('browser mode uses the existing application router', async () => {
  vi.stubEnv('MCP_APP', 'false')
  expect(await createRouter({} as never)).toEqual({ browser: true })
  expect(browser.create).toHaveBeenCalledOnce()
})
