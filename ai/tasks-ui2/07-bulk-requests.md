# 07 — Массовые запросы (до 20) с вложениями

Источник: `ai/contexts/clarification-1.md` (п.4.4)

## Цель
Позволить пользователю отправлять один запрос (текст + файлы PDF/XLSX/DOCX) до 20 компаниям.

## Scope
- Форма составления запроса: текст, выбор получателей (мультиселект до 20), вложения
- Статус-центр отправки (успех/ошибка по адресатам)

## UI
- Страница `src/pages/requests/requests.tsx`
- Компоненты: `Field.Root`, `Textarea`, `NativeSelect`/кастомный мультиселект, `Button`
- Тосты по результатам

## Data / API
- Эндпоинт: `POST /requests/bulk` — payload: { text, recipientCompanyIds[], files[] }
- Возврат массивом результатов по каждому адресату
- Моки в `stubs/api/index.js`

## Acceptance Criteria
- Нельзя выбрать >20 адресатов
- Вложения ограничены по форматам и размеру
- После отправки виден результат по каждому адресату
- Все тексты локализованы

## i18n (минимум)
- requests.title
- requests.recipients
- requests.attachments
- requests.send
- requests.result

## Ссылки/файлы
- `src/pages/requests/requests.tsx`
- `src/__data__/api/companiesApi.ts` (для списка компаний)
- `stubs/api/index.js`
- `locales/ru|en/common.json`
