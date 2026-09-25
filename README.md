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
git clone git@github.com:gotois/secretary-web.git && cd secretary-web
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

## Локальная проверка MCP App UI

```bash
npm run build
npm run dev:mcp-app
```

После запуска откройте `http://127.0.0.1:4173`. Стенд поддерживает сценарии
календаря, формы создания, ошибки tool, отсутствующего результата и
отсутствующего JS-модуля. Вызовы tools обслуживаются fixture-данными в памяти и
не записывают задачи в БД. Кнопка смены темы отправляет приложению уведомление
об изменении host context.

Сертификат dev-сервера должен быть доверен браузеру и Node.js. При необходимости
передайте CA через `NODE_EXTRA_CA_CERTS`. Кнопка перезапуска на стенде повторно
загружает iframe после изменений приложения.

Полную интеграцию проверяйте через [подключение MCP-сервера в ChatGPT](https://developers.openai.com/plugins/deploy/connect-chatgpt).

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
