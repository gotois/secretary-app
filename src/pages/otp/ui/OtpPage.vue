<template>
  <QPage
    :class="{
      'bg-transparent': $q.dark.isActive,
      'bg-grey-1': !$q.dark.isActive,
    }"
  >
    <QScrollArea
      visible
      class="absolute-full fit q-pl-md q-pr-md"
    >
      <template v-if="activated">
        <QBtn
          type="button"
          round
          :dense="$q.platform.is.desktop"
          color="negative"
          icon="remove"
          :label="$t('settings.otp.removeCode')"
          @click="onOTPChange('')"
        />
      </template>
      <template v-else>
        <QBtn
          type="button"
          :dense="$q.platform.is.desktop"
          square
          ripple
          stretch
          icon="key"
          color="secondary"
          :label="$t('settings.otp.addCode')"
          @click="openOTPDialog"
        />
        <QDialog
          v-model="showOTPDialog"
          position="bottom"
          square
        >
          <QCard
            flat
            class="q-pa-md"
          >
            <QCardSection>
              <p>{{ $t('settings.otp.description') }}</p>
              <QImg
                :src="authUriQR"
                alt="QR"
                fit="none"
                height="250px"
                class="cursor-pointer"
                decoding="async"
                fetchpriority="high"
                @click="open(authUri)"
              />
              <QSpace class="q-pa-xs" />
              <QOtp
                v-if="showOTPDialog"
                ref="otp"
                :outlined="!$q.screen.xs"
                :dense="$q.platform.is.desktop"
                :num="TFA_LENGTH"
                :rules="[otpRule]"
                square
                :autofocus="$q.platform.is.desktop"
                :input-styles="{ width: '32px' }"
                field-classes="q-ml-xs q-mr-xs"
                style="width: fit-content"
                class="q-ml-auto q-mr-auto"
                @change="onOTPChange"
                @complete="onOTPHandleComplete"
              />
            </QCardSection>
          </QCard>
        </QDialog>
      </template>
    </QScrollArea>
  </QPage>
</template>
<script lang="ts" setup>
import { ref, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useQuasar,
  QBtn,
  QDialog,
  QImg,
  QCard,
  QCardSection,
  QScrollArea,
  QSpace,
  QPage,
} from 'quasar'
import useAuthStore from '@/entities/oidc-session'
import useTFAStore from '@/features/two-factor-auth'
import { open } from '@/shared/lib/urlHelper'
import { useModal } from '@/shared/lib/useModal'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const tfaStore = useTFAStore()
const QOtp = defineAsyncComponent(
  () => import('quasar-app-extension-q-otp/src/component/QOtp.vue'),
)
const otp = ref<InstanceType<typeof QOtp> | null>(null)
const authUriQR = ref('')
const authUri = ref('')
const TFA_LENGTH = 6

const { activated } = storeToRefs(tfaStore)
const showOTPDialog = ref(false)

const $q = useQuasar()
const modal = useModal()
const $t = useI18n().t

function otpRule(token: string) {
  if (token.length === TFA_LENGTH) {
    return tfaStore.verify(token) || 'TFA Error'
  }
  return true
}

async function onOTPChange(value: string) {
  if (!activated.value || value.length) {
    return
  }
  if (await modal.confirm($t('components.otp.pinDialog.message'))) {
    try {
      tfaStore.deactivate2fa()
      authStore.removeAuthValue()
      $q.notify({
        type: 'positive',
        message: $t('components.otp.pinDialog.success'),
      })
    } catch (error) {
      console.error(error)
      $q.notify({
        type: 'negative',
        message: $t('components.otp.pinDialog.fail'),
      })
    }
  }
  showOTPDialog.value = false
}

async function onOTPHandleComplete(token: string) {
  if (!tfaStore.verify(token)) {
    return
  }
  if (await modal.confirm($t('components.otp.saveDialog.message'))) {
    try {
      tfaStore.activate2fa()
      authStore.setTryAuthValue()
      $q.notify({
        type: 'positive',
        message: $t('components.otp.saveDialog.success'),
      })
    } catch (error) {
      console.error(error)
      $q.notify({
        type: 'negative',
        message: $t('components.otp.saveDialog.fail'),
      })
    }
  }
  showOTPDialog.value = false
}

async function openOTPDialog() {
  const { uri, qr } = await tfaStore.generate()
  authUri.value = uri
  authUriQR.value = qr
  showOTPDialog.value = true
}
</script>
