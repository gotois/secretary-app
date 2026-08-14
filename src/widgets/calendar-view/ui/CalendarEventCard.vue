<template>
  <QCard
    v-ripple
    flat
    :dark="!$q.dark.isActive"
    bordered
    square
  >
    <QCardSection
      class="q-pa-xs justify-between items-center items-baseline"
      :horizontal="props.horizontal"
    >
      <div
        class="flex justify-between"
        :class="{
          'text-black': $q.dark.isActive,
          'text-white': !$q.dark.isActive,
        }"
      >
        <div class="text-subtitle2 text-bold">
          {{ title }}
        </div>
      </div>
      <div class="text-caption text-red ellipsis">
        ⏰
        {{ date.formatDate(convertTemporalToDate(start), 'HH:mm') }}
        -
        {{ date.formatDate(convertTemporalToDate(end), 'HH:mm') }}
      </div>
      <div
        v-if="location"
        class="ellipsis-2-lines text-caption"
      >
        📍 {{ location }}
      </div>
      <div
        v-if="description"
        class="ellipsis-2-lines"
      >
        {{ description }}
      </div>
      <div
        v-if="participant.length"
        class="ellipsis text-caption"
      >
        {{ participant.map((item) => item.name).join(', ') }}
      </div>
    </QCardSection>
    <QPopupProxy>
      <TaskFull
        :style="{
          width: $q.platform.is.desktop ? '640px' : '320px'
        }"
        :event-id="eventId"
        :title="title"
        :description="description"
        :attaches="attaches"
        :start-time="convertTemporalToDate(start)"
        :end-time="convertTemporalToDate(end)"
        :tag="tag"
        :same-as="''"
        :location="location"
        :link="link"
        :organizer="organizer"
        :participant="participant"
        @edit="onEdit"
        @remove="onRemove"
      />
    </QPopupProxy>
  </QCard>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { QCard, QCardSection, QPopupProxy, date, useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import TaskFull from './TaskFull.vue'
import useContractStore from '@/entities/contract'
import useAuthStore from '@/entities/oidc-session'
import type { Agent } from '@/shared/model/contact'
import type { FormatImageType } from '@/shared/model/media'
import { convertTemporalToDate } from '@/shared/lib/dateHelper'
import { ROUTE_NAMES } from '@/shared/config/routes'

const $q = useQuasar()
const i18n = useI18n()
const contractStore = useContractStore()
const authStore = useAuthStore()
const router = useRouter()

const { isLoggedIn } = storeToRefs(authStore)

const $t = i18n.t

const emit = defineEmits(['remove'])

const props = defineProps({
  horizontal: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
  eventId: {
    type: String as PropType<string>,
    required: true,
  },
  title: {
    type: String as PropType<string>,
    required: true,
  },
  start: {
    type: Object as PropType<Temporal.ZonedDateTime>,
    required: true,
  },
  end: {
    type: Object as PropType<Temporal.ZonedDateTime>,
    required: true,
  },
  location: {
    type: String as PropType<string>,
    default: () => '',
  },
  description: {
    type: String as PropType<string>,
    default: null,
  },
  attaches: {
    type: Array as PropType<FormatImageType[]>,
    default: (): FormatImageType[] => [],
  },
  organizer: {
    type: Object as PropType<Agent>,
    default: (): Agent => ({ type: 'Person', name: '' }),
  },
  participant: {
    type: Array as PropType<Agent[]>,
    default: (): Agent[] => [],
  },
  tag: {
    type: Array as PropType<string[]>,
    default: (): string[] => [],
  },
  link: {
    type: String as PropType<string>,
    default: null,
  },
})

function onEdit() {
  void router.push({
    name: ROUTE_NAMES.EDIT,
    params: { taskId: props.eventId },
  })
}

function onRemove() {
  $q.notify({
    message: !isLoggedIn.value
      ? $t('contract.removeDialog.message')
      : $t('contract.removeDialog.isLoginMessage'),
    type: 'negative',
    position: 'center',
    group: false,
    multiLine: true,
    textColor: 'white',
    timeout: 7500,
    attrs: {
      role: 'alertdialog',
    },
    actions: [
      {
        icon: 'check_circle',
        label: $t('contract.removeDialog.ok'),
        color: 'white',
        async handler() {
          try {
            await contractStore.removeContract(props.eventId, isLoggedIn.value)
            emit('remove')
          } catch (error) {
            console.error(error)
            $q.notify({
              type: 'negative',
              message: $t('contract.removeDialog.fail'),
            })
          }
        },
      },
      {
        icon: 'cancel',
        label: $t('contract.removeDialog.cancel'),
        color: 'white',
      },
    ],
  })
}
</script>
