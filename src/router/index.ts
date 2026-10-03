import { route } from 'quasar/wrappers'
import { createMemoryHistory, createRouter } from 'vue-router'

export default route(async () => {
  if (import.meta.env.MCP_APP === 'true') {
    return createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: (): null => null } }],
    })
  }
  const { createAppRouter } = await import('@/app/router')
  return createAppRouter()
})
