import { defineConfig } from '@quasar/app-vite'
import type { QuasarConf } from '@quasar/app-vite'
import type { QuasarContext } from '@quasar/app-vite/types/configuration/context.d.ts'
import dotenv from 'dotenv'
import pkg from './package.json' with { type: 'json' }

export default defineConfig((ctx: QuasarContext) => {
  if (ctx.dev) {
    dotenv.config({
      quiet: true,
    })
  }
  return {
    eslint: {
      fix: !ctx.prod,
      warnings: ctx.prod,
      errors: ctx.prod,
    },

    // https://v2.quasar.dev/quasar-cli/supporting-ts
    supportTS: {
      tsCheckerConfig: {
        eslint: {
          enabled: true,
          files: './src/**/*.{ts,vue}',
        },
      },
    },

    // https://v2.quasar.dev/quasar-cli/prefetch-feature
    preFetch: true,

    // https://v2.quasar.dev/quasar-cli/boot-files
    boot: [
      'mcp-app',
      'i18n',
      'vue-query',
      'addressbar-color',
      'geo',
      'tg-mini-app',
      'webpush',
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
    ],

    // Full list of options: https://v2.quasar.dev/quasar-cli/quasar-conf-js#Property%3A-build
    build: {
      async onPublish({
        arg,
      }: Parameters<
        NonNullable<NonNullable<QuasarConf['build']>['onPublish']>
      >[0]) {
        if (arg !== 'netlify') {
          throw new Error(`Unsupported publish target: ${arg}`)
        }
      },
      vueOptionsAPI: true,
      defineEnv: {
        secretary: process.env.SECRETARY_HOST,
        server: process.env.SERVER_HOST,
        telegram_bot_name: process.env.TELEGRAM_BOT_NAME,
        google_client_id: process.env.GOOGLE_CLIENT_ID,
        google_redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      },
      alias: {
        '@': ctx.appPaths.resolve.app('src'),
      },
      target: {
        browser: 'esnext',
      },
      modulePreload: {
        polyfill: false,
      },
      cssCodeSplit: false,
      lib: 'es',
      reportCompressedSize: ctx.prod,
      vueRouterMode: 'history',
      publicPath: '/',
      rebuildCache: true,
      rtl: false,
      showProgress: true,
      gzip: true,
    },
    // Full list of options: https://v2.quasar.dev/quasar-cli/quasar-conf-js#Property%3A-devServer
    devServer: ctx.dev
      ? {
          https: {
            key: 'certs/localhost-key.pem',
            cert: 'certs/localhost.pem',
          },
          host: '0.0.0.0',
          cors: true,
          origin: process.env.APP_URL,
          allowedHosts: process.env.APP_URL
            ? [new URL(process.env.APP_URL).hostname]
            : [],
          port: 8080,
          open: !process.env.TURBO_HASH, // opens browser window automatically
        }
      : {},
    // https://v2.quasar.dev/quasar-cli/quasar-conf-js#Property%3A-framework
    framework: {
      config: {
        dark: 'auto',
        notify: {
          /* look at QuasarConfOptions from the API card */
        },
      },

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'ru', // Quasar language pack

      // Quasar plugins
      plugins: [
        'Notify',
        'BottomSheet',
        'Loading',
        'Dialog',
        'Meta',
        'LocalStorage',
        'SessionStorage',
      ],
    },

    sourceFiles: {
      pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
      pwaServiceWorker: 'src-pwa/custom-service-worker',
      pwaManifestFile: 'src-pwa/manifest.json',
    },

    // https://v2.quasar.dev/quasar-cli/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'InjectManifest',
      workboxOptions: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
      },
      manifest: {
        name: pkg.productName,
        short_name: pkg.productName,
        description: pkg.description,
        start_url: '.',
        display: 'standalone',
        orientation: 'portrait',
        // lang: 'ru',
        dir: 'auto',
        scope: '/',
        iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
        categories: ['productivity'],
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png',
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        url_handlers: [
          {
            origin: 'https://archive.gotointeractive.com',
          },
        ],
      },
      metaVariables: {
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'default',
        appleTouchIcon120: 'icons/apple-icon-120x120.png',
        appleTouchIcon180: 'icons/apple-icon-180x180.png',
        appleTouchIcon152: 'icons/apple-icon-152x152.png',
        appleTouchIcon167: 'icons/apple-icon-167x167.png',
        appleSafariPinnedTab: 'icons/safari-pinned-tab.svg',
        msapplicationTileImage: 'icons/ms-icon-144x144.png',
        msapplicationTileColor: '#000000',
      },
    },
  }
})
