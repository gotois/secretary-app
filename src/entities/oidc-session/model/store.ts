import { LocalStorage, SessionStorage } from 'quasar'
import { defineStore } from 'pinia'
import { retrieveRawInitData } from '@tma.js/sdk'
import { isTMA } from '@/shared/lib/detector'
import {
  deleteBackendSession,
  getBackendSession,
  submitBackendLogin,
} from '../api/sessionApi'

interface Store {
  pinIsLoggedIn: boolean
  webId: string | null
  authenticated: boolean
  loginUrl: string
  tryAuth: boolean
}

export default defineStore('auth', {
  state: (): Store => ({
    tryAuth: LocalStorage.getItem('tryAuth') ?? false,
    pinIsLoggedIn: SessionStorage.getItem('isLoggedIn') ?? false,
    webId: null,
    authenticated: false,
    loginUrl: import.meta.env.server + '/login',
  }),
  actions: {
    setTryAuthValue() {
      LocalStorage.set('tryAuth', true)
    },
    removeAuthValue() {
      SessionStorage.remove('isLoggedIn')
    },
    async restoreSession() {
      const session = await getBackendSession(
        isTMA.value ? retrieveRawInitData() : undefined,
      )
      this.authenticated = session.authenticated
      if (session.authenticated) {
        this.webId = session.user.webId
        this.setTryAuthValue()
      } else if ('loginUrl' in session) {
        this.webId = null
        this.loginUrl = session.loginUrl
      }
      return session.authenticated
    },
    login(oidcIssuer: string, initData?: string) {
      submitBackendLogin(oidcIssuer, initData)
    },
    async logout() {
      await deleteBackendSession()
      this.authenticated = false
      this.webId = null
      SessionStorage.remove('restorePreviousSession')
      SessionStorage.remove('connect')
    },
  },
  getters: {
    isLoggedIn(state) {
      return state.authenticated
    },
  },
})
