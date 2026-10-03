import { useMeta } from 'quasar'
import { useI18n } from 'vue-i18n'
import { isTWA } from '@/shared/lib/detector'
import pkg from '../../package.json'
import twaManifest from '../../twa-manifest.json'

export function useAppMeta(): void {
  const $t = useI18n().t
  const webSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'url': pkg.homepage,
    'thumbnailUrl': twaManifest.iconUrl,
    'version': pkg.version,
    'creator': {
      '@type': 'Organization',
      ...pkg.author,
    },
    'publisher': pkg.author.name,
    'license': 'https://github.com/gotois/secretary-app/blob/master/LICENSE',
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

  useMeta({
    titleTemplate: (title: string) =>
      isTWA.value ? title : `${title} - archive.gotointeractive.com`,
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
  })
}
