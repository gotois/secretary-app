<template>
  <div class="items-start justify-center self-start items-stretch">
    <QCard
      square
      :flat="$q.platform.is.mobile"
      :bordered="$q.platform.is.desktop"
      class="col bg-grey-1 text-dark col-3"
    >
      <QBadge
        floating
        rounded
        color="light-blue-3"
        text-color="dark"
        label="Beta"
      />
      <QCardSection class="text-center">
        <div class="text-h5 text-weight-bolder">
          {{ $t('pricing.free.title') }}
        </div>
        <div class="text-subtitle2 text-weight-light q-pb-md">
          {{ $t('pricing.free.description') }}
        </div>
        <div>
          <span class="vertical-middle text-h4">{{ basePrice }}</span>
          {{ $t('pricing.free.price') }}
        </div>
      </QCardSection>
      <QSeparator
        inset
        color="grey-3"
      />
      <QCardSection>
        <QList
          :dense="$q.platform.is.desktop"
          bordered
          class="rounded-borders bg-grey-1"
        >
          <QTree
            class="full-width"
            :nodes="freeDetails"
            :default-expand-all="$q.screen.gt.sm"
            :dense="$q.screen.gt.sm"
            node-key="label"
            text-color="dark"
          />
        </QList>
      </QCardSection>
    </QCard>
    <QCard
      square
      :flat="$q.platform.is.mobile"
      :bordered="$q.platform.is.desktop"
      class="bg-primary text-white col-3"
    >
      <QBadge
        floating
        rounded
        color="warning"
        text-color="dark"
        label="In active development"
      />
      <QCardSection class="text-center">
        <div class="text-h5 text-weight-bolder">
          {{ $t('pricing.premium.title') }}
        </div>
        <div class="text-subtitle2 text-weight-light q-pb-md">
          {{ $t('pricing.premium.description') }}
        </div>
        <div>
          <span class="vertical-middle text-h4">
            {{ premiumPrice }}
          </span>
          {{ $t('pricing.premium.price') }}
        </div>
      </QCardSection>
      <QSeparator
        inset
        color="grey-5"
      />
      <QCardSection>
        <QList
          :dense="$q.platform.is.desktop"
          bordered
          class="rounded-borders bg-grey-1"
        >
          <QTree
            class="full-width"
            :nodes="premiumDetails"
            :default-expand-all="$q.screen.gt.sm"
            :dense="$q.screen.gt.sm"
            node-key="label"
            text-color="dark"
          />
        </QList>
      </QCardSection>
    </QCard>
    <QCard
      square
      :flat="$q.platform.is.mobile"
      :bordered="$q.platform.is.desktop"
      class="bg-black text-white col-3"
    >
      <QBadge
        floating
        rounded
        color="deep-purple-2"
        text-color="dark"
        label="Alpha"
      />
      <QCardSection class="text-center">
        <div class="text-h5 text-weight-bolder">
          {{ $t('pricing.vip.title') }}
        </div>
        <div class="text-subtitle2 text-weight-light q-pb-md">
          {{ $t('pricing.vip.description') }}
        </div>
        <div>
          <span class="vertical-middle text-h4">
            {{ vipPrice }}
          </span>
          {{ $t('pricing.vip.price') }}
        </div>
      </QCardSection>
      <QSeparator
        inset
        color="grey-8"
      />
      <QCardSection>
        <QList
          :dense="$q.platform.is.desktop"
          bordered
          class="rounded-borders bg-grey-1"
        >
          <QTree
            class="full-width"
            :nodes="vipDetails"
            :default-expand-all="$q.screen.gt.sm"
            :dense="$q.screen.gt.sm"
            node-key="label"
            text-color="dark"
          />
        </QList>
      </QCardSection>
    </QCard>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useQuasar,
  QCard,
  QCardSection,
  QSeparator,
  QList,
  QTree,
  QBadge,
} from 'quasar'

const $q = useQuasar()
const $t = useI18n().t

const basePrice = '0 RUB'
const premiumPrice = '299 RUB'
const vipPrice = '999 RUB'

const freeSupport = ref([
  {
    label: $t('pricing.free.support.title'),
    icon: 'contact_support',
    children: [
      { label: $t('pricing.free.support.values.1') },
      { label: $t('pricing.free.support.values.2') },
    ],
  },
])
const premiumSupport = ref([
  {
    label: $t('pricing.premium.support.title'),
    icon: 'contact_support',
    children: [
      {
        label: $t('pricing.premium.support.values.1'),
        children: [{ label: $t('pricing.premium.support.values.2') }],
      },
    ],
  },
])
const vipSupport = ref([
  {
    label: $t('pricing.vip.support.title'),
    icon: 'contact_support',
    children: [
      {
        label: $t('pricing.vip.support.values.1'),
        children: [
          { label: $t('pricing.vip.support.values.2') },
          { label: $t('pricing.vip.support.values.3') },
        ],
      },
    ],
  },
])
const freeFunctional = ref([
  {
    label: $t('pricing.free.functions.title'),
    icon: 'shield',
    children: [
      { label: $t('pricing.free.functions.values.1') },
      { label: $t('pricing.free.functions.values.2') },
    ],
  },
])
const premiumFunctional = ref([
  {
    label: $t('pricing.premium.functions.title'),
    icon: 'admin_panel_settings',
    children: [
      {
        label: $t('pricing.premium.functions.values.1'),
        children: [
          { label: $t('pricing.premium.functions.values.2') },
          { label: $t('pricing.premium.functions.values.3') },
        ],
      },
    ],
  },
])
const vipFunctional = ref([
  {
    label: $t('pricing.vip.functions.title'),
    icon: 'security',
    children: [
      {
        label: $t('pricing.vip.functions.values.1'),
        children: [{ label: $t('pricing.vip.functions.values.2') }],
      },
    ],
  },
])
</script>
