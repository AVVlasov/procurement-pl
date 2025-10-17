# 05 — Поиск по отзывам и акцептам документации

Источник: `ai/contexts/clarification-1.md` (п.4.2)

## Цель
Дать возможность искать компании по отзывам и факту акцепта документации.

## Scope
- Фильтры: присутствие отзывов, средняя оценка (если есть), наличие акцептов по документам
- Интеграция с существующим поиском `src/__data__/api/searchApi.ts`

## UI
- `src/pages/search/search.tsx`: панель фильтров + результаты
- Компоненты: `Field.Root`, `NativeSelect`/`Checkbox`, `Table.Root`

## Data / API
- Расширить эндпоинт поиска query-параметрами: `hasReviews`, `minRating?`, `hasAcceptedDocs`
- RTK Query: кэш ключ учитывает новые фильтры
- Моки: расширение роута поиска в `stubs/api/index.js`

## Acceptance Criteria
- Фильтры применяются и виден эффект в результатах
- Пагинация/сортировка сохранены
- Все тексты локализованы

## i18n (минимум)
- search.filters.hasReviews
- search.filters.minRating
- search.filters.hasAcceptedDocs

## Ссылки/файлы
- `src/pages/search/search.tsx`
- `src/__data__/api/searchApi.ts`
- `stubs/api/index.js`
- `locales/ru|en/search.json`
