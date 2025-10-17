# 03 — «Я покупаю»: документы и акцепты

Источник: `ai/contexts/clarification-1.md` (п.3)

## Цель
Обеспечить загрузку документов (.xlsx, .docx) в разделе «Я покупаю», просмотр другими компаниями и отметку «Акцептовано». Реестр акцептов хранить (без отдельного экрана), владелец видит кто акцептовал.

## Scope
- UI раздела «Я покупаю» (`src/pages/search/search.tsx` или отдельная страница `src/pages/requests/requests.tsx`)
- Загрузка файлов: ограничение типов (xlsx/docx), размер, список загруженных
- Действие «Акцептовано» для других компаний; индикатор для владельца

## UI
- Загрузка: `Field.Root` + `Input` с accept; список — `Table.Root`
- Кнопка «Акцептовано» — `Button` + toaster
- Dialog подтверждения

## Data / API
- Эндпоинты: `POST /buy/docs`, `GET /buy/docs`, `POST /buy/docs/:id/accept`
- Хранить акцепты: массив userId/companyId в документе
- Моки в `stubs/api/index.js`

## Acceptance Criteria
- Пользователь может загрузить .xlsx/.docx; другие — видеть и ставить «Акцептовано»
- Владелец видит список компаний, акцептовавших документ
- Все тексты локализованы

## i18n (минимум)
- buy.title
- buy.upload
- buy.accept
- buy.acceptedBy

## Ссылки/файлы
- `src/pages/requests/requests.tsx`
- `src/pages/search/search.tsx`
- `src/__data__/api/productsApi.ts` (или новый api-модуль)
- `stubs/api/index.js`
- `locales/ru|en/common.json`
