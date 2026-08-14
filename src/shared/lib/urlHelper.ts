import { openURL, Platform } from 'quasar'
import { openLink, openTelegramLink } from '@tma.js/sdk'

export function validUrlString(url: string) {
  if (!url || url.length < 10) {
    return false
  }
  if (
    !(
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('did:')
    )
  ) {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return !(Reflect.has(URL, 'canParse') && !URL.canParse(url))
}

export function open(url: string) {
  if (openLink.isAvailable()) {
    if (url.includes('//t.me/') && openTelegramLink.isAvailable()) {
      openTelegramLink(url)
    } else {
      openLink(url, {
        tryBrowser: 'chrome',
        tryInstantView: true,
      })
    }
  }
  openURL(
    url,
    () => {
      if (Platform.is.desktop) {
        window.open(url, '_blank')
      } else {
        window.location.href = url
      }
    },
    {
      noopener: true,
      noreferrer: true,
      toolbar: false,
      menubar: false,
      popup: 1,
    },
  )
}
