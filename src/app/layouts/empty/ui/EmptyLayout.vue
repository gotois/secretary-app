<template>
  <QLayout view="hHr LpR lfr">
    <QHeader
      v-if="!isTMA && ($route.name !== ROUTE_NAMES.PROMO || showPromoConnect)"
      bordered
      class="text-primary"
      :class="{
        'bg-transparent': $route.name !== ROUTE_NAMES.PROMO,
        'bg-white': $route.name === ROUTE_NAMES.PROMO && !$q.dark.isActive,
        'bg-dark': $route.name === ROUTE_NAMES.PROMO && $q.dark.isActive,
      }"
      height-hint="98"
    >
      <AndroidBarComponent v-if="isTWA" />
      <QToolbar>
        <QBtn
          v-if="
            $route.name !== ROUTE_NAMES.LOGIN &&
            $route.name !== ROUTE_NAMES.PROMO
          "
          color="primary"
          icon="arrow_back"
          class="absolute"
          round
          flat
          unelevated
          @click="clickBack"
        >
          <QTooltip>{{ $t('navigation.back') }}</QTooltip>
        </QBtn>
        <ToolbarTitleComponent
          v-if="$route.name !== ROUTE_NAMES.PROMO"
          class="text-center"
        />
        <QBtn
          v-if="$route.name === ROUTE_NAMES.PROMO && showPromoConnect"
          color="white"
          text-color="accent"
          icon="img:/icons/safari-pinned-tab.svg"
          label="Подключиться"
          class="absolute-right q-ma-xs promo-header-connect"
          rounded
          glossy
          push
          @click="openConnectDialog"
        />
      </QToolbar>
    </QHeader>
    <QPageContainer>
      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          @header-connect-visibility="setHeaderConnectVisibility"
          @connect-request="openConnectDialog"
        />
      </RouterView>
    </QPageContainer>
    <QDialog v-model="showConnectDialog">
      <QCard
        class="connect-dialog full-width"
        :dark="$q.dark.isActive"
      >
        <QCardSection class="row items-center no-wrap">
          <div class="text-h6">Где подключить Секретаря?</div>
          <QSpace />
          <QBtn
            v-close-popup
            flat
            round
            dense
            icon="close"
            aria-label="Закрыть"
          />
        </QCardSection>
        <QCardSection class="column q-gutter-sm q-pt-none">
          <QBtn
            v-close-popup
            unelevated
            align="left"
            color="green-8"
            text-color="white"
            icon="android"
            label="Android"
            @click="openExternal(GOOGLE_PLAY_URL)"
          />
          <QBtn
            v-if="TELEGRAM_BOT_NAME"
            v-close-popup
            unelevated
            align="left"
            color="light-blue-9"
            text-color="white"
            icon="telegram"
            label="Telegram Bot"
            @click="openTelegramBot"
          />
          <QBtn
            v-close-popup
            unelevated
            align="left"
            color="deep-orange-10"
            text-color="white"
            icon="terminal"
            label="Codex"
            @click="openExternal(CODEX_APP_URL)"
          />
          <QBtn
            v-close-popup
            unelevated
            align="left"
            color="deep-purple-8"
            text-color="white"
            icon="install_desktop"
            label="PWA"
            @click="connectPwa"
          />
        </QCardSection>
      </QCard>
    </QDialog>
  </QLayout>
</template>
<script lang="ts" setup>
import { defineAsyncComponent, ref } from 'vue'
import {
  SessionStorage,
  QLayout,
  QHeader,
  QToolbar,
  QPageContainer,
  QBtn,
  QTooltip,
  QDialog,
  QCard,
  QCardSection,
  QSpace,
} from 'quasar'
import { useRouter, RouterView } from 'vue-router'
import ToolbarTitleComponent from '@/shared/ui/ToolbarTitleComponent.vue'
import { isTWA, isTMA } from '@/shared/lib/detector'
import { ROUTE_NAMES } from '@/shared/config/routes'
import useLangStore from '@/shared/model/lang'
import { useAppMeta } from '@/app/useAppMeta'
import { GOOGLE_PLAY_URL } from '@/shared/lib/googlePlayHelper'
import { CODEX_APP_URL } from '@/shared/lib/codexHelper'
import { TELEGRAM_BOT_NAME } from '@/shared/lib/telegram'
import { open } from '@/shared/lib/urlHelper'

const router = useRouter()
const langStore = useLangStore()
const showPromoConnect = ref(false)
const showConnectDialog = ref(false)
useAppMeta()

const AndroidBarComponent = defineAsyncComponent(
  () => import('@/shared/ui/AndroidBarComponent.vue'),
)

async function clickBack() {
  SessionStorage.removeItem('restorePreviousSession')

  if (router.currentRoute.value.name === ROUTE_NAMES.PRIVACY) {
    await router.replace({ path: '/' })
    return
  }

  await router.push({
    name: ROUTE_NAMES.ROOT,
  })
}

function openConnectDialog() {
  showConnectDialog.value = true
}

function openExternal(url: string) {
  open(url)
}

function openTelegramBot() {
  if (TELEGRAM_BOT_NAME) {
    open(`https://t.me/${TELEGRAM_BOT_NAME}?start=start`)
  }
}

async function connectPwa() {
  await router.push({
    name: ROUTE_NAMES.LOGIN,
    query: { lang: langStore.language },
  })
}

function setHeaderConnectVisibility(visible: boolean) {
  showPromoConnect.value = visible
}
</script>
<style module lang="scss">
.promo-header-connect {
  padding-right: 16px;
  padding-left: 16px;
}

.connect-dialog {
  max-width: 420px;
}

:root {
  touch-action: pan-x pan-y;
}
</style>
