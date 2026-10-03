<template>
  <QLayout v-if="bridge">
    <QPageContainer>
      <ScheduleCalendarView
        :calendar="bridge.content.value?.calendar"
        :timezone="timezone"
        :locale="bridge.context.value?.locale || 'ru-RU'"
        :selected-date="selectedDate"
        :loading="loading || bridge.connecting.value"
        :error="error || bridge.error.value"
        read-only
        @refresh="refresh"
        @select-date="selectDate"
      />
    </QPageContainer>
  </QLayout>
  <RouterView v-else />
</template>
<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ScheduleCalendarView } from '@/widgets/calendar-view/presentation'
import { createHostBridge } from '@/shared/lib/mcp/hostBridge'
import { RouterView } from 'vue-router'
import { useMeta, QLayout, QPageContainer, Dark } from 'quasar'
import { isTWA } from '@/shared/lib/detector'
import pkg from '../package.json'
import twaMinifest from '../twa-manifest.json'

const bridge =
  import.meta.env.MCP_APP === 'true' ? createHostBridge() : undefined

const timezone = computed(
  () =>
    bridge?.content.value?.timezone || bridge?.context.value?.timeZone || 'UTC',
)
const selectedDate = ref(Temporal.Now.plainDateISO(timezone.value).toString())
const loading = ref(false)
const error = ref<string>()
const i18n = useI18n()
if (bridge) {
  watch(
    bridge.content,
    (content) => {
      if (content?.selectedDate) selectedDate.value = content.selectedDate
    },
    { immediate: true },
  )
  watch(
    bridge.context,
    (context) => {
      Dark.set(context?.theme === 'dark')
      i18n.locale.value = context?.locale || 'ru-RU'
    },
    { immediate: true },
  )
}
async function refresh() {
  if (!bridge) return
  if (loading.value || bridge.connecting.value) return
  loading.value = true
  error.value = undefined
  try {
    if (!bridge.connected.value) await bridge.connect()
    else await bridge.loadDay(selectedDate.value, timezone.value)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    loading.value = false
  }
}
function selectDate(day: string) {
  selectedDate.value = day
  void refresh()
}
onBeforeUnmount(() => {
  void bridge?.close()
})
void bridge?.connect()

const $t = i18n.t

const webSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'url': pkg.homepage,
  'thumbnailUrl': twaMinifest.iconUrl,
  'version': pkg.version,
  'creator': {
    '@type': 'Organization',
    ...pkg.author,
  },
  'publisher': pkg.author.name,
  'license': 'https://github.com/gotois/secretary-web/blob/master/LICENSE',
  'potentialAction': {
    '@type': 'SearchAction',
    'target': pkg.homepage + 'search?name={query_string}',
    'query-input': 'required name=query_string',
  },
}
const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'url': pkg.author.url,
  'logo': 'https://avatars.githubusercontent.com/u/16117425',
  'location': {
    '@type': 'VirtualLocation',
    'url': 'https://app.aragon.org/#/daos/ethereum/gic.dao.eth',
  },
  'sameAs': ['https://github.com/gotois'],
  'founder': {
    '@type': 'Person',
    ...pkg.contributors[0],
  },
}
const metaData = {
  titleTemplate: (title: string) =>
    isTWA ? title : `${title} - archive.gotointeractive.com`,
  meta: {
    'keywords': { name: 'keywords', content: pkg.keywords.join(', ') },
    'equiv': {
      'http-equiv': 'Content-Type',
      'content': 'text/html; charset=UTF-8',
    },
    'theme-color': {
      name: 'theme-color',
      content: '#ffffff',
      media: '(prefers-color-scheme: light)',
    },
    'referrer': {
      name: 'referrer',
      content:
        window.location.hostname === 'localhost'
          ? 'no-referrer-when-downgrade'
          : 'strict-origin',
    },
  },
  script: {
    webSite: {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(webSite),
    },
    organization: {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(organization),
    },
  },
  noscript: {
    default: `<strong>${$t('navigation.noscript')}</strong>`,
  },
  link: {
    opensearch: {
      rel: 'search',
      type: 'application/opensearchdescription+xml',
      title: $t('opensearch.title'),
      href: pkg.homepage + 'opensearch.xml',
    },
  },
}

useMeta(metaData)
</script>
