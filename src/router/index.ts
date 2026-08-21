import { route } from 'quasar/wrappers'
import { createAppRouter } from '@/app/router'
import { isMcpApp } from '@/shared/lib/detector'

export default route(() =>
  createAppRouter({
    sessionMode: isMcpApp.value ? 'external' : 'internal',
  }),
)
