<template>
  <QLayout
    v-if="needKey"
    view="lHr lpR lfr"
  >
    <QPageContainer>
      <QPage
        class="flex flex-center column"
        :class="$q.dark.isActive ? 'bg-dark' : 'bg-grey-1'"
      >
        <p class="text-caption text-center">
          {{ $t('pages.auth.caption') }}
        </p>
        <QOtp
          ref="otp"
          :num="TFA_LENGTH"
          :dense="$q.platform.is.desktop"
          :disabled="otpDisabled"
          :input-styles="{ width: '32px' }"
          field-classes="q-ml-xs q-mr-xs"
          square
          outlined
          :autofocus="$q.platform.is.desktop"
          @complete="onHandleComplete"
        />
      </QPage>
    </QPageContainer>
  </QLayout>
  <QLayout
    v-else
    view="lHr lpR lfr"
  >
    <QHeader
      v-if="!isTMA"
      reveal
      :bordered="$q.platform.is.mobile"
      height-hint="98"
      class="text-primary bg-transparent"
    >
      <AndroidBarComponent v-if="isTWA" />
      <QToolbar>
        <QBtn
          v-if="$q.screen.xs || $q.screen.sm || $q.screen.md"
          flat
          :class="{
            invisible: miniState,
            absolute: miniState,
          }"
          round
          :dense="$q.platform.is.desktop"
          icon="settings"
          @click="onToggleLeftDrawer"
        />
        <ToolbarTitleComponent class="text-center" />
        <QBtn
          v-if="$q.screen.xs || $q.screen.sm || $q.screen.md"
          flat
          round
          :dense="$q.platform.is.desktop"
          icon="menu"
          @click="layoutStore.rightDrawerOpen = !layoutStore.rightDrawerOpen"
        />
      </QToolbar>
    </QHeader>
    <QDrawer
      v-if="!isTMA"
      v-model="layoutStore.leftDrawerOpen"
      side="left"
      class="scroll-y"
      :show-if-above="bigScreen"
      :mini-to-overlay="bigScreen"
      :width="320"
      :mini="miniState"
      no-mini-animation
      bordered
      @mouseenter="bigScreen ? (miniState = false) : null"
      @mouseleave="bigScreen ? (miniState = true) : null"
    >
      <p
        class="full-width block text-h6 q-pl-md q-pr-md q-pt-md no-border-radius non-selectable no-pointer-events"
      >
        <QIcon
          size="24px"
          name="settings"
          color="primary"
        />
        <template v-if="!miniState">
          <span class="q-ml-md">{{ $t('navigation.title') }}</span>
        </template>
      </p>
      <QList
        style="max-height: calc(100% - 64px)"
        class="fit column no-wrap"
      >
        <div>
          <QSpace
            class="q-mb-md"
            style="height: 8px"
          />
        </div>
        <QExpansionItem
          v-model="layoutStore.profileOpen"
          group="backupgroup"
          icon="person"
          expand-icon-class="text-primary"
          class="column non-selectable"
          :dense="$q.platform.is.desktop"
          :expand-separator="layoutStore.profileOpen"
          :label="$t('settings.native.profile')"
        >
          <QItemSection class="q-pa-md">
            <p>{{ $t('settings.consumer.description') }}</p>
            <UserProfile />
          </QItemSection>
        </QExpansionItem>
        <QSeparator />
        <QExpansionItem
          v-model="layoutStore.walletOpen"
          group="backupgroup"
          icon="wallet"
          expand-icon-class="text-primary"
          class="column non-selectable"
          :dense="$q.platform.is.desktop"
          :expand-separator="layoutStore.walletOpen"
          :label="'Wallet'"
        >
          <QItemSection class="q-pa-md">
            <WalletProfile />
          </QItemSection>
        </QExpansionItem>
        <QSeparator />
        <QExpansionItem
          v-model="layoutStore.otpOpen"
          group="backupgroup"
          icon="vpn_key"
          expand-icon-class="text-primary"
          class="column non-selectable"
          :dense="$q.platform.is.desktop"
          :expand-separator="layoutStore.otpOpen"
          :label="$t('settings.native.otp')"
        >
          <QItemSection class="q-pa-md">
            <QBtn
              label="2FA"
              color="white"
              text-color="black"
              content-class="full-width q-mb-md"
              @click="otpPage"
            />
          </QItemSection>
        </QExpansionItem>
        <QSeparator />
        <QExpansionItem
          v-model="layoutStore.calendarOpen"
          group="backupgroup"
          icon="event_available"
          expand-icon-class="text-primary"
          class="column non-selectable"
          :dense="$q.platform.is.desktop"
          :expand-separator="layoutStore.calendarOpen"
          :label="$t('settings.native.calendars')"
        >
          <QItemSection class="q-pa-md">
            <QBtn
              label="Google Calendar"
              color="white"
              text-color="black"
              content-class="full-width q-mb-md"
              @click="importCalendar"
            />
          </QItemSection>
        </QExpansionItem>
        <QSeparator />
        <QExpansionItem
          v-model="layoutStore.settingsOpen"
          group="backupgroup"
          icon="import_export"
          expand-icon-class="text-primary"
          class="column non-selectable"
          :dense="$q.platform.is.desktop"
          :expand-separator="layoutStore.settingsOpen"
          :label="$t('settings.native.title')"
        >
          <p class="q-pt-md q-pl-md q-pr-md">
            {{ $t('settings.native.description') }}
          </p>
          <QItemSection
            v-if="layoutStore.settingsOpen"
            class="q-pr-md q-pb-md q-pl-md no-margin"
          >
            <DatabaseComponent />
          </QItemSection>
          <template v-if="$q.platform.is.desktop">
            <QSeparator />
            <QItemSection class="q-pa-md no-margin">
              <p>{{ $t('settings.keychain.title') }}</p>
              <QBtn
                :label="$t('settings.keychain.label')"
                ripple
                round
                square
                stretch
                color="secondary"
                :dense="$q.platform.is.desktop"
                icon="key"
                @click="onExportKeychain"
              >
                <QTooltip>
                  {{ $t('settings.keychain.tooltip') }}
                </QTooltip>
              </QBtn>
            </QItemSection>
          </template>
          <template v-if="contractsCount > 0">
            <QSeparator />
            <QItemSection class="q-pa-md no-margin">
              <p>{{ $t('settings.clean.description') }}</p>
              <QBtn
                :label="$t('settings.clean.submit')"
                color="negative"
                :dense="$q.platform.is.desktop"
                round
                square
                icon="delete_outline"
                @click="confirm = true"
              >
                <QTooltip>
                  {{ $t('database.removeDatabase') }}
                </QTooltip>
              </QBtn>
            </QItemSection>
          </template>
        </QExpansionItem>
        <QSeparator />
        <QExpansionItem
          v-model="layoutStore.spacesOpen"
          group="backupgroup"
          icon="home"
          expand-icon-class="text-primary"
          class="column non-selectable"
          :dense="$q.platform.is.desktop"
          :expand-separator="layoutStore.spacesOpen"
          :label="$t('settings.native.pod')"
        >
          <div class="q-pt-md q-pl-md q-pr-md">
            <QBtn
              v-if="isLoggedIn"
              color="negative"
              :dense="$q.platform.is.desktop"
              square
              glossy
              push
              unelevated
              align="left"
              icon="logout"
              class="full-width q-pl-md q-pr-md q-mb-md block"
              :label="$t('navigation.signout')"
              @click="logOutFromPod"
            />
            <QBtn
              v-else
              color="primary"
              :dense="$q.platform.is.desktop"
              square
              glossy
              push
              unelevated
              align="left"
              icon="login"
              class="full-width q-pl-md q-pr-md q-mb-md block"
              :label="$t('navigation.signin')"
              @click="loginToPod"
            />
          </div>

          <template v-if="isLoggedIn">
            <QSeparator />
            <QBtn
              v-if="isLoggedIn"
              label="Sync Pod"
              @click="syncPods"
            />

            <QSeparator />

            <p class="q-pt-md q-pl-md q-pr-md">
              {{ $t('settings.native.description') }}
            </p>

            <QItemSection class="q-pl-md q-pr-md q-pb-md no-margin">
              <PodImporter />
              <QSeparator />
            </QItemSection>
          </template>
        </QExpansionItem>
        <QSeparator />
        <QExpansionItem
          v-model="layoutStore.languageOpen"
          group="backupgroup"
          icon="translate"
          expand-icon-class="text-primary"
          class="column non-selectable"
          :dense="$q.platform.is.desktop"
          :expand-separator="layoutStore.languageOpen"
          :label="$t('settings.language.title')"
        >
          <QItemSection class="q-pa-md">
            <LocaleComponent />
          </QItemSection>
        </QExpansionItem>
        <QSeparator class="q-mb-md" />
        <QSpace class="col" />
        <QChip
          icon="more_vert"
          class="cursor-pointer full-width q-pa-md self-end"
          color="transparent"
          :dense="$q.platform.is.desktop"
          square
          clickable
          :label="miniState ? '' : $t('navigation.about')"
          :disable="router.currentRoute.value.name === ROUTE_NAMES.ABOUT"
          @click="router.push({ name: ROUTE_NAMES.ABOUT })"
        />
      </QList>
    </QDrawer>
    <!--QDrawer
      v-if="!isTMA"
      v-model="layoutStore.rightDrawerOpen"
      side="right"
      :width="320"
      class="q-pa-md scroll-y full-height"
      show-if-above
      bordered
    >
      <ChatDialog />
    </QDrawer-->
    <QPageContainer>
      <RouterView
        class="q-ml-auto q-mr-auto"
        :style="
          $q.platform.is.desktop
            ? 'border-top-left-radius: 12px; border-top-right-radius: 12px;'
            : 'inherit'
        "
      />
      <QDialog
        v-model="confirm"
        persistent
        square
      >
        <DatabaseRemoveComponent
          v-if="confirm"
          @on-clear="confirm = false"
        />
      </QDialog>
      <ArchiveSearchComponent
        v-if="showSearch"
        v-model="showSearch"
        @search="onSearch"
      />
    </QPageContainer>
    <QPageSticky
      v-if="!isTMA"
      position="bottom-right"
      :offset="[18, 18]"
    >
      <QFab
        color="primary"
        icon="add"
        direction="up"
      >
        <QFabAction
          color="primary"
          icon="event"
          :label="$t('pages.calendar.newEvent')"
          anchor="start"
          label-position="right"
          :to="{ name: ROUTE_NAMES.NEW }"
        />
      </QFab>
    </QPageSticky>
    <QFooter
      v-if="!isTMA"
      bordered
      :class="{
        'bg-white text-dark': !$q.dark.isActive,
        'bg-dark text-light': $q.dark.isActive,
      }"
    >
      <QTabs
        switch-indicator
        :dense="$q.platform.is.desktop"
        :align="$q.platform.is.desktop ? 'center' : 'justify'"
      >
        <QRouteTab
          icon="schedule"
          :to="{ name: ROUTE_NAMES.ARCHIVE }"
          @click="navCancel"
        >
          <QPopupProxy
            transition-show="scale"
            transition-hide="scale"
          >
            <CalendarEventsComponent
              default-view="Calendar"
              class="q-ml-auto q-mr-auto q-mb-md q-mt-md"
              @select="onCalendarByDate"
            />
          </QPopupProxy>
        </QRouteTab>
        <QRouteTab
          icon="event"
          :to="{ name: ROUTE_NAMES.CALENDAR }"
          @click="navCancel"
        >
          <QPopupProxy
            transition-show="scale"
            transition-hide="scale"
          >
            <CalendarEventsComponent
              class="q-ml-auto q-mr-auto q-mb-md q-mt-md"
              default-view="Months"
              @select="onCalendarByDate"
            />
          </QPopupProxy>
        </QRouteTab>
      </QTabs>
    </QFooter>
  </QLayout>
</template>
<script lang="ts" setup>
import {
  ref,
  computed,
  defineAsyncComponent,
  onBeforeMount,
  onMounted,
} from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useQuasar,
  QDialog,
  QFooter,
  QTabs,
  QRouteTab,
  QBtn,
  QFab,
  QFabAction,
  QPage,
  QPageContainer,
  QPageSticky,
  QPopupProxy,
  QTooltip,
  QChip,
  QSeparator,
  QItemSection,
  QExpansionItem,
  QIcon,
  QList,
  QDrawer,
  QToolbar,
  QHeader,
  QLayout,
  QSpace,
  exportFile,
} from 'quasar'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import useAuthStore from '@/entities/oidc-session'
import useContractStore from '@/entities/contract'
import { usePodStore } from '@/features/pod-sync'
import useNotification from '@/shared/model/notification'
import useLayoutStore from '@/shared/model/layout'
import useTFAStore from '@/features/two-factor-auth'
import ToolbarTitleComponent from '@/shared/ui/ToolbarTitleComponent.vue'
import UserProfile from './UserProfile.vue'
// import ChatDialog from './ChatDialog.vue'
import { isTWA, isTMA } from '@/shared/lib/detector'
import { keyPair } from '@/shared/lib/databaseService'
import { open } from '@/shared/lib/urlHelper'
import { ROUTE_NAMES } from '@/shared/config/routes'
import { ContractPod } from '@/features/pod-sync'
import { formatToCalendarDate } from '@/features/contract-calendar'
import type { DIDTable } from '@/shared/model/persistence'
import { useAppMeta } from '@/app/useAppMeta'
import { useModal } from '@/shared/lib/useModal'

const QOtp = defineAsyncComponent(
  () => import('quasar-app-extension-q-otp/src/component/QOtp.vue'),
)
const LocaleComponent = defineAsyncComponent(
  () => import('./LocaleComponent.vue'),
)
const DatabaseRemoveComponent = defineAsyncComponent(
  () => import('./DatabaseRemoveComponent.vue'),
)
const DatabaseComponent = defineAsyncComponent(
  () => import('./DatabaseComponent.vue'),
)
const PodImporter = defineAsyncComponent(() => import('@/features/pod-sync'))
const ArchiveSearchComponent = defineAsyncComponent(() =>
  import('@/features/archive-search').then(
    ({ ArchiveSearchComponent }) => ArchiveSearchComponent,
  ),
)
const AndroidBarComponent = defineAsyncComponent(
  () => import('@/shared/ui/AndroidBarComponent.vue'),
)
const CalendarEventsComponent = defineAsyncComponent(
  () => import('@/features/contract-calendar'),
)
const WalletProfile = defineAsyncComponent(() =>
  import('@/features/wallet-connect').then(
    ({ WalletProfile }) => WalletProfile,
  ),
)

const $q = useQuasar()
const modal = useModal()
useAppMeta()
const router = useRouter()
const i18n = useI18n()
const $t = i18n.t
const authStore = useAuthStore()
const contractStore = useContractStore()
const layoutStore = useLayoutStore()
const notificationStore = useNotification()
const podStore = usePodStore()
const tfaStore = useTFAStore()

const NOTIFICATION_TIMER = 30000
const TFA_LENGTH = 6

const { contractsCount } = storeToRefs(contractStore)
const { isLoggedIn } = storeToRefs(authStore)

const bigScreen = computed(
  () => $q.platform.is.desktop && ($q.screen.xl || $q.screen.lg),
)
const needKey = computed(() => {
  return $q.localStorage.has('secret') && !authStore.pinIsLoggedIn
})

const miniState = ref(bigScreen.value)
const confirm = ref(false)
const showSearch = ref(false)
const otp = ref<{
  blur: () => void
  clear: () => void
  focus: () => void
} | null>(null)
const otpDisabled = ref(false)

async function onHandleComplete(value: string) {
  const timeout = 2000
  if (tfaStore.verify(value)) {
    authStore.pinIsLoggedIn = true
    const dismiss = $q.notify({
      message: $t('components.otp.processing'),
      timeout: 2000,
      spinner: true,
    })
    await router.push({
      path: String(router.currentRoute.value.query.fullPath ?? '/'),
      query: router.currentRoute.value.query,
      replace: true,
    })
    dismiss()
  } else {
    otpDisabled.value = true
    otp.value?.blur()
    $q.notify({
      color: 'negative',
      message: $t('components.otp.fail'),
      progress: true,
      timeout: timeout,
    })
    setTimeout(() => {
      otpDisabled.value = false
      otp.value?.clear()
      otp.value?.focus()
    }, timeout)
  }
}

function onToggleLeftDrawer(): void {
  layoutStore.toggleLeftDrawer()
}

async function onExportKeychain() {
  const key = (await keyPair.last()) as DIDTable
  const keysJSON = keyPair.prepareKeyPair(key)
  if (keysJSON) {
    exportFile('keys.json', keysJSON)
  }
}

async function onSearch(searchText: string) {
  $q.loading.show()
  await router.push({
    name: ROUTE_NAMES.SEARCH,
    query: {
      name: searchText,
      page: 1,
    },
  })
  showSearch.value = false
}

function loginToPod() {
  $q.sessionStorage.remove('connect')
  $q.sessionStorage.set('restorePreviousSession', true)
  return router.push({
    name: ROUTE_NAMES.LOGIN,
  })
}

async function logOutFromPod() {
  try {
    await authStore.logout()
    $q.notify({
      message: $t('database.pod.disconnected'),
      type: 'positive',
    })
    await router.replace({
      name: ROUTE_NAMES.LOGIN,
    })
  } catch (error: unknown) {
    console.error(error)
    $q.notify({
      message: error instanceof Error ? error.message : 'Logout failed',
      type: 'negative',
    })
  }
}

async function otpPage() {
  await router.push({
    name: ROUTE_NAMES.OTP,
    query: {},
  })
}

async function importCalendar() {
  await router.push({
    name: ROUTE_NAMES.CALENDAR_IMPORT,
    query: {},
  })
}

async function onCalendarByDate(strDate: string) {
  if (!strDate) {
    return
  }
  $q.loading.show()
  const date = formatToCalendarDate(new Date(strDate))
  await router.push({
    name: ROUTE_NAMES.CALENDAR,
    query: {
      date: date.toString(),
    },
  })
  $q.loading.hide()
}

async function syncPods() {
  if (!(await modal.confirm($t('database.pod.sync')))) {
    return
  }
  const progress = $q.dialog({
    message: $t('database.pod.sync'),
    progress: true,
    persistent: true,
    ok: false,
  })
  try {
    const links = await podStore.getContractsLink()
    for (const link of links) {
      const message = 'refreshing ' + link
      progress.update({ message })
      const newDogovor = await ContractPod.fromSolidUrl(link)
      console.log('WIP sync pod contract', newDogovor.presentation)
    }
  } finally {
    progress.hide()
  }
}

onBeforeMount(() => {
  setTimeout(() => {
    notificationStore.check()
  }, NOTIFICATION_TIMER)
  if (typeof router.currentRoute.value.query.action === 'string') {
    open(router.currentRoute.value.query.action)
    return
  }

  // todo думаю это надо перенести на /loginPage
  // const { query } = router.currentRoute.value
  // Если пользователь отменил вход через WebId, возвращаем его на страницу подтверждения
  // if (isLoggedIn.value && query.error === 'access_denied') {
  //   step.value = STEP.FINAL
  // }
  // if (
  //   step.value === Number(STEP.FINAL) &&
  //   walletStore.getMultibase?.length === 0
  // ) {
  //   $q.loading.hide()
  // } else if (isLoggedIn.value && query.code && query.state) {
  //   step.value = STEP.FINAL
  // }
})

onMounted(() => {
  // todo нужно взять все документы из ContractDatabase (IndexedDB) и проверить их на завершение
  // documents.forEach((doc) => {
  //     const diff = date.getDateDiff(doc.endTime, new Date(), 'days')
  //     if (diff === 1) {
  //       notificationStore.add({
  //         title: 'Tomorrow end: ' + doc.name,
  //       })
  //     }
  //   })
})

function navCancel(e: Event) {
  e.preventDefault()
}
</script>
<style lang="scss">
:root {
  touch-action: pan-x pan-y;
}
</style>
