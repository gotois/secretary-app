<template>
  <div
    v-if="contract.credentialSubject?.object?.attachment?.length"
    class="relative-position"
  >
    <ContractCarouselComponent :model="attachments" />
  </div>
  <QSeparator
    spaced
    inset
  />
  <QForm
    ref="contractForm"
    class="q-gutter-md"
    autocapitalize="off"
    autocomplete="off"
    spellcheck="true"
    greedy
    :autofocus="!signing"
    @submit="saveContract"
    @reset="onResetForm"
  >
    <QSelect
      v-model="contractType"
      :options="contractOptions"
      :readonly="Boolean(signing)"
      :label="$t('contract.type')"
      :hint="
        $q.platform.is.mobile
          ? $t('contract.hint.mobile')
          : $t('contract.hint.desktop')
      "
      :behavior="$q.platform.is.ios ? 'dialog' : 'menu'"
      :rules="[(val) => val && val.length > 0]"
      :error-message="$t('contract.rules')"
      popup-content-class="q-pt-sm"
      new-value-mode="add-unique"
      input-debounce="50"
      name="contractType"
      autocomplete="on"
      spellcheck="false"
      color="secondary"
      use-input
      lazy-rules
      hide-selected
      :hide-bottom-space="!$q.platform.is.desktop"
      :dense="$q.platform.is.desktop"
      fill-input
      outlined
      square
      @filter="filterOptions"
    >
      <template #prepend>
        <QIcon name="assignment" />
      </template>
    </QSelect>
    <div class="row justify-center items-center">
      <QInput
        v-if="!$q.platform.is.mobile"
        v-model="duration.from"
        :readonly="Boolean(signing)"
        :label="$t('duration.from')"
        class="col no-padding"
        :type="typeof duration.from === 'string' ? 'text' : 'date'"
        :rules="typeof duration.from === 'string' ? ['date'] : []"
        :dense="$q.platform.is.desktop"
        mask="date"
        outlined
        square
        color="secondary"
      >
        <QTooltip>{{ $t('duration.fromHint') }}</QTooltip>
      </QInput>
      <QBtnDropdown
        v-if="$q.platform.is.mobile"
        :disable="Boolean(contract.credentialSubject.startTime)"
        square
        outline
        cover
        no-wrap
        no-icon-animation
        color="grey-6"
        class="my-dropdown col"
      >
        <template #label>
          <div
            class="row no-wrap"
            style="flex: 1"
          >
            <QIcon
              left
              name="event"
              color="grey-6"
            />
            <span
              class="text-caption text-grey-8"
              style="align-self: center"
            >
              {{ duration.from }}
              <template v-if="!dateNoLimit && duration.from !== duration.to">
                - {{ duration.to }}
              </template>
            </span>
          </div>
          <QSeparator
            vertical
            spaced
            inset
          />
          <QToggle
            v-model="dateNoLimit"
            :disable="Boolean(contract.credentialSubject.startTime)"
            checked-icon="hourglass_disabled"
            unchecked-icon="date_range"
            size="lg"
          />
        </template>
        <DateComponent
          :range="!dateNoLimit"
          @select="onSelectDate"
        />
      </QBtnDropdown>
      <QInput
        v-if="!$q.platform.is.mobile"
        v-model="duration.to"
        :type="typeof duration.to === 'string' ? 'text' : 'date'"
        :rules="typeof duration.to === 'string' ? ['date'] : []"
        :label="$t('duration.to')"
        :readonly="signing || dateNoLimit"
        :dense="$q.platform.is.desktop"
        class="col no-padding"
        mask="date"
        outlined
        square
        color="secondary"
      >
        <QTooltip v-if="!dateNoLimit">
          {{ $t('duration.toHint') }}
        </QTooltip>
        <QSeparator
          v-if="!dateNoLimit"
          vertical
          spaced
          inset
        />
        <QToggle
          v-if="!$q.platform.is.mobile"
          v-model="dateNoLimit"
          :disable="
            Boolean(
              contract.credentialSubject.startTime ||
              contract.credentialSubject.endTime,
            )
          "
          color="secondary"
          class="non-selectable"
          :class="{
            'text-grey-14': !dateNoLimit,
            'text-secondary': dateNoLimit,
          }"
          :label="$t('duration.infinity')"
        >
          <QTooltip>{{ $t('duration.noLimit') }}</QTooltip>
        </QToggle>
      </QInput>
    </div>
    <div class="row">
      <QBtn
        v-if="customers.length === 0"
        ripple
        square
        stretch
        :class="{
          'full-width': !$q.platform.is.desktop,
        }"
        no-caps
        label="Добавить в маршрут исполнителей"
        icon="route"
        color="secondary"
        @click="onAddCustomer"
      />
    </div>
    <template v-if="customers.length">
      <QInput
        v-model.trim="customer"
        :readonly="Boolean(signing)"
        :label="$t('customer.type')"
        :hint="$t('customer.hint')"
        :error-message="$t('customer.rules')"
        autocomplete="on"
        name="customer"
        type="text"
        spellcheck="true"
        :hide-bottom-space="!$q.platform.is.desktop"
        :hide-hint="!$q.platform.is.desktop"
        :dense="$q.platform.is.desktop"
        outlined
        lazy-rules
        square
        color="secondary"
        @focus="onFocusInput"
      >
        <template #prepend>
          <QIcon name="assignment_ind" />
        </template>
        <template #append>
          <QCheckbox
            v-model="isCustomerOrg"
            :disable="Boolean(true)"
            size="md"
            color="white"
            keep-color
            checked-icon="group"
            unchecked-icon="person"
            :dense="$q.platform.is.desktop"
          >
            <QTooltip>{{ $t('customer.hintType') }}</QTooltip>
          </QCheckbox>
        </template>
      </QInput>
      <MultiContactComponent
        v-model="modelContact"
        :readonly="Boolean(true)"
        :label="$t('customer.contact')"
        :hint="$t('customer.hintContact')"
        :error-message="$t('consumer.emailRules')"
        :hide-hint="!$q.platform.is.desktop"
        :hide-bottom-space="!$q.platform.is.desktop"
        :dense="$q.platform.is.desktop"
        color="secondary"
        @focus="onFocusInput"
      />
    </template>
    <QInput
      v-show="geolocation"
      v-model.trim="geolocation"
      :label="'Location'"
      :hint="'Location'"
      type="text"
      class="no-padding"
      color="secondary"
      :hide-hint="!$q.platform.is.desktop"
      :dense="$q.platform.is.desktop"
      readonly
      hide-bottom-space
      outlined
      square
      autogrow
      @focus="onFocusInput"
    >
      <template #prepend>
        <QIcon name="map" />
      </template>
    </QInput>
    <QInput
      v-model.trim="description"
      :label="$t('description.type')"
      :hint="$t('description.hint')"
      type="textarea"
      class="no-padding"
      color="secondary"
      :hide-hint="!$q.platform.is.desktop"
      :dense="$q.platform.is.desktop"
      :readonly="signing"
      hide-bottom-space
      outlined
      square
      autogrow
      @focus="onFocusInput"
    >
      <template #prepend>
        <QIcon name="sticky_note_2" />
      </template>
    </QInput>
    <div class="text-left">
      <QBtn
        ripple
        square
        stretch
        :class="{
          'full-width': !$q.platform.is.desktop,
        }"
        :label="$t('contractForm.submit')"
        icon-right="save"
        type="submit"
        color="accent"
        :loading="loadingForm"
        :disable="loadingForm"
      />
    </div>
  </QForm>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useQuasar,
  date,
  QForm,
  QBtnDropdown,
  QSelect,
  QSeparator,
  QBtn,
  QIcon,
  QInput,
  QCheckbox,
  QTooltip,
  QToggle,
} from 'quasar'
import { storeToRefs } from 'pinia'
import { WebId } from '@inrupt/solid-client'
import useContractStore from '@/entities/contract'
import useGeoStore from '@/shared/model/geo'
import { ContractCarouselComponent } from '@/entities/contract'
import MultiContactComponent from './MultiContact.vue'
import DateComponent from './DateComponent.vue'
import { formatDate } from '@/shared/lib/dateHelper'
// import { getIdentifierMessage } from '../helpers/schemaHelper'
// import { signMessageUsePhantom } from '../services/phantomWalletService'
// import { signMessageUseSecretKey } from '../services/cryptoService'
// import { keys } from '../services/databaseService'
import type { VerifiableCredential } from '@/shared/model/jsonld'
import type { ImageType } from '@/shared/model/media'
import { useModal } from '@/shared/lib/useModal'

enum InputType {
  email = 'email',
  url = 'url',
  tel = 'tel',
  text = 'text',
}
type Duration = {
  from: string
  to: string
}
type MultiContact = {
  type: InputType
  value: string
}

const emit = defineEmits(['create'])
const props = withDefaults(
  defineProps<{
    signing: boolean
    contract: VerifiableCredential
  }>(),
  {
    signing: false,
    contract: null,
  },
)

const $t = useI18n().t
const $q = useQuasar()
const modal = useModal()
const contractStore = useContractStore()
const geoStore = useGeoStore()

const { geolocation } = storeToRefs(geoStore)
let cloneStartDate: Date | null = null
const contract = ref<VerifiableCredential>(props.contract)
const contractType = ref<string | null>(null)
const customers = ref([])
const customer = ref<WebId>(null)
const isCustomerOrg = ref<boolean | null>(null)
const description = ref<string | null>(null)
const dateNoLimit = ref<boolean | null>(null)
const contractOptions = ref(contractStore.getArchiveKeys)
const contractForm = ref<QForm>()
const loadingForm = ref(false)
const modelContact = ref<MultiContact[]>([])
const attachments = ref<ImageType[]>([])

if (contract.value.credentialSubject?.object?.attachment) {
  contract.value.credentialSubject?.object?.attachment.forEach((attachment) => {
    console.log('attachment', attachment)
    attachments.value.push({
      url: attachment.url,
      mediaType: 'application/pdf',
    })
  })
}
customers.value.push(props.contract.credentialSubject.actor)
if (props.contract.credentialSubject.actor?.email) {
  modelContact.value.push({
    type: InputType.email,
    value: props.contract.credentialSubject.actor.email,
  })
}
if (props.contract.credentialSubject.actor?.url) {
  modelContact.value.push({
    type: InputType.url,
    value: props.contract.credentialSubject.actor.url,
  })
}
customer.value = props.contract.credentialSubject.actor.name
contractType.value = props.contract.credentialSubject.object?.name
isCustomerOrg.value =
  props.contract.credentialSubject?.actor?.type === 'Organization'
description.value = props.contract.credentialSubject.object.summary
dateNoLimit.value = Boolean(props.contract.credentialSubject.endTime)
cloneStartDate = date.clone(
  new Date(props.contract.credentialSubject.startTime),
)

const afterYearDate = new Date(
  date
    .clone(cloneStartDate)
    .setFullYear(date.clone(cloneStartDate).getFullYear() + 1),
)
const duration = ref<Duration>({
  from: formatDate(cloneStartDate),
  to: formatDate(afterYearDate),
})

function filterOptions(val: string, update: (callback: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase()
    contractOptions.value = contractStore.getArchiveKeys.filter(
      (v: string) => v.toLowerCase().indexOf(needle) > -1,
    )
  })
}

function onAddCustomer() {
  customers.value.push(null)
}

function resetForm() {
  const contractFormValue = contractForm.value
  contractFormValue?.resetValidation()
  contractType.value = ''
  customer.value = ''
  description.value = ''
  modelContact.value = []
  duration.value = {
    from: formatDate(contract.value.credentialSubject.startTime),
    to: formatDate(afterYearDate),
  }
  dateNoLimit.value = false
}

async function onResetForm(confirm = false) {
  if (
    confirm &&
    !(await modal.confirm($t('components.contractForm.resetDialog.message')))
  ) {
    return
  }
  resetForm()
}

function onSelectDate(value: string | Duration) {
  if (value === null) {
    $q.notify({
      type: 'warning',
      message: $t('components.contractForm.selectDate.fail'),
    })
    duration.value = {
      from: formatDate(contract.value.credentialSubject.startTime),
      to: formatDate(afterYearDate),
    }
    return
  }
  switch (typeof value) {
    case 'string': {
      duration.value = {
        from: date.isValid(value) ? formatDate(new Date(value)) : '',
        to: date.isValid(value) ? formatDate(new Date(value)) : '',
      }
      break
    }
    case 'object': {
      duration.value = {
        from: date.isValid(String(value.from))
          ? formatDate(new Date(value.from))
          : '',
        to: date.isValid(String(value.to))
          ? formatDate(new Date(value.to))
          : '',
      }
      break
    }
    default: {
      $q.notify({
        type: 'warning',
        message: $t('components.contractForm.wrongDate.fail'),
      })
      break
    }
  }
}

function onFocusInput(event: Event) {
  if (event.target instanceof HTMLElement) {
    event.target.scrollIntoView()
  }
}

/* fixme поддержать возможность подписывать контракты используя Solana
async function signContractUseSolana(contract: VerifiableCredential) {
  const message = getIdentifierMessage(contract.credentialSubject)
  switch (walletStore.type) {
    case WalletType.Phantom: {
      const { signature } = await signMessageUsePhantom(message)
      contract.credentialSubject.identifier.push({
        value: signature,
        name: WalletType.Phantom,
      })
      break
    }
    case WalletType.Secret: {
      const { secretKey } = await keys.last()
      const { signature } = signMessageUseSecretKey(message, secretKey)
      contract.credentialSubject.identifier.push({
        value: signature,
        name: WalletType.Secret,
      })
      break
    }
  }
  return contract
}
 */

async function saveContract() {
  loadingForm.value = true
  try {
    await contractStore.addContract(props.contract)
    emit('create')
    onResetForm()
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: $t('components.contractForm.submitDate.fail'),
    })
  } finally {
    loadingForm.value = false
  }
}

// todo поддержать подписание договора
// async function sign() {
//   // isLoggedIn.value
//   loadingForm.value = true
//   try {
//     // todo сначала создается презентация, затем выгружается на SOLID
//     await props.contract.upload()
//   } catch (error) {
//     console.error(error)
//   } finally {
//     loadingForm.value = false
//   }
// }

defineExpose({
  resetForm: onResetForm,
})
</script>
<style lang="scss">
.my-dropdown .q-btn__content.col {
  justify-content: space-between;
}
</style>
