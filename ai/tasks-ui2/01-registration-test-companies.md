# 01 — Регистрация тест-компаний (15–20)

Источник: `ai/contexts/clarification-1.md` (п.1)

## Цель
Обеспечить регистрацию и наличие 15–20 компаний для тестирования (UI + моки данных/сидинг).

## Scope
- Форма регистрации (уже есть в `src/pages/auth/register/*`) — проверить ключевые поля и i18n
- Сидинг 15–20 компаний через `stubs/api/index.js` (временный мок) + фабрика данных
- Скрипт/хэндлер в мок-API для массового создания тест-компаний
- Документация по отключению сидинга на PROD

## UI
- Проверить валидаторы `src/utils/validators/registrationSchema.ts`
- I18n ключи — `locales/ru/auth.json`, `locales/en/auth.json`: добавить недостающие
- Toaster через `components/ui/toaster` (`toaster.create`)

## Data / API
- `src/__data__/api/authApi.ts`: убедиться в типизации эндпоинтов регистрации/логина
- Добавить мок-роут `POST /__seed/companies?count=20` в `stubs/api/index.js`
- Сгенерировать стабильные поля компании: id, name, inn, region, size, contacts

## Acceptance Criteria
- При запуске моков доступна ручка `POST /__seed/companies` c параметром `count` (1–50)
- После вызова — список компаний отражается в поиске/карточках (где применимо)
- Регистрация пользователя сохраняет данные в мок-хранилище
- Все тексты локализованы

## i18n (минимум)
- auth.registration.title
- auth.registration.success
- common.actions.seed

## Ссылки/файлы
- `src/pages/auth/register/*`
- `src/__data__/api/authApi.ts`
- `stubs/api/index.js`
- `locales/ru|en/auth.json`
