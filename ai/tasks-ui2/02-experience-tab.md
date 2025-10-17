# 02 — Вкладка «Опыт работы»

Источник: `ai/contexts/clarification-1.md` (п.2)

## Цель
Добавить вкладку «Опыт работы» на главной; форма заполнения — на странице настроек компании. Просмотр доступен всем пользователям.

## Поля записи опыта
- подтверждено (boolean)
- заказчик (string)
- предмет закупки (string)
- примерный объем поставки (string/number)
- контакты лица (string)
- комментарий (string)

## Scope
- Форма добавления/редактирования записей в `src/pages/settings/settings.tsx`
- Публичная таблица опыта в профиле компании `src/pages/company/CompanyProfile.tsx` (+ вкладка `tabs/`)
- Компоненты таблицы на Chakra v3 (`Table.Root`, ячейки, пагинация)

## UI
- Использовать `Field.Root` для валидации
- Диалоги создания/редактирования — `Dialog.Root`
- Список — `Table.Root` с сортировкой/пагинацией

## Data / API
- Добавить эндпоинты RTK Query: `GET /companies/:id/experience`, `POST/PUT/DELETE`
- Тэгирование: `tagTypes: ['CompanyExperience']`, инвалидация после мутаций
- Моки: `stubs/api/index.js` хранит `companyExperience` по companyId

## Acceptance Criteria
- Компания может добавить/редактировать/удалить запись опыта
- Публичный просмотр списка опыта для всех аккаунтов
- Все тексты локализованы; валидация видима через `Field.ErrorText`

## i18n (минимум)
- company.experience.title
- company.experience.add
- company.experience.confirmed
- company.experience.customer
- company.experience.subject
- company.experience.volume
- company.experience.contact
- company.experience.comment

## Ссылки/файлы
- `src/pages/settings/settings.tsx`
- `src/pages/company/CompanyProfile.tsx`
- `src/pages/company/tabs/*`
- `src/__data__/api/companiesApi.ts`
- `stubs/api/index.js`
- `locales/ru|en/company.json`
