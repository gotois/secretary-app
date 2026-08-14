<template>
  <QCard
    flat
    square
    bordered
  >
    <div class="row">
      <div
        class="column q-pl-md q-pb-sm"
        style="max-width: calc(100% - 45px)"
      >
        <p
          class="full-width q-pt-md text-subtitle1 text-uppercase text-weight-bold no-margin"
          :class="{
            'q-pb-md': !description,
            'q-pb-none': description && !$q.platform.is.desktop,
            'ellipsis': $q.platform.is.desktop,
          }"
        >
          <!-- Todo поддержать проверку на верификацию криптоключом Solana -->
          <!--template v-if="false /*isVerified(item, publicKey)*/">
            <QIcon name="verified" />
          </template>
          <template v-else>
            <QIcon name="error" color="warning" />
          </template-->
          {{ title }}
          <QTooltip>{{ title }}</QTooltip>
        </p>
        <div
          v-if="description"
          class="full-width text-caption q-pb-md text-grey no-margin"
          v-html="parse(description)"
        />
      </div>
    </div>
    <template v-if="attaches?.length">
      <QSeparator />
      <ContractCarouselComponent :model="attaches" />
    </template>
    <QSeparator />
    <QCardSection>
      <QBtn
        fab-mini
        color="white"
        text-color="accent"
        icon="share"
        class="absolute"
        style="top: 0; left: 18px; transform: translateY(-50%)"
        @click="onSheet"
      >
        <QTooltip>
          {{ $t('archiveList.shareFile') }}
        </QTooltip>
      </QBtn>
      <QBtn
        fab-mini
        color="negative"
        icon="delete"
        class="absolute"
        style="top: 0; left: 82px; transform: translateY(-50%)"
        aria-label="Удалить событие"
        @click="emit('remove')"
      >
        <QTooltip>Удалить событие</QTooltip>
      </QBtn>
      <div class="flex content-center text-overline no-margin q-pt-sm">
        <QIcon
          style="align-self: center"
          class="q-pr-xs"
          :name="itemScheduled(endTime) ? 'history_toggle_off' : 'schedule'"
          :color="itemScheduled(endTime) ? 'negative' : 'orange-9'"
        />
        <span
          :class="itemScheduled(endTime) ? 'text-negative' : 'text-orange-9'"
        >
          {{ prettyDate(startTime, endTime) }}
        </span>
      </div>
      <div
        v-if="organizer"
        class="row items-center"
      >
        <div
          class="flex overflow-hidden text-left ellipsis"
          style="left: 32px; right: 0"
        >
          <QIcon :name="organizer.type === 'Organization' ? 'group' : 'face'" />
          <div>
            {{ organizer.name }}
            {{ organizer.email }}
          </div>
        </div>
      </div>
      <div
        v-if="participant?.length"
        class="row items-center"
      >
        <div
          class="flex overflow-hidden text-left ellipsis"
          style="left: 32px; right: 0"
        >
          <QIcon :name="participant.length > 1 ? 'group' : 'face'" />
          <span
            v-for="({ url, name, email }, index) in participant"
            :key="index"
          >
            {{ name }} {{ url }} {{ email }}
          </span>
        </div>
      </div>
      <div>
        {{ link }}
      </div>
      <div
        v-if="tag.length"
        style="overflow-x: hidden"
        class="scroll-y q-mt-md q-mb-md"
      >
        <QChip
          v-for="(name, objectKey) in tag"
          :key="objectKey"
          :dense="$q.platform.is.desktop"
          square
          outline
          class="row"
          style="max-width: calc(100% - 8px)"
          :ripple="false"
          :color="$q.dark.isActive ? 'white' : 'dark'"
          clickable
          removable
          @remove="onRemoveArchiveName(name)"
          @click="onSelectArchiveName(name)"
        >
          <div class="ellipsis">
            {{ name }}
          </div>
          <QTooltip>{{ name }}</QTooltip>
        </QChip>
      </div>
    </QCardSection>
  </QCard>
</template>
<script lang="ts" setup>
import { PropType } from 'vue'
import { useRouter } from 'vue-router'
import {
  uid,
  useQuasar,
  QChip,
  QBtn,
  QIcon,
  QSeparator,
  QTooltip,
  QCardSection,
  QCard,
  copyToClipboard,
} from 'quasar'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import * as vc from '@digitalbazaar/vc'
import useAuthStore from '@/entities/oidc-session'
import { usePodStore } from '@/features/pod-sync'
import { WebId, universalAccess } from '@inrupt/solid-client'
// import useWalletStore from '@/entities/wallet'
import { ContractCarouselComponent } from '@/entities/contract'
import useContractStore from '@/entities/contract'
import useLangStore from '@/shared/model/lang'
import { openMap } from '@/shared/lib/geoService'
import { keyPair } from '@/shared/lib/databaseService'
import { parse } from '@/shared/lib/markdownHelper'
import { isDateNotOk } from '@/shared/lib/dateHelper'
import {
  readFilesPromise,
  getFileFromUrl,
  filesShare,
  canShare,
} from '@/shared/lib/fileHelper'
import { createCal, googleCalendarUrl } from '@/features/contract-calendar'
import { mailUrl } from '@/shared/lib/mailHelper'
import { open } from '@/shared/lib/urlHelper'
// import { isVerified } from '../helpers/contractHelper'
import { documentLoader } from '@/shared/lib/customLoaders'
import type { Agent } from '@/shared/model/contact'
import type { FormatImageType } from '@/shared/model/media'
import type {
  Presentation,
  VerifiableCredential,
  CredentialSubject,
} from '@/shared/model/jsonld'
import { ROUTE_NAMES } from '@/shared/config/routes'

enum Action {
  LINK = 'link',
  PUBLISH = 'publish',
  SHARE = 'share',
  CALENDAR = 'calendar',
  GOOGLE_CALENDAR = 'google-calendar',
  MAIL = 'mail',
  TELEPHONE = 'telephone',
  LAW = 'law',
  MAP = 'map',
}

type SheetAction = {
  label?: string
  icon?: string
  color?: string
  id?: Action
}

const router = useRouter()
const $q = useQuasar()
const i18n = useI18n()
const $t = i18n.t
const contractStore = useContractStore()
const authStore = useAuthStore()
const langStore = useLangStore()
const podStore = usePodStore()
// const walletStore = useWalletStore()

const { isLoggedIn } = storeToRefs(authStore)
// const { publicKey } = storeToRefs(walletStore)

const emit = defineEmits(['remove', 'edit'])
const props = defineProps({
  eventId: {
    type: String as PropType<string>,
    required: true,
  },
  attaches: {
    type: Array as PropType<FormatImageType[]>,
    default: (): FormatImageType[] => [],
  },
  tag: {
    type: Array as PropType<string[]>,
    default: (): string[] => [],
  },
  startTime: {
    type: Date as PropType<Date>,
    required: true,
  },
  endTime: {
    type: Date as PropType<Date>,
    default: null,
  },
  title: {
    type: String as PropType<string>,
    required: true,
  },
  description: {
    type: String as PropType<string>,
    default: '',
  },
  sameAs: {
    type: String as PropType<string>,
    default: '',
  },
  location: {
    type: String as PropType<string>,
    default: null,
  },
  organizer: {
    type: Object as PropType<Agent>,
    default: (): Agent => ({ type: 'Person', name: '' }),
  },
  participant: {
    type: Array as PropType<Agent[]>,
    default: (): Agent[] => [],
  },
  link: {
    type: String as PropType<string>,
    default: '',
  },
})

function itemScheduled(endTime: Date) {
  return endTime !== null && endTime < new Date()
}

async function signPresentation(verifiableCredential: VerifiableCredential) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  const presentation = vc.createPresentation({
    verifiableCredential: [verifiableCredential],
    // todo настроить id и holder
  }) as Presentation
  const suite = await keyPair.getSuite()
  // Если вызвать метод sign два и более раза, то появляется Proof Chains
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
  return await vc.signPresentation({
    presentation,
    suite,
    challenge: uid(),
    documentLoader: documentLoader, // todo переделать под domain
  })
}

async function verifyPresentation(presentation: Presentation) {
  const suite = await keyPair.getSuite()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
  const verify = await vc.verify({
    presentation,
    documentLoader,
    suite,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    challenge: Array.isArray(presentation.proof)
      ? presentation.proof[0]?.challenge
      : presentation.proof.challenge,
  })
  console.log('v', verify)
}

function prettyDate(startTime: Date, endTime?: Date) {
  const formatterDate = new Intl.DateTimeFormat(langStore.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  if (!isDateNotOk(startTime) && (endTime === null || endTime === undefined)) {
    return formatterDate.format(startTime)
  }
  if (isDateNotOk(startTime) || isDateNotOk(endTime)) {
    return ''
  }
  return formatterDate.format(startTime) + ' — ' + formatterDate.format(endTime)
}

function toCalendarAddress(agent: Agent) {
  const uri = agent.email ?? agent.url

  return uri ? { name: agent.name, uri } : undefined
}

function onSheet() {
  let actions: SheetAction[] = []
  const group1: SheetAction[] = [] // Share local
  if (canShare && props.attaches?.length) {
    group1.push({
      label: $t('components.archiveList.sheet.share.label'),
      icon: $q.platform.is.android ? 'share' : 'ios_share',
      color: 'info',
      id: Action.SHARE,
    })
  }
  group1.push({
    label: $t('components.archiveList.sheet.event.native.label'),
    icon: 'event',
    color: 'info',
    id: Action.CALENDAR,
  })
  if (group1.length) {
    actions = actions.concat(group1)
    actions.push({})
  }
  const group2: SheetAction[] = [] // Publish Group
  // todo отображать если был указан WebId внешнего клиента
  if (isLoggedIn.value) {
    group2.push({
      label: 'Publish to Pod',
      icon: 'publish',
      color: 'primary',
      id: Action.PUBLISH,
    })
    group2.push({
      label: $t('components.archiveList.sheet.link.label'),
      icon: 'link',
      color: 'primary',
      id: Action.LINK,
    })
  }
  if ($q.platform.is.android) {
    group2.push({
      label: $t('components.archiveList.sheet.event.google.label'),
      icon: 'event',
      color: 'secondary',
      id: Action.GOOGLE_CALENDAR,
    })
  }
  if (group2.length) {
    actions = actions.concat(group2)
  }
  const group3: SheetAction[] = [] // Message Group
  if (props.organizer && (props.organizer.email || props.organizer.telephone)) {
    if (props.organizer.email) {
      group3.push({
        label: $t('components.archiveList.sheet.mail.label'),
        icon: 'contact_mail',
        color: 'secondary',
        id: Action.MAIL,
      })
    }
    if (props.organizer.telephone) {
      group3.push({
        label: $t('components.archiveList.sheet.telephone.label'),
        icon: 'call',
        color: 'secondary',
        id: Action.TELEPHONE,
      })
    }
    group3.push({
      label: $t('components.archiveList.sheet.law.label'),
      icon: 'gavel',
      color: 'secondary',
      id: Action.LAW,
    })
  }
  if (props.location?.length) {
    group3.push({
      label: $t('components.archiveList.sheet.map.label'),
      icon: 'map',
      color: 'secondary',
      id: Action.MAP,
    })
  }
  if (group3.length) {
    actions.unshift({})
    actions = actions.concat(group3)
  }

  $q.bottomSheet({
    title: $t('components.archiveList.sheet.title'),
    grid: !$q.platform.is.mobile,
    class: $q.platform.is.desktop ? 'text-center' : '',
    actions: actions,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
  }).onOk(async (action: SheetAction) => {
    switch (action.id) {
      case Action.SHARE: {
        try {
          const files = [] as File[]
          for (const attach of props.attaches) {
            const file = await getFileFromUrl(attach.url)
            files.push(file)
          }
          await filesShare(files)
        } catch (error) {
          console.error(error)
          $q.notify({
            type: 'negative',
            message: $t('components.imageContextMenu.fail'),
          })
        }
        break
      }
      case Action.PUBLISH: {
        console.log('WIP')
        // await podStore.initPod() // раскоментировать если до этого не логинился
        await podStore.uploadIcal(
          podStore.resourceRootUrl + 'events',
          'myical example file',
        )
        break
      }
      case Action.LINK: {
        console.warn('WIP Action.SHARE: поддержать создание шаринг линка ')

        // Принцип работы:
        // Пользователь создает презентацию где выбирает только нужные поля для шаринга
        // Затем пользователь загружает свою презентацию на свой pod
        // После этого пользователь делится ссылкой на свою презентацию с другим пользователем
        const [contract] = await contractStore.filteredByIds([props.eventId])
        /* eslint-disable */
        const presentation = (await signPresentation({
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          'id':
            'https://archive.gotointeractive.com/task/' +
            contract.id +
            '/user/123',
          'type': ['VerifiableCredential'],
          'issuer': contract.issuer,
          'issuanceDate': contract.issuanceDate.toISOString(),
          'credentialSubject': {
            '@context': ['https://www.w3.org/ns/activitystreams'],
            'name': contract.name,
            'description': contract.description,
          } as CredentialSubject,
          'proof': contract.proof,
        })) as Presentation
        /* eslint-enable */
        console.log('presentation', presentation)
        // todo настроить правильную верификацию
        try {
          await verifyPresentation(presentation)
        } catch (e) {
          console.warn('Verification failed', e)
        }

        // todo - поддержать подписание презентации через Solana (для Phantom Wallet)
        // jsldContract = await signContractUseSolana(jsldContract)
        // console.log('signed contract', jsldContract)
        // endtodo

        // todo должно открываться меню с выбором Web_id другого лица и которому дается доступ на чтение или запись твоего календаря
        // ...
        const webId: WebId = '123123' // fixme webId из customers которому нужно дать доступ

        // todo при шаринге делать ограничение на добавление только proof и комментариев
        let shareLink = 'todo link' // fixme solid dataset url
        await universalAccess.setAgentAccess(
          shareLink,
          webId,
          { read: true, append: true, write: true },
          {
            fetch,
          },
        )
        return shareURL(shareLink)
      }
      case Action.GOOGLE_CALENDAR: {
        const url = googleCalendarUrl({
          text: props.title,
          details: props.description,
          startTime: props.startTime,
          endTime: props.endTime,
          location: props.sameAs,
        }).toString()
        return open(url)
      }
      case Action.CALENDAR: {
        const organizer = toCalendarAddress(props.organizer)
        const attendee = props.participant.flatMap((agent) => {
          const address = toCalendarAddress(agent)
          return address ? [address] : []
        })
        const icalFile: File = createCal($t('organization.prodid'), {
          event: {
            uid: uid(),
            url: props.link ? new URL(props.link) : undefined,
            summary: props.title,
            description: props.description,
            location: props.location ?? undefined,
            stamp: new Date(),
            start: props.startTime,
            end: props.endTime ?? undefined,
            categories: props.tag,
            attach: props.attaches.map((attach) => attach.url),
            organizer,
            attendee: attendee.length ? attendee : undefined,
            // todo поддержать поле geo
          },
        })
        return saveIcal(icalFile)
      }
      case Action.MAIL: {
        return open(mailUrl(props.organizer.email, props.title, props.sameAs))
      }
      case Action.TELEPHONE: {
        return open(props.organizer.telephone)
      }
      case Action.LAW: {
        return sendToCourt()
      }
      case Action.MAP: {
        return openMap(props.location)
      }
      default: {
        console.warn('Unknown id')
        break
      }
    }
  })
}

function sendToCourt() {
  alert('This functionality is under development.')
}

async function saveIcal(file: File) {
  try {
    const [dataURI] = await readFilesPromise([file])
    const link = document.createElement('a')
    link.href = dataURI
    link.setAttribute('download', file.name)
    link.setAttribute('target', '_blank')
    link.click()
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: $t('components.archiveList.sheet.share.fail'),
    })
  }
}

async function shareURL(url: string) {
  try {
    await copyToClipboard(url)
    $q.notify({
      type: 'positive',
      message: $t('components.archiveList.sheet.link.success'),
    })
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: $t('components.archiveList.sheet.link.fail'),
    })
  }
}

function onRemoveArchiveName(name: string) {
  alert('WIP')
  contractStore.removeContractName(name)
}

async function onSelectArchiveName(name: string) {
  alert('WIP')
  await router.push({
    name: ROUTE_NAMES.FILTER,
    query: {
      name: name,
      page: 1,
    },
  })
}
</script>
