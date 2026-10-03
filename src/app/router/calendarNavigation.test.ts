/* eslint-disable vue/one-component-per-file */
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

vi.mock('quasar', async () => ({
  ...(await vi.importActual<typeof import('quasar')>(
    'quasar/dist/quasar.client.js',
  )),
  useMeta: vi.fn(),
  useQuasar: () => ({
    dark: { isActive: false },
    platform: { is: { desktop: false } },
    notify: vi.fn(),
  }),
}))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/shared/lib/detector', async () => {
  const { computed } = await import('vue')
  return { isTMA: computed(() => false), isTWA: computed(() => false) }
})
vi.mock('@/features/web-push', async () => {
  const { ref } = await import('vue')
  return { default: () => ({ permission: ref('denied'), enable: vi.fn() }) }
})
vi.mock('@/widgets/calendar-view/ui/CalendarEventCard.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('@/widgets/calendar-view/ui/DayCalendar.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('@/shared/ui/ToolbarTitleComponent.vue', () => ({
  default: { template: '<div />' },
}))

import CalendarView from '@/widgets/calendar-view'
import EmptyLayout from '@/app/layouts/empty'
import routes from './routes'
import { ROUTE_NAMES } from '@/shared/config/routes'
import { calendarApi } from '@/features/calendar-subscription'
import useGeoStore from '@/shared/model/geo'
import useSecretaryStore from '@/entities/secretary-auth'
import { calendarFixture } from '@/shared/lib/mcp/fixtures'
import { Quasar, QLayout, QPageContainer, QBtn, ClosePopup } from 'quasar'

let wrapper: ReturnType<typeof mount> | undefined
let queryClient: QueryClient | undefined
const originalScroll = HTMLElement.prototype.scroll
const originalScrollTo = HTMLElement.prototype.scrollTo
beforeEach(() => {
  HTMLElement.prototype.scroll = vi.fn()
  HTMLElement.prototype.scrollTo = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  wrapper?.unmount()
  queryClient?.clear()
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  HTMLElement.prototype.scroll = originalScroll
  HTMLElement.prototype.scrollTo = originalScrollTo
})

test.each([
  { staleTime: 60_000, destination: ROUTE_NAMES.ABOUT, browserBack: true },
  { staleTime: 0, destination: ROUTE_NAMES.ABOUT, browserBack: true },
  { staleTime: 60_000, destination: ROUTE_NAMES.ABOUT, browserBack: false },
  { staleTime: 60_000, destination: ROUTE_NAMES.SUPPORT, browserBack: false },
  {
    staleTime: 0,
    destination: ROUTE_NAMES.CALENDAR_IMPORT,
    browserBack: false,
  },
])(
  'restores the calendar after $destination (browserBack=$browserBack, staleTime=$staleTime)',
  async ({ staleTime, destination, browserBack }) => {
    const day = Temporal.Now.plainDateISO('Europe/Moscow').toString()
    const getSubscription = vi
      .spyOn(calendarApi, 'getSubscription')
      .mockResolvedValueOnce(calendarFixture(day))
      .mockResolvedValue(
        calendarFixture(day).replace('MCP Preview', 'Updated Preview'),
      )
    const pinia = createPinia()
    setActivePinia(pinia)
    useGeoStore().timeZone = 'Europe/Moscow'
    useSecretaryStore().login = 'user'
    useSecretaryStore().password = 'password'
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime } },
    })
    const layout = defineComponent({
      render: () =>
        h(QLayout, {}, () => h(QPageContainer, {}, () => h(RouterView))),
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: routes
        .filter(
          (route) =>
            route.path === '/' ||
            route.children?.some((child) => child.name === destination),
        )
        .map((route) => {
          const testRoute = { ...route }
          if (testRoute.component) {
            testRoute.component = route.path === '/' ? layout : EmptyLayout
          }
          testRoute.children = route.children?.map((child) => {
            const testChild = { ...child }
            if (testChild.component) {
              testChild.component =
                child.name === ROUTE_NAMES.ARCHIVE
                  ? CalendarView
                  : defineComponent({
                      render: () => h('div', String(child.name)),
                    })
            }
            return testChild
          })
          return testRoute
        }),
    })
    await router.push('/')
    await router.isReady()
    wrapper = mount(defineComponent({ render: () => h(RouterView) }), {
      attachTo: document.body,
      global: {
        plugins: [
          [Quasar, { directives: { ClosePopup } }],
          pinia,
          router,
          [VueQueryPlugin, { queryClient }],
        ],
        mocks: { $t: (key: string) => key },
      },
    })
    await vi.waitFor(() =>
      expect(wrapper!.find('.sx__calendar').exists()).toBe(true),
    )
    await router.push({ name: destination })
    await flushPromises()
    expect(wrapper.find('.sx__calendar').exists()).toBe(false)
    if (browserBack) {
      router.back()
    } else {
      await wrapper
        .findComponent(EmptyLayout)
        .findAllComponents(QBtn)
        .find((button) => button.props('icon') === 'arrow_back')!
        .trigger('click')
    }
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
    await vi.waitFor(() =>
      expect(router.currentRoute.value.name).toBe(ROUTE_NAMES.ARCHIVE),
    )
    await vi.waitFor(() =>
      expect(wrapper!.find('.sx__calendar').exists()).toBe(true),
    )
    await flushPromises()
    expect(wrapper.find('.sx__calendar').exists()).toBe(true)
    expect(getSubscription).toHaveBeenCalledTimes(staleTime ? 1 : 2)
  },
)
