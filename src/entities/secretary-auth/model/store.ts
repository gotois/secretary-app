import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import { retrieveRawInitData } from '@tma.js/sdk'
import { isTMA } from '@/shared/lib/detector'

interface Store {
  login?: string
  password?: string
}
export default defineStore('secretary', {
  state: (): Store => ({
    login: LocalStorage.getItem('login') ?? null,
    password: LocalStorage.getItem('password') ?? null,
  }),
  actions: {
    logout() {},
  },
  getters: {
    auth(store): string | null {
      try {
        if (isTMA.value) {
          return this.tmaAuth as string
        } else if (store.login && store.password) {
          return this.basicAuth as string
        }
        console.warn('Unknown auth')
      } catch (error) {
        console.warn(error)
      }
      return null
    },
    basicAuth(store): string | Error {
      if (!store.login?.length || !store.password?.length) {
        throw new Error('Empty login or password')
      }
      return 'Basic ' + btoa(store.login + ':' + store.password)
    },
    tmaAuth(): string | Error {
      const initDataRaw = retrieveRawInitData()
      if (!initDataRaw?.length) {
        throw new Error('Empty telegram init data')
      }
      return `tma ${initDataRaw}`
    },
  },
})
