<template>
  <QScrollArea
    class="absolute-full fit flex flex-center"
    :class="{
      'bg-white text-dark': !$q.dark.isActive,
      'bg-dark text-white': $q.dark.isActive,
    }"
  >
    <QScrollObserver
      :debounce="50"
      @scroll="onPromoScroll"
    />
    <QParallax
      class="promo-hero bg-accent"
      :height="$q.screen.gt.sm ? 540 : 640"
      :speed="0.45"
    >
      <template #media>
        <div class="promo-hero-media" />
      </template>

      <QCard
        flat
        class="transparent full-width"
        square
        style="padding-top: 120px"
        :style="{
          paddingLeft: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
          paddingRight: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
        }"
      >
        <h1
          class="text-white text-uppercase text-center text-weight-light no-margin no-padding"
          :style="{
            'font-size': !$q.screen.gt.sm ? '5vmax' : '3vmax',
            'line-height': 1,
          }"
        >
          Ваш "Секретарь"
        </h1>
        <h2
          class="text-white text-weight-medium"
          style="font-size: x-large; line-height: 1"
          :class="{
            'text-center no-padding': $q.screen.gt.sm,
            'text-left q-pa-md': !$q.screen.gt.sm,
          }"
        >
          Задачи, встречи и события — в одном календаре. Работает в Web App,
          Telegram и MCP-клиентах, включая Codex.
        </h2>

        <QCardActions align="center">
          <QBtn
            color="white"
            class="q-ma-lg"
            :style="{ paddingLeft: '24px', paddingRight: '24px' }"
            :class="{ 'full-width': !$q.screen.gt.sm }"
            glossy
            push
            fab
            @click="openConnectDialog"
          >
            <QIcon
              v-if="$q.screen.gt.sm"
              name="img:/icons/safari-pinned-tab.svg"
            />
            <span class="q-ml-xs text-accent text-weight-bolder">
              Подключиться
            </span>
          </QBtn>
        </QCardActions>

        <QSpace class="q-mb-xl" />

        <div class="flex justify-center row">
          <QCardSection class="flex justify-center q-pt-none col-12">
            <QBtn
              class="q-ma-xs"
              icon="play_arrow"
              color="grey-10"
              text-color="white"
              :href="GOOGLE_PLAY_URL"
            >
              Google Play
            </QBtn>
            <QBtn
              v-if="TELEGRAM_BOT_NAME"
              icon="telegram"
              class="q-ma-xs"
              color="light-blue-9"
              text-color="white"
              :href="`https://t.me/${TELEGRAM_BOT_NAME}?start=start`"
            >
              Telegram Bot
            </QBtn>
            <QBtn
              icon="terminal"
              class="q-ma-xs"
              color="deep-orange-10"
              text-color="white"
              @click="openCodexApp"
            >
              Codex App
            </QBtn>
            <QBtn
              icon="install_desktop"
              class="q-ma-xs"
              color="deep-purple-8"
              text-color="white"
              @click="registerPage"
            >
              PWA
            </QBtn>
          </QCardSection>
        </div>
      </QCard>
    </QParallax>

    <h2
      :class="{
        'text-center q-ma-md': $q.screen.gt.sm,
        'q-pl-md q-pr-md': !$q.screen.gt.sm,
      }"
    >
      От сообщения до события
    </h2>
    <div class="flex justify-center full-width q-mb-xl">
      <QCard
        flat
        class="q-ma-xs full-width"
        :style="{
          paddingLeft: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
          paddingRight: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
        }"
      >
        <QCardSection>
          <div class="text-subtitle1 text-weight-bold">
            Планируйте встречи сообщества прямо в Telegram.
          </div>
          <div class="q-mt-sm">
            <b>Принцип работы:</b>
            <ul>
              <li>Добавьте бота в сообщество</li>
              <li>Администратор создаёт событие через Telegram Mini App</li>
              <li>
                Участники отвечают «Иду» — событие появляется в их календаре
              </li>
            </ul>
          </div>
        </QCardSection>
      </QCard>
    </div>

    <h2
      :class="{
        'text-center q-ma-md': $q.screen.gt.sm,
        'q-pl-md q-pr-md': !$q.screen.gt.sm,
      }"
    >
      Один календарь — несколько способов работы
    </h2>

    <div class="flex justify-center full-width">
      <QCard
        flat
        class="q-ma-xs full-width"
        :style="{
          paddingLeft: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
          paddingRight: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
        }"
      >
        <QCardSection>
          <div class="text-subtitle1">
            Создавайте и редактируйте события там, где удобно.
          </div>
        </QCardSection>
        <QList>
          <QItem>
            <QItemSection avatar>
              <QIcon
                :color="promoAccentColor"
                name="psychology"
              />
            </QItemSection>
            <QItemSection>
              <QItemLabel>Обычный язык</QItemLabel>
              <QItemLabel caption>
                Пишите или отправляйте голосовые сообщения Telegram-боту
              </QItemLabel>
            </QItemSection>
          </QItem>
          <QItem>
            <QItemSection avatar>
              <QIcon
                :color="promoAccentColor"
                name="sort"
              />
            </QItemSection>
            <QItemSection>
              <QItemLabel>Категории и приоритеты</QItemLabel>
              <QItemLabel caption>
                Разделяйте рабочие и личные дела, задавайте важность
              </QItemLabel>
            </QItemSection>
          </QItem>
          <QItem>
            <QItemSection avatar>
              <QIcon
                :color="promoAccentColor"
                name="calendar_today"
              />
            </QItemSection>
            <QItemSection>
              <QItemLabel>Календарь в интерфейсе</QItemLabel>
              <QItemLabel caption>
                Web App и MCP App показывают события по времени
              </QItemLabel>
            </QItemSection>
          </QItem>
          <QItem>
            <QItemSection avatar>
              <QIcon
                :color="promoAccentColor"
                name="sync"
              />
            </QItemSection>
            <QItemSection>
              <QItemLabel>Экспорт и подписка</QItemLabel>
              <QItemLabel caption>
                Открывайте события в Google Calendar или подключайте iCalendar
              </QItemLabel>
            </QItemSection>
          </QItem>
        </QList>
      </QCard>
    </div>

    <h2
      :class="{
        'text-center q-ma-md': $q.screen.gt.sm,
        'q-pl-md q-pr-md': !$q.screen.gt.sm,
      }"
    >
      Почему это удобно
    </h2>
    <div
      class="flex justify-center"
      :class="{ row: $q.screen.gt.sm }"
    >
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="text-h6">План на виду</div>
          <div class="text-subtitle2">
            Задачи, встречи и события собраны в одном календаре.
          </div>
        </QCardSection>
      </QCard>
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="text-h6">Контроль перед созданием</div>
          <div class="text-subtitle2">
            В Codex Секретарь проверяет занятость и показывает редактируемую
            форму.
          </div>
        </QCardSection>
      </QCard>
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="text-h6">Встречи в Telegram</div>
          <div class="text-subtitle2">
            Администраторы создают события, участники отвечают «Иду» или «Не
            иду».
          </div>
        </QCardSection>
      </QCard>
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="text-h6">Свои данные</div>
          <div class="text-subtitle2">
            Храните события на устройстве или подключите Solid Pod.
          </div>
        </QCardSection>
      </QCard>
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="text-h6">Открытый формат</div>
          <div class="text-subtitle2">
            Экспортируйте календарь в iCalendar для совместимых приложений.
          </div>
        </QCardSection>
      </QCard>
    </div>

    <h2
      :class="{
        'text-center q-ma-md': $q.screen.gt.sm,
        'q-pl-md q-pr-md': !$q.screen.gt.sm,
      }"
    >
      Не теряйте мысль
    </h2>
    <div
      class="flex justify-center"
      :class="{ row: $q.screen.gt.sm }"
    >
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <QIcon
              name="mic"
              :color="promoAccentColor"
              size="sm"
            />
            <div class="text-h6">Голос в Telegram</div>
          </div>
          <div class="text-subtitle2">
            Надиктуйте задачу боту, когда неудобно печатать.
          </div>
        </QCardSection>
        <QCardSection class="q-pt-none">
          <QCard
            flat
            class="bg-grey-2 text-dark rounded-borders q-pa-sm"
          >
            <QIcon
              name="mic"
              size="xs"
              class="q-mr-xs"
            />
            <em>«Напомни про химчистку в 19:00»</em>
          </QCard>
        </QCardSection>
      </QCard>

      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <QIcon
              name="notifications_off"
              :color="promoAccentColor"
              size="sm"
            />
            <div class="text-h6">Меньше отвлечений</div>
          </div>
          <div class="text-subtitle2">
            Зафиксируйте дело одним сообщением и вернитесь к работе.
          </div>
        </QCardSection>
        <QCardSection class="q-pt-none">
          <QCard
            flat
            class="bg-grey-2 text-dark rounded-borders q-pa-sm"
          >
            <QIcon
              name="mic"
              size="xs"
              class="q-mr-xs"
            />
            <em>«Напомни вечером найти книгу "…"»</em>
          </QCard>
        </QCardSection>
      </QCard>

      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <QIcon
              name="place"
              :color="promoAccentColor"
              size="sm"
            />
            <div class="text-h6">Место выполнения</div>
          </div>
          <div class="text-subtitle2">
            Добавьте адрес — он сохранится вместе с задачей.
          </div>
        </QCardSection>
        <QCardSection class="q-pt-none">
          <QCard
            flat
            class="bg-grey-2 text-dark rounded-borders q-pa-sm q-mb-xs"
          >
            <QIcon
              name="place"
              size="xs"
              class="q-mr-xs"
            />
            <em>«Забрать заказ в пункте выдачи на Тверской»</em>
          </QCard>
        </QCardSection>
      </QCard>
    </div>

    <h2
      :class="{
        'text-center q-ma-md': $q.screen.gt.sm,
        'q-pl-md q-pr-md': !$q.screen.gt.sm,
      }"
    >
      Сравнение с другими сервисами
    </h2>

    <div
      v-if="$q.screen.gt.sm"
      class="flex justify-center full-width q-mb-lg"
      :style="{
        paddingLeft: 'calc(50vw / 4)',
        paddingRight: 'calc(50vw / 4)',
      }"
    >
      <QMarkupTable
        flat
        bordered
        wrap-cells
        :dark="$q.dark.isActive"
        class="full-width"
      >
        <thead>
          <tr>
            <th class="text-left">Возможности</th>
            <th class="text-center">Секретарь</th>
            <th class="text-center">Todoist</th>
            <th class="text-center">TickTick</th>
            <th class="text-center">Apple Reminders</th>
            <th class="text-center">Алиса</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Создание обычным языком</td>
            <td class="text-center">✅ Текст и голос в Telegram</td>
            <td class="text-center">✅ Текст</td>
            <td class="text-center">✅ Текст и голос</td>
            <td class="text-center">✅ Текст и Siri</td>
            <td class="text-center">✅ Голос</td>
          </tr>
          <tr>
            <td>Категории</td>
            <td class="text-center">✅ 4 категории</td>
            <td class="text-center">✅ Проекты и метки</td>
            <td class="text-center">✅ Списки и теги</td>
            <td class="text-center">✅ Списки и теги</td>
            <td class="text-center">—</td>
          </tr>
          <tr>
            <td>Приоритеты</td>
            <td class="text-center">✅ 3 уровня</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">—</td>
          </tr>
          <tr>
            <td>Календарь</td>
            <td class="text-center">✅ Встроен в Web и MCP App</td>
            <td class="text-center">⚠️ Вид — Pro/Business</td>
            <td class="text-center">✅</td>
            <td class="text-center">⚠️ Экосистема Apple</td>
            <td class="text-center">⚠️ Напоминания</td>
          </tr>
          <tr>
            <td>Интерфейсы</td>
            <td class="text-center">✅ Web, Telegram, MCP</td>
            <td class="text-center">✅</td>
            <td class="text-center">✅</td>
            <td class="text-center">⚠️ Apple</td>
            <td class="text-center">⚠️ Яндекс</td>
          </tr>
          <tr>
            <td>События для Telegram-групп</td>
            <td class="text-center">✅ Создание и ответы участников</td>
            <td class="text-center">—</td>
            <td class="text-center">—</td>
            <td class="text-center">—</td>
            <td class="text-center">—</td>
          </tr>
        </tbody>
      </QMarkupTable>
    </div>

    <!-- Mobile: collapse по конкурентам -->
    <QList
      v-else
      bordered
      separator
      class="q-ma-sm rounded-borders"
    >
      <QExpansionItem
        icon="task_alt"
        label="Секретарь"
        default-opened
      >
        <QCard flat>
          <QList dense>
            <QItem>
              <QItemSection>✅ Текст и голос в Telegram</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ 4 категории и 3 приоритета</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ Встроенный календарь</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ Web App, Telegram и MCP</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ Групповые события и ответы</QItemSection>
            </QItem>
          </QList>
        </QCard>
      </QExpansionItem>
      <QExpansionItem
        icon="check_box_outline_blank"
        label="Todoist"
      >
        <QCard flat>
          <QList dense>
            <QItem>
              <QItemSection>✅ Обычный язык</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ Проекты, метки и приоритеты</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>⚠️ Календарь — Pro/Business</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ Web, desktop и mobile</QItemSection>
            </QItem>
          </QList>
        </QCard>
      </QExpansionItem>
      <QExpansionItem
        icon="check_box_outline_blank"
        label="TickTick"
      >
        <QCard flat>
          <QList dense>
            <QItem>
              <QItemSection>✅ Текст и голос</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ Списки, теги и приоритеты</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ Календарь и интеграции</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>✅ Web, desktop и mobile</QItemSection>
            </QItem>
          </QList>
        </QCard>
      </QExpansionItem>
      <QExpansionItem
        icon="check_box_outline_blank"
        label="Apple Reminders"
      >
        <QCard flat>
          <QList dense>
            <QItem><QItemSection>✅ Текст и Siri</QItemSection></QItem>
            <QItem>
              <QItemSection>✅ Списки, теги и приоритеты</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>⚠️ Календарь в экосистеме Apple</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>⚠️ Устройства Apple</QItemSection>
            </QItem>
          </QList>
        </QCard>
      </QExpansionItem>
      <QExpansionItem
        icon="check_box_outline_blank"
        label="Алиса"
      >
        <QCard flat>
          <QList dense>
            <QItem>
              <QItemSection>✅ Голосовые напоминания</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>⚠️ Без отдельного календаря задач</QItemSection>
            </QItem>
            <QItem>
              <QItemSection>⚠️ Сервисы Яндекса</QItemSection>
            </QItem>
          </QList>
        </QCard>
      </QExpansionItem>
    </QList>

    <div
      class="text-caption text-center q-mx-md q-mb-lg"
      :class="$q.dark.isActive ? 'text-grey-4' : 'text-grey-7'"
    >
      Сравниваются встроенные функции. «—» — функция не заявлена как встроенная.
    </div>

    <h2
      :class="{
        'text-center q-ma-md': $q.screen.gt.sm,
        'q-pl-md q-pr-md': !$q.screen.gt.sm,
      }"
    >
      Открытые стандарты и децентрализация
    </h2>

    <div
      class="flex justify-center"
      :class="{ row: $q.screen.gt.sm }"
    >
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="row items-center no-wrap q-gutter-sm q-mb-sm">
            <QIcon
              name="calendar_month"
              :color="promoAccentColor"
              size="sm"
            />
            <div class="text-h6">Календари</div>
          </div>
          <div class="text-subtitle2 text-weight-bold"> iCalendar </div>
          <div class="text-subtitle2">
            Экспорт и подписка для совместимых календарных приложений.
          </div>
        </QCardSection>
      </QCard>
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="row items-center q-gutter-sm q-mb-sm">
            <QIcon
              name="schema"
              :color="promoAccentColor"
              size="sm"
            />
            <div class="text-h6">Связанные данные</div>
          </div>
          <div class="text-subtitle2 text-weight-bold"> JSON-LD </div>
          <div class="text-subtitle2">
            События сохраняются в формате для серверной базы знаний.
          </div>
        </QCardSection>
      </QCard>
      <QCard
        class="q-ma-md col-3"
        :bordered="$q.screen.gt.sm"
        flat
      >
        <QCardSection>
          <div class="row items-center no-wrap q-gutter-sm q-mb-sm">
            <QIcon
              name="hub"
              :color="promoAccentColor"
              size="sm"
            />
            <div class="text-h6">Децентрализованный социальный веб</div>
          </div>
          <div class="text-subtitle2 text-weight-bold"> ActivityPub </div>
          <div class="text-subtitle2">
            Сервер принимает и публикует события через Inbox и Outbox.
          </div>
        </QCardSection>
      </QCard>
    </div>

    <QBanner
      class="q-ma-md bg-accent text-white rounded-borders"
      :style="{
        marginLeft: $q.screen.gt.sm ? 'calc(50vw / 4)' : null,
        marginRight: $q.screen.gt.sm ? 'calc(50vw / 4)' : null,
      }"
      rounded
    >
      <template #avatar>
        <QIcon
          name="swap_horiz"
          color="white"
        />
      </template>
      Открытые протоколы упрощают обмен событиями между совместимыми сервисами.
    </QBanner>

    <QList
      :padding="$q.screen.gt.sm"
      class="q-mb-md"
      :style="{
        marginLeft: $q.screen.gt.sm ? 'calc(50vw / 4)' : null,
        marginRight: $q.screen.gt.sm ? 'calc(50vw / 4)' : null,
      }"
    >
      <QItem>
        <QItemSection avatar>
          <QIcon
            :color="promoAccentColor"
            name="electrical_services"
          />
        </QItemSection>
        <QItemSection>
          <QItemLabel>Совместимые MCP-клиенты, включая Codex</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem>
        <QItemSection avatar>
          <QIcon
            :color="promoAccentColor"
            name="hub"
          />
        </QItemSection>
        <QItemSection>
          <QItemLabel>ActivityPub Inbox и Outbox</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem>
        <QItemSection avatar>
          <QIcon
            :color="promoAccentColor"
            name="event"
          />
        </QItemSection>
        <QItemSection>
          <QItemLabel>Экспорт и подписка iCalendar</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem>
        <QItemSection avatar>
          <QIcon
            :color="promoAccentColor"
            name="verified"
          />
        </QItemSection>
        <QItemSection>
          <QItemLabel>Verifiable Credentials для федерации</QItemLabel>
        </QItemSection>
      </QItem>
      <QItem>
        <QItemSection avatar>
          <QIcon
            :color="promoAccentColor"
            name="cloud"
          />
        </QItemSection>
        <QItemSection>
          <QItemLabel>Подключение собственного Solid Pod</QItemLabel>
        </QItemSection>
      </QItem>
    </QList>

    <QBanner
      class="q-ma-md rounded-borders"
      :class="{
        'bg-grey-2 text-dark': !$q.dark.isActive,
        'bg-grey-9 text-white': $q.dark.isActive,
      }"
      :style="{
        marginLeft: $q.screen.gt.sm ? 'calc(50vw / 4)' : null,
        marginRight: $q.screen.gt.sm ? 'calc(50vw / 4)' : null,
      }"
      rounded
    >
      <template #avatar>
        <QIcon
          name="lock"
          :color="promoAccentColor"
        />
      </template>
      <div class="text-subtitle1 text-weight-bold q-mb-xs">
        Нужна корпоративная безопасность?
      </div>
      <div class="text-subtitle2">
        Self-hosted в Alpha: setup-файл за 20 000 ₽. Сервер, ключ и расходы ИИ —
        на стороне клиента.
      </div>
      <template #action>
        <QBtn
          flat
          :color="promoAccentColor"
          label="Связаться"
          href="mailto:v-secretary@mail.ru?subject=SELF%20Hosted"
        />
      </template>
    </QBanner>

    <QSpace class="q-mt-xl" />

    <h2
      :class="{
        'text-center q-ma-md': $q.screen.gt.sm,
        'q-pl-md q-pr-md': !$q.screen.gt.sm,
      }"
    >
      Цены
    </h2>
    <QCard flat>
      <!--  AND location !== RU-->
      <PricingComponent
        class="fit"
        :class="{
          'row q-pa-md q-gutter-md': $q.screen.gt.sm,
          'q-gutter-xs': !$q.screen.gt.sm,
        }"
      />
    </QCard>

    <QTimeline class="q-mt-md q-mb-md q-pl-md q-pr-md">
      <h2
        :class="{
          'text-center': $q.screen.gt.sm,
          'q-pl-md q-pr-md': !$q.screen.gt.sm,
        }"
      >
        Как это работает в Codex
      </h2>
      <h3 class="text-subtitle1 text-center">
        Четыре шага до события в календаре
      </h3>
      <div
        :style="{
          marginLeft: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
          marginRight: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
        }"
      >
        <QTimelineEntry
          title="Подключите Секретаря"
          subtitle="Шаг 1"
          :color="promoAccentColor"
          icon="electrical_services"
          class="text-left"
        >
          <div>Добавьте MCP endpoint в Codex.</div>
        </QTimelineEntry>
        <QTimelineEntry
          title="Сформулируйте запрос"
          subtitle="Шаг 2"
          :color="promoAccentColor"
          icon="chat"
          class="text-left"
        >
          <div>Опишите задачу или встречу обычным языком.</div>
        </QTimelineEntry>
        <QTimelineEntry
          title="Проверьте форму"
          subtitle="Шаг 3"
          :color="promoAccentColor"
          icon="fact_check"
          class="text-left"
        >
          <div>Секретарь проверит занятость и покажет форму.</div>
        </QTimelineEntry>
        <QTimelineEntry
          title="Подтвердите создание"
          subtitle="Шаг 4"
          color="green-8"
          icon="event_available"
          class="text-left"
        >
          <div>Подтвердите — событие появится в календаре.</div>
        </QTimelineEntry>
      </div>
    </QTimeline>

    <h3
      :class="{
        'text-center': $q.screen.gt.sm,
        'q-pl-md q-pr-md': !$q.screen.gt.sm,
      }"
    >
      Часто задаваемые вопросы
    </h3>
    <QList
      :padding="$q.screen.gt.sm"
      class="q-mb-xl rounded-borders text-left"
      :style="{
        marginLeft: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
        marginRight: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
      }"
    >
      <QExpansionItem
        expand-separator
        label="Как вы обеспечиваете безопасность данных?"
        caption="Локальное и внешнее хранение"
      >
        <QCard>
          <QCardSection class="text-left">
            Данные хранятся на устройстве или в подключённом Solid Pod. Для
            Telegram и синхронизации часть данных обрабатывает сервер.
          </QCardSection>
        </QCard>
      </QExpansionItem>
      <QExpansionItem
        expand-separator
        label="В каком формате можно экспортировать события?"
        caption="iCalendar"
      >
        <QCard>
          <QCardSection class="text-left">
            В iCalendar — для добавления в совместимые приложения.
          </QCardSection>
        </QCard>
      </QExpansionItem>
      <QExpansionItem
        expand-separator
        label="Интеграции с другими сервисами?"
        caption="Google Calendar"
      >
        <QCard>
          <QCardSection class="text-left">
            Да. Событие можно открыть в Google Calendar или экспортировать в
            iCalendar.
          </QCardSection>
        </QCard>
      </QExpansionItem>
      <QExpansionItem
        expand-separator
        label="Можно ли развернуть Секретаря на своём сервере?"
        caption="Self-hosted"
      >
        <QCard>
          <QCardSection class="text-left">
            Да, версия Alpha. Setup-файл стоит 20 000 ₽; сервер, ключ и расходы
            ИИ оплачивает клиент.
          </QCardSection>
        </QCard>
      </QExpansionItem>
      <QExpansionItem
        expand-separator
        label="Для чего нужен ActivityPub?"
        caption="Федерация"
      >
        <QCard>
          <QCardSection class="text-left">
            Секретарь принимает и публикует события через ActivityPub Inbox и
            Outbox. Обмен работает с совместимыми сервисами.
          </QCardSection>
        </QCard>
      </QExpansionItem>
    </QList>
    <QList
      :padding="$q.screen.gt.sm"
      class="bg-grey-9 text-white"
      :style="{
        paddingLeft: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
        paddingRight: $q.screen.gt.sm ? 'calc(50vw / 2)' : null,
      }"
      dark
    >
      <QItem
        v-ripple
        clickable
        dense
        @click="supportPage"
      >
        <QCardSection>
          <QItemLabel
            lines="1"
            class="text-left"
          >
            Поддержка
          </QItemLabel>
          <QItemLabel caption>Обратиться в центр поддержки</QItemLabel>
        </QCardSection>
      </QItem>
      <QItem
        v-ripple
        clickable
        dense
        @click="privacyPage"
      >
        <QCardSection>
          <QItemLabel
            lines="1"
            class="text-left"
          >
            Политика обработки персональных данных
          </QItemLabel>
        </QCardSection>
      </QItem>
      <QSeparator
        spaced
        dark
      />
      <QItemLabel
        header
        class="text-center"
      >
        ООО "Виртуальный секретарь"
      </QItemLabel>
      <QItemLabel
        caption
        class="text-center text-uppercase"
      >
        ИНН 2632123201
      </QItemLabel>
    </QList>
  </QScrollArea>
</template>
<script lang="ts" setup>
import {
  useMeta,
  useQuasar,
  QIcon,
  QBtn,
  QScrollArea,
  QCardSection,
  QSeparator,
  QCard,
  QCardActions,
  QSpace,
  QItem,
  QItemSection,
  QItemLabel,
  QTimeline,
  QTimelineEntry,
  QExpansionItem,
  QList,
  QMarkupTable,
  QBanner,
  QParallax,
  QScrollObserver,
} from 'quasar'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import useLangStore from '@/shared/model/lang'
import PricingComponent from './PricingComponent.vue'
import { ROUTE_NAMES } from '@/shared/config/routes'
import { GOOGLE_PLAY_URL } from '@/shared/lib/googlePlayHelper'
import { CODEX_APP_URL } from '@/shared/lib/codexHelper'
import { TELEGRAM_BOT_NAME } from '@/shared/lib/telegram'
import { open } from '@/shared/lib/urlHelper'
import pkg from '../../../../package.json'

const router = useRouter()
const i18n = useI18n()
const langStore = useLangStore()
const $t = i18n.t
const $q = useQuasar()
const promoAccentColor = computed(() =>
  $q.dark.isActive ? 'purple-3' : 'accent',
)
const emit = defineEmits<{
  headerConnectVisibility: [visible: boolean]
  connectRequest: []
}>()

const metaData = {
  'title': $t('pages.welcome.title'),
  'og:title': $t('pages.welcome.title'),
}

function registerPage() {
  return router.push({
    name: ROUTE_NAMES.LOGIN,
    query: { lang: langStore.language },
  })
}

function openConnectDialog() {
  emit('connectRequest')
}

function openCodexApp() {
  open(CODEX_APP_URL)
}

function supportPage() {
  const [{ email }] = pkg.contributors
  open(`mailto:${email}?subject=SUPPORT`)
}

function privacyPage() {
  return router.push({ name: ROUTE_NAMES.PRIVACY })
}

function onPromoScroll({ position }: { position: { top: number } }) {
  const secondScreenOffset = $q.screen.gt.sm ? 540 : 640
  emit('headerConnectVisibility', position.top >= secondScreenOffset)
}

useMeta(metaData)
</script>
<style scoped>
.promo-hero :deep(.q-parallax__content) {
  align-items: stretch;
  justify-content: flex-start;
}

.promo-hero-media {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 100%;
  height: 145%;
  background:
    radial-gradient(circle at 20% 25%, rgb(255 255 255 / 18%), transparent 38%),
    radial-gradient(circle at 80% 70%, rgb(255 255 255 / 12%), transparent 35%),
    var(--q-accent);
  will-change: transform;
}

.promo-hero-media::after {
  position: absolute;
  inset: 10% 20%;
  background: url('/icons/safari-pinned-tab.svg') center / contain no-repeat;
  content: '';
  filter: invert(1);
  opacity: 0.08;
}

@media (prefers-reduced-motion: reduce) {
  .promo-hero-media {
    transform: translate3d(-50%, 0, 0) !important;
  }
}
</style>
