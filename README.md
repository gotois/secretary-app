[![Netlify Status](https://api.netlify.com/api/v1/badges/f467de0f-4773-4f8a-ac3b-5d4aeca0ea83/deploy-status)](https://app.netlify.com/sites/my-archive/deploys)

# Secretary App
> Ваша персональная криптобезопасная база обязательств.

[![TWA](https://img.shields.io/badge/Android_TWA-Install-green?logo=android&style=for-the-badge&link=https://play.google.com/store/apps/details?id=ru.baskovsky.archive.twa)](https://play.google.com/store/apps/details?id=ru.baskovsky.archive.twa)
[![TMA](https://img.shields.io/badge/Telegram_Mini_Apps-gray?logo=telegram&style=for-the-badge&link=https://t.me/gotois_bot/App)](https://t.me/gotois_bot/App)
[![PWA](https://img.shields.io/website/https/archive.gotointeractive.com.svg?style=for-the-badge&link=https://archive.gotointeractive.com)](https://archive.gotointeractive.com/)

## Описание продукта

- Боитесь хранить свои договоры в неконтролиуемых облачных сервисах, вроде DropBox, Yandex Disk, Google Drive?
- Надоело хранить свои договоры в специальных папочках на компьютере?
- Трудно найти потерявшийся документ?

> Сервис "Мои договоры" решил все эти проблемы!

- Надежное хранение и контроль договоров на вашем сервере или полностью офлайн.
- Легкий доступ к личным договорам: всегда под рукой в вашем любимом браузере.
- Удобный клиент и поиск.

---

## Технические возможности
Сервис использует последние криптографические стандарты LinkedData Signature и предоставляет клиентам следующие возможности:

- Адаптивный дизайн в версиях: `Trusted Web Activity`, `Progressive Web App` и `Telegram Mini Apps`;
- Доступ в режиме `Offline`;
- Хранения документов в семантическом формате `ActivityStreams 2.0`;
- Локальное хранилище в `IndexDB`;
- Передача данных через защищенный канал `HTTPS`;
- Цифровая подпись через `W3C Verifiable Credential`;
- Оплата договоров через блокчейн-кошелек `Phantom` или нативный ключ в блокчейне `Solana`;
- `Полнотекстовый поиск` по календарю;
- Подключение внешних календарей: `Google Calendar`;
- Поиск документа через `OpenSearch`;
- Поддержка импорта документов в форматах `PDF, PNG, JPG`;
- Генерация договора в формате `PDF`;
- Выгрузка событий в формате `ical` и через `navigator.share`;
- Безопасный вход через `2FA`;
- i18n мультиязычность `русский` и `английский` языки;
- Быстрая связь с агентом по `e-mail`, `tel`;
- Открытие гео-меток через `map`;
- Импорт/Экспорт базы данных в `zip`;
- Загрузка/Выгрузка календарей на собственный `Solid Pod`;
- Распознавание текста `OCR`;
- Искусственный интеллект `Секретарь`;
- Открытый код под лицензией `GPLv3`;
- Отсутствие телеметрии;

## Установка

### Установка из исходников
```bash
git clone git@github.com:gotois/secretary-app.git && cd secretary-app
npm i
```

### Сборка и запуск

- Обязательно установите `SERVER_HOST` в качестве переменной среды вашего сервера.
- Обязательно установите `TELEGRAM_BOT_NAME` в качестве переменной среды вашего личного телеграм бота.

[//]: # (DEPRECATED - GOOGLE должны храниться на сервере gotois, а здесь должны храниться только SERVER_HOST)
- Опционально установите `GOOGLE_CLIENT_ID` ([google-one-tap](https://developers.google.com/identity/gsi/web/guides/display-google-one-tap)) в качестве переменной среды.
- Опционально установите `GOOGLE_REDIRECT_URI` необходимый в качестве переменной среды.

#### Создание ключей для локального HTTPS

В терминале выполните следующие команды для создания сертификата для `localhost`:
```bash
mkcert -install
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1
```

#### Запуск в режиме локальной разработки
> hot-code reloading, error reporting, etc.

```bash
npm run dev
```

##### Запуск TWA в режиме эмуляции
```bash
bubblewrap install
```

#### Сборка PWA

```bash
npm run build
```

## MCP App

PWA и интерфейс внутри ChatGPT используют общий календарь
`widgets/calendar-view`: Schedule-X, ICS recurrence/VFREEBUSY и карточку
события. Подключение MCP-хоста находится в `src/shared/lib/mcp`; оба режима используют
единый `src/App.vue` и router.
Первый результат приходит от хоста, следующие запросы вызывают MCP tools;
в браузере общий календарь использует текущий backend.

```bash
npm run build:mcp
npm run dev:mcp-app
npm run test:mcp-app
```

Сборка MCP — профиль Quasar SPA (`MCP_APP=true`), результат в `dist/mcp`.
Основная PWA сохраняет прежние boot-файлы; embedded-профиль подключает i18n
без Telegram boot, авторизации PWA и service worker. Разработка запускается
через тот же Quasar dev server, HTTPS-сертификаты и порт 8080. Отдельного
сервера стенда и fixture-хоста нет; интерфейс ожидает подключение MCP-хоста.

`npm run build` также собирает MCP artifact и копирует его в `dist/pwa/mcp`.
Для публикации задайте `VITE_MCP_ASSET_BASE=https://<app-host>/mcp/` либо
`APP_URL=https://<app-host>`. Core получает готовый `/mcp/index.html` с этого
хоста без изменений HTML. Static hosting отдаёт 404 для отсутствующего MCP
artifact вместо PWA fallback; module assets доступны с CORS. Не удаляйте assets
предыдущей версии первые десять минут после публикации.

`npm run test:mcp-app` запускает unit/component-тесты MCP и общего календаря
через Vitest без локального сервера и Chrome. Они также включены в `npm test`.
Встраивание и обмен с настоящим ChatGPT проверяются в доступном ему MCP-хосте.

####  Сборка TWA

- Установите в `twa-manifest.json` свой `signingKey`:
```json5
{
  // ...
  "signingKey": {
    "path": "PATH_FOR_KEYSTORE",
    "alias": "ALIAS_NAME"
  },
  // ...
}
```

- Выполните команду:
```bash
npm run build:apk
```
- Откройте проект в `Android Studio`
- Установите `Gradle`
- Выполните шаги по сборке соответствующие настройке настоящего `build.gradle`

---
Сделано на принципах [GIC DAO](https://gotointeractive.com/manifest).
