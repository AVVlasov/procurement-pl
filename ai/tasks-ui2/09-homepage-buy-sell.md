# 09 — «Я покупаю / Я продаю» на главной странице

Источник: `ai/contexts/clarification-1.md` (п.6)

## Цель
Вывести краткие блоки "Я покупаю" и "Я продаю" на главную страницу, со ссылками в соответствующие разделы.

## Scope
- Блоки на `src/pages/dashboard/dashboard.tsx` (или `src/dashboard.tsx`)
- Ссылки/кнопки перехода, краткие статусы (наличие загрузок/акцептов, новые запросы)

## UI
- Компоненты: `Card`, `HStack/VStack`, `Button`, `Text`, иконки (lucide-react)
- Адаптивность, компактность, единый стиль

## Data / API
- Подтянуть агрегаты: количество документов, количество акцептов, число исходящих запросов
- Моки в `stubs/api/index.js`

## Acceptance Criteria
- На главной есть 2 карточки со статусами и кнопкой перехода
- Данные подгружаются, есть скелетоны на загрузке
- Все тексты локализованы

## i18n (минимум)
- home.buy.title
- home.sell.title
- home.view
- home.stats.docs
- home.stats.accepts
- home.stats.requests

## Ссылки/файлы
- `src/pages/dashboard/dashboard.tsx`
- `src/dashboard.tsx`
- `src/__data__/api/*`
- `stubs/api/index.js`
- `locales/ru|en/dashboard.json`
