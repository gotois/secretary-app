<template>
  <QField
    v-if="getWalletLD.id"
    label="DID"
    color="secondary"
    class="full-width"
    outlined
    readonly
    stack-label
    hide-bottom-space
  >
    <template #prepend>
      <QIcon name="wallet" />
    </template>
    <template #control>
      <div
        class="self-center no-outline no-margin no-padding non-selectable ellipsis absolute"
        style="left: 0; right: 0"
      >
        {{ getWalletLD.id }}
      </div>
    </template>
    <template #append>
      <QIcon
        name="content_copy"
        class="cursor-pointer"
        @click="onCopyText(getWalletLD.id)"
      />
    </template>
  </QField>
  <PhantomWalletLogin
    :label="$t('tutorial.wallet.title')"
    color="white"
    text-color="black"
    content-class="full-width q-mb-md"
    @skip="onSkipWallet"
    @error="onWalletError"
  />
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useQuasar, QField, QIcon, copyToClipboard } from 'quasar'
import useWalletStore from '@/entities/wallet'
import { useModal } from '@/shared/lib/useModal'
import PhantomWalletLogin from './PhantomWalletLogin.vue'

const walletStore = useWalletStore()
const { getWalletLD } = storeToRefs(walletStore)
const $q = useQuasar()
const modal = useModal()
const i18n = useI18n()
const $t = i18n.t

function onWalletError(error: Error) {
  $q.notify({
    color: 'negative',
    message:
      error.name === 'DatabaseClosedError' ? error.message : $t('wallet.fail'),
  })
}

async function onSkipWallet() {
  if (await modal.confirm($t('tutorial.welcome.demoHint'))) {
    // emit('free')
  }
}
async function onCopyText(text: string) {
  await copyToClipboard(text)
  $q.notify({
    type: 'positive',
    group: false,
    message: $t('copy.success'),
  })
}
</script>
