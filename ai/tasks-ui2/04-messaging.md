# 04 — Сообщения между компаниями (P2P)

Источник: `ai/contexts/clarification-1.md` (п.4.1)

## Цель
Позволить зарегистрированным компаниям обмениваться сообщениями 1:1.

## Scope
- Список диалогов + окно переписки
- Инпут ввода, отправка текста, просмотр истории
- Нотификации через `toaster.create`

## UI
- Страница `src/pages/messages/messages.tsx`
- Список: `Table.Root` или простой список, адаптивная верстка
- Диалог: панель сообщений, автоскролл, индикаторы

## Data / API
- Эндпоинты: `GET /messages/threads`, `GET /messages/:threadId`, `POST /messages/:threadId`
- RTK Query + теги `['Messages']`
- Моки в `stubs/api/index.js`

## Acceptance Criteria
- Пользователь видит свои диалоги, открывает переписку и отправляет сообщение
- Новое сообщение появляется в списке без перезагрузки (через invalidate/polling)
- Все тексты локализованы

## i18n (минимум)
- messages.title
- messages.newMessage
- messages.placeholder

## Ссылки/файлы
- `src/pages/messages/messages.tsx`
- `src/__data__/api/client.ts`
- `src/__data__/api/*`
- `stubs/api/index.js`
- `locales/ru|en/common.json`
