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

const freeDetails = [
  {
    label: $t('pricing.free.details.title'),
    icon: 'event_available',
    children: [{ label: $t('pricing.free.details.values.1') }],
  },
]
const premiumDetails = [
  {
    label: $t('pricing.premium.details.title'),
    icon: 'branding_watermark',
    children: [{ label: $t('pricing.premium.details.values.1') }],
  },
]
const vipDetails = [
  {
    label: $t('pricing.vip.details.title'),
    icon: 'dns',
    children: [
      { label: $t('pricing.vip.details.values.1') },
      { label: $t('pricing.vip.details.values.2') },
      { label: $t('pricing.vip.details.values.3') },
    ],
  },
]
</script>
