# 06 — Просмотр отзывов

Источник: `ai/contexts/clarification-1.md` (п.4.3)

## Цель
Дать возможность пользователям просматривать отзывы компаний.

## Scope
- Карточки отзывов с пагинацией и сортировкой (дата/рейтинг если есть)
- Отзыв: автор, текст, дата, рейтинг? (если модель данных позволяет)

## UI
- Вкладка профиля: `src/pages/company/tabs/ReviewsTab.tsx`
- Скелетоны в `src/components/skeletons/`
- Компоненты: `Card`, `VStack/HStack`, `Text`

## Data / API
- Эндпоинты: `GET /companies/:id/reviews` (пагинация, сортировка)
- RTK Query + тег `['CompanyReviews']`
- Моки в `stubs/api/index.js`

## Acceptance Criteria
- Пользователь видит список отзывов с пагинацией
- Сортировка работает
- Все тексты локализованы

## i18n (минимум)
- company.reviews.title
- company.reviews.sortBy
- company.reviews.empty

## Ссылки/файлы
- `src/pages/company/tabs/ReviewsTab.tsx`
- `src/__data__/api/companiesApi.ts`
- `stubs/api/index.js`
- `locales/ru|en/company.json`
