declare module 'quasar/wrappers' {
  export const boot: typeof import('@quasar/app-vite').defineBoot
  export const route: typeof import('@quasar/app-vite').defineRouter
  export const store: typeof import('@quasar/app-vite').defineStore
}

declare module 'rgbaster' {
  export interface PaletteColor {
    color: string
    count: number
  }

  export default function analyze(
    src: string | HTMLImageElement,
  ): Promise<PaletteColor[]>
}

declare module 'qrcode' {
  const QRCode: {
    toDataURL(text: string): Promise<string>
  }

  export default QRCode
}

declare module '@digitalbazaar/vc' {
  export function createPresentation(options: unknown): unknown
  export function signPresentation(options: unknown): Promise<unknown>
  export function verify(options: unknown): Promise<unknown>
  export function verifyCredential(options: unknown): Promise<unknown>
}

declare module '@schedule-x/theme-shadcn/dist/index.css'

interface NetworkInformation extends EventTarget {
  effectiveType?: string
}

interface BatteryManager extends EventTarget {
  charging: boolean
  level: number
}

interface Navigator {
  connection?: NetworkInformation
  getBattery?: () => Promise<BatteryManager>
}

interface GoogleCredentialNotification {
  isSkippedMoment(): boolean
}

interface GoogleAccounts {
  id: {
    initialize(options: {
      client_id: string
      auto_select: boolean
      cancel_on_tap_outside: boolean
      callback: (data: unknown) => void
      ux_mode: string
      itp_support: boolean
      context: string
    }): void
    prompt(callback: (notification: GoogleCredentialNotification) => void): void
  }
}

interface PhantomSignInData {
  address: import('@solana/web3.js').PublicKey
}

interface PhantomSolanaProvider {
  isConnected?: boolean
  publicKey?: import('@solana/web3.js').PublicKey
  connect(options?: { onlyIfTrusted?: boolean }): Promise<void>
  signIn?(data?: unknown): Promise<PhantomSignInData>
  signMessage(
    message: Uint8Array,
    display?: string,
  ): Promise<{
    signature: Uint8Array
    publicKey: import('@solana/web3.js').PublicKey
  }>
  on(
    type: 'connect' | 'disconnect' | 'accountChanged',
    callback: (arg: import('@solana/web3.js').PublicKey | null) => void,
  ): void
}

interface Window {
  TelegramWebviewProxy?: unknown
  Telegram?: {
    WebView?: unknown
  }
  phantom?: {
    solana?: PhantomSolanaProvider
  }
  handleCredentialResponse?: (data: unknown) => void
  google: {
    accounts: GoogleAccounts
  }
}

declare var phantom:
  | {
      solana?: PhantomSolanaProvider
    }
  | undefined
