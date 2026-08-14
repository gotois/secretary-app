<template>
  <QPage
    class="flex flex-center column"
    :class="{
      'bg-dark': $q.dark.isActive,
      'bg-grey-1': !$q.dark.isActive,
    }"
  >
    <QScrollArea
      ref="scroll"
      visible
      class="absolute-full fit"
      :content-style="contentStyle"
      :content-active-style="contentStyle"
    >
      <QStepper
        ref="stepper"
        v-model.number="step"
        color="primary"
        flat
        alternative-labels
        contracted
        :header-class="isTMA ? 'hidden' : ''"
        :swipeable="false"
        :animated="!$q.platform.is.desktop"
        :vertical="!$q.platform.is.desktop"
        class="q-pa-md q-card--bordered q-ml-auto q-mr-auto q-mt-md q-mb-md"
        :class="{
          'no-margin': $q.platform.is.mobile,
          'no-padding': $q.platform.is.mobile,
        }"
        :style="{
          'max-width': $q.platform.is.desktop ? '720px' : 'auto',
        }"
        :transition-next="$q.platform.is.desktop ? 'slide-left' : 'slide-down'"
        @update:model-value="onStep"
      >
        <QStep
          :name="STEP.WELCOME"
          :title="$t('tutorial.welcome.title')"
          icon="create_new_folder"
          done-color="positive"
          :done="step > STEP.WELCOME"
        >
          <QIcon
            class="flex q-ml-auto q-mr-auto q-ma-md bg-white rounded-borders"
            name="img:/icons/safari-pinned-tab.svg"
            size="128px"
          />
          <p
            v-show="$q.platform.is.desktop"
            class="text-h4 text-center"
          >
            {{ $t('tutorial.welcome.title') }}
          </p>
          <div
            class="text-body1"
            style="white-space: break-spaces"
            v-html="parse($t('tutorial.welcome.body'))"
          />
          <QList class="q-mb-md">
            <QExpansionItem
              :label="$t('tutorial.info.title')"
              icon="create_new_folder"
              :dense="$q.platform.is.desktop"
              :dense-toggle="$q.platform.is.desktop"
            >
              <QCard>
                <QCardSection>
                  <div
                    class="text-body1"
                    style="white-space: break-spaces"
                    v-html="parse($t('tutorial.info.body'))"
                  />
                </QCardSection>
              </QCard>
            </QExpansionItem>
            <QExpansionItem
              :label="$t('tutorial.agreement.title')"
              :caption="$t('tutorial.agreement.caption')"
              icon="article"
              :dense="$q.platform.is.desktop"
              :dense-toggle="$q.platform.is.desktop"
            >
              <QCard>
                <QCardSection>
                  <div
                    class="text-body1"
                    style="white-space: break-spaces"
                    v-html="parse($t('tutorial.agreement.body'))"
                  />
                </QCardSection>
              </QCard>
            </QExpansionItem>
            <QExpansionItem
              :label="$t('tutorial.wallet.title')"
              :caption="$t('tutorial.wallet.caption')"
              icon="wallet"
              :dense="$q.platform.is.desktop"
              :dense-toggle="$q.platform.is.desktop"
            >
              <QCard>
                <QCardSection>
                  <div
                    class="text-body1"
                    style="white-space: break-spaces"
                    v-html="parse($t('tutorial.wallet.body'))"
                  />
                </QCardSection>
              </QCard>
            </QExpansionItem>
            <QExpansionItem
              :label="$t('tutorial.safety.title')"
              :caption="$t('tutorial.safety.caption')"
              icon="safety_divider"
              :dense="$q.platform.is.desktop"
              :dense-toggle="$q.platform.is.desktop"
            >
              <QCard>
                <QCardSection>
                  <div
                    class="text-body1"
                    style="white-space: break-spaces"
                    v-html="parse($t('tutorial.safety.body'))"
                  />
                </QCardSection>
              </QCard>
            </QExpansionItem>
          </QList>
          <p class="text-caption no-margin text-weight-light">
            {{ $t('tutorial.welcome.hint') }}
          </p>

          <QForm
            ref="nameForm"
            class="q-gutter-md"
            autocapitalize="off"
            autocomplete="off"
            :autofocus="$q.platform.is.desktop"
            greedy
            @submit="onAccept"
          >
            <QStepperNavigation class="no-margin q-pt-md q-pl-md">
              <QBtn
                color="accent"
                type="submit"
                :label="$t('tutorial.data.submit')"
                :class="{
                  'full-width': !$q.platform.is.desktop,
                }"
                :loading="$q.loading.isActive"
                icon-right="app_registration"
              />
            </QStepperNavigation>
          </QForm>
        </QStep>
        <QStep
          :name="STEP.FINAL"
          :title="$t('tutorial.data.title')"
          done-color="positive"
          icon="assignment"
          class="q-pb-md"
          :done="step >= STEP.FINAL"
        >
          <p class="text-body1">
            {{ $t('tutorial.data.body') }}
          </p>
          <QSpace class="q-pa-xs" />

          <QCard
            flat
            square
            bordered
            class="q-pa-md"
            style="width: 400px"
            :class="{
              'full-width': $q.platform.is.mobile,
            }"
          >
            <p class="text-h4">
              {{ $t('tutorial.oidc.title') }}
            </p>
            <p class="text-caption">
              {{ $t('tutorial.oidc.caption') }}
            </p>
            <div
              class="text-body1"
              style="white-space: break-spaces"
              v-html="parse($t('tutorial.oidc.body'))"
            />

            <OIDCIssuerComponent
              :label="$t('components.oidcIssuer.label')"
              @on-complete="onLogin"
            >
              <QTooltip>
                {{ $t('components.oidcIssuer.input') }}
                {{ $t('oidc.tutorialHint') }}
              </QTooltip>
            </OIDCIssuerComponent>
          </QCard>
        </QStep>
      </QStepper>
    </QScrollArea>
  </QPage>
</template>
<script lang="ts" setup>
import { ref, watch, onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  useMeta,
  useQuasar,
  QBtn,
  QPage,
  QCard,
  QTooltip,
  QScrollArea,
  QCardSection,
  QExpansionItem,
  QIcon,
  QList,
  QSpace,
  QStep,
  QStepper,
  QStepperNavigation,
  QForm,
} from 'quasar'
import useAuthStore from '@/entities/oidc-session'
import OIDCIssuerComponent from './OIDCIssuerComponent.vue'
import { parse } from '@/shared/lib/markdownHelper'
import { isTMA } from '@/shared/lib/detector'
import pkg from '../../../../package.json'
import { STEP } from '@/shared/config/routes'
import {
  mainButton,
  popup,
  requestContact,
  hapticFeedback,
  retrieveRawInitData,
} from '@tma.js/sdk'

const $t = useI18n().t
const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const stepParam = 'step'

const contentStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const scroll = ref<InstanceType<typeof QScrollArea> | null>(null)
const stepper = ref<InstanceType<typeof QStepper> | null>(null)
const step = ref(getCurrentStep() ?? STEP.WELCOME)
const loginPending = ref(false)

watch(
  () => step.value,
  (value) => {
    console.log('step', value)
    setMeta(value)
  },
)

function setMeta(value: number) {
  switch (value as STEP) {
    case STEP.WELCOME: {
      useMeta({
        title: $t('pages.tutorial.welcome.title'),
        meta: {
          ogTitle: {
            property: 'og:title',
            content: $t('pages.tutorial.welcome.title'),
          },
        },
      })
      break
    }
    case STEP.FINAL: {
      useMeta({
        title: $t('pages.tutorial.final.title'),
        meta: {
          ogTitle: {
            property: 'og:title',
            content: $t('pages.tutorial.final.title'),
          },
        },
      })
      break
    }
    default: {
      useMeta({
        title: pkg.productName,
        meta: {
          ogTitle: {
            property: 'og:title',
            content: pkg.productName,
          },
        },
      })
      break
    }
  }
}

async function onLogin(oidcIssuer: string = import.meta.env.secretary) {
  if (loginPending.value) {
    return
  }
  if (!oidcIssuer) {
    $q.notify({
      type: 'negative',
      message: $t('components.oidcIssuer.fail'),
    })
    return
  }
  loginPending.value = true
  try {
    let initData: string | undefined
    if (isTMA.value) {
      initData = retrieveRawInitData()
      if (!initData) {
        throw new Error('Telegram init data is missing')
      }
    }
    authStore.login(oidcIssuer, initData)
  } catch (error) {
    loginPending.value = false
    console.error('Unable to start login:', error)
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Login failed',
    })
  }
}

function onAccept() {
  stepper.value.next()
}

async function onStep(step: string | number) {
  const nextStep = Number(step)
  await router.push({
    query: {
      ...router.currentRoute.value.query,
      step: nextStep,
    },
    replace: true,
  })
  scroll.value?.setScrollPosition('vertical', nextStep * 30, 100)
}

function getCurrentStep() {
  const searchParams = new URLSearchParams(window.location.search)

  if (searchParams.get(stepParam)) {
    return Number(searchParams.get(stepParam))
  }
}

async function onMainButtonClick() {
  if (mainButton.isLoaderVisible()) {
    return
  }
  try {
    mainButton.setParams({
      isLoaderVisible: true,
    })
    if (!requestContact.isSupported()) {
      throw new Error('RequestContact is not supported')
    }
    await requestContact()

    if (hapticFeedback.notificationOccurred.isAvailable()) {
      hapticFeedback.notificationOccurred('success')
    }
  } catch (error: unknown) {
    console.error(error)
    const message = error instanceof Error ? error.message : String(error)

    if (hapticFeedback.notificationOccurred.isAvailable()) {
      hapticFeedback.notificationOccurred('error')
    }

    if (popup.isSupported()) {
      await popup.show({
        title: 'RequestContact ERROR',
        message,
      })
    } else {
      $q.notify({
        type: 'negative',
        message,
      })
    }
  } finally {
    mainButton.setParams({
      isLoaderVisible: false,
    })
  }
}

function createTMAMainButton() {
  mainButton.mount()
  mainButton.setParams({
    bgColor: '#000000',
    hasShineEffect: true,
    isEnabled: true,
    isVisible: true,
    isLoaderVisible: false,
    text: $t('navigation.register'),
    textColor: '#ffffff',
  })
  mainButton.onClick(onMainButtonClick)
}

onBeforeMount(async () => {
  if (isTMA.value) {
    if (!authStore.isLoggedIn) {
      await onLogin()
      return
    }
    createTMAMainButton()
  }
  setMeta(step.value)
})
</script>
