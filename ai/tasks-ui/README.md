# UI Development Tasks - B2B Platform

Документация по разработке пользовательского интерфейса B2B платформы для поиска партнеров.

## 📋 Обзор выполненных задач

### ✅ Этап 1: Базовая настройка проекта
**Файл:** [01-base-setup.md](./01-base-setup.md)

- Установка всех зависимостей (Redux Toolkit, i18next, Lottie, React Hook Form, Zod)
- Настройка Redux Store с RTK Query
- Конфигурация i18next для ru/en локализации
- Кастомизация Chakra UI темы с B2B палитрой
- Базовая маршрутизация в bro.config.js

**Ключевые файлы:**
- `src/__data__/store.ts` - Redux store
- `src/__data__/api/*.ts` - RTK Query APIs (auth, companies, products, search)
- `src/i18n.ts` - i18next config
- `locales/**/*.json` - Переводы (ru/en)
- `src/theme.tsx` - Chakra UI theme
- `src/app.tsx` - Root component

### ✅ Этап 2: Система аутентификации
**Файл:** [02-authentication.md](./02-authentication.md)

- Redux слой аутентификации с localStorage persistence
- RTK Query endpoints для auth (login, register, logout, refresh)
- Страница входа с валидацией
- Protected Route компонент для защиты страниц
- Автоматическое обновление токенов

**Ключевые файлы:**
- `src/__data__/slices/authSlice.ts` - Auth state
- `src/__data__/api/authApi.ts` - Auth API
- `src/pages/auth/login/login.tsx` - Login page
- `src/components/ProtectedRoute.tsx` - Route guard

### ✅ Этап 3: Многошаговая регистрация
**Файл:** [03-registration.md](./03-registration.md)

- Мастер-компонент с 4 шагами
- Progress bar с визуальной индикацией
- Валидация на каждом шаге
- Автозаполнение по ИНН через API ФНС
- Переиспользуемые form компоненты

**Ключевые файлы:**
- `src/pages/auth/register/register.tsx` - Master component
- `src/pages/auth/register/Step1CompanyInfo.tsx` - Шаг 1
- `src/pages/auth/register/Step2ContactPerson.tsx` - Шаг 2
- `src/pages/auth/register/Step3Needs.tsx` - Шаг 3
- `src/pages/auth/register/Step4Marketing.tsx` - Шаг 4
- `src/utils/validators/registrationSchema.ts` - Zod schemas
- `src/components/forms/*.tsx` - Form components

### ✅ Этап 4: Утилиты и константы
**Файл:** [04-utilities-hooks.md](./04-utilities-hooks.md)

- Константы приложения (отрасли, размеры, формы, цели)
- Форматтеры (телефон, ИНН, ОГРН, дата, валюта)
- Custom hooks (useAuth, useDebounce, useToast)

**Ключевые файлы:**
- `src/utils/constants.ts` - App constants
- `src/utils/formatters.ts` - Formatting utilities
- `src/hooks/useAuth.ts` - Auth hook
- `src/hooks/useDebounce.ts` - Debounce hook
- `src/hooks/useToast.ts` - Toast notifications hook

## 🔄 Статус реализации

| Этап | Статус | Прогресс |
|------|--------|----------|
| 1. Базовая настройка | ✅ Выполнено | 100% |
| 2. Аутентификация | ✅ Выполнено | 100% |
| 3. Регистрация | ✅ Выполнено | 100% |
| 4. Утилиты и hooks | ✅ Выполнено | 100% |
| 5. Dashboard | ⏳ Pending | 0% |
| 6. Профиль компании | ⏳ Pending | 0% |
| 7. Поиск партнеров | ⏳ Pending | 0% |
| 8. Финализация | ⏳ Pending | 0% |

## 📦 Установленные зависимости

### Core
- `@reduxjs/toolkit` - State management
- `react-redux` - React bindings
- `react-router-dom` - Routing (уже был)

### Forms & Validation
- `react-hook-form` - Form management
- `@hookform/resolvers` - Validation resolvers
- `zod` - Schema validation

### Internationalization
- `i18next` - i18n framework
- `react-i18next` - React integration
- `i18next-browser-languagedetector` - Language detection

### UI & Animations
- `@chakra-ui/react` - UI framework (уже был)
- `@emotion/react` - Styling (уже был)
- `lottie-react` - Animations

### Utilities
- `date-fns` - Date formatting
- `clsx` - Conditional classes
- `axios` - HTTP client

## 🏗️ Архитектура

### Структура папок
```
src/
├── __data__/                 # Redux & API layer
│   ├── api/                  # RTK Query endpoints
│   │   ├── authApi.ts
│   │   ├── companiesApi.ts
│   │   ├── productsApi.ts
│   │   └── searchApi.ts
│   ├── slices/               # Redux slices
│   │   └── authSlice.ts
│   └── store.ts              # Store configuration
│
├── components/               # React components
│   ├── forms/                # Form components
│   │   ├── FormInput.tsx
│   │   ├── FormSelect.tsx
│   │   ├── FormCheckbox.tsx
│   │   └── FormTextarea.tsx
│   └── ProtectedRoute.tsx    # Auth guard
│
├── pages/                    # Page components
│   ├── auth/
│   │   ├── login/
│   │   │   └── login.tsx
│   │   └── register/
│   │       ├── register.tsx
│   │       ├── Step1CompanyInfo.tsx
│   │       ├── Step2ContactPerson.tsx
│   │       ├── Step3Needs.tsx
│   │       └── Step4Marketing.tsx
│   └── main/
│
├── hooks/                    # Custom hooks
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   └── useToast.ts
│
├── utils/                    # Utilities
│   ├── constants.ts
│   ├── formatters.ts
│   └── validators/
│       └── registrationSchema.ts
│
├── i18n.ts                   # i18n config
├── theme.tsx                 # Chakra theme
└── app.tsx                   # Root component

locales/
├── ru/                       # Russian translations
│   ├── common.json
│   ├── auth.json
│   ├── dashboard.json
│   ├── company.json
│   └── search.json
└── en/                       # English translations
    └── ... (same structure)
```

### Data Flow

```
User Action
    ↓
React Component
    ↓
React Hook Form (validation)
    ↓
RTK Query Mutation/Query
    ↓
API Request
    ↓
Response
    ↓
Redux State Update
    ↓
Component Re-render
```

## 🎨 UI/UX Стандарты

### Цветовая схема
- **Primary (brand):** #2196f3 (синий)
- **Success:** #4caf50 (зеленый)
- **Warning:** #ff9800 (оранжевый)
- **Error:** #f44336 (красный)
- **Gray scale:** 50-900

### Компоненты
- Все компоненты используют Chakra UI
- Emotion для сложных стилей
- Responsive дизайн (sm/md/lg/xl/2xl)
- Theme tokens для консистентности

### Формы
- React Hook Form для управления
- Zod для валидации
- Inline ошибки под полями
- Loading states на кнопках
- i18n для всех текстов

## 🌐 Интернационализация

### Поддерживаемые языки
- 🇷🇺 Русский (default)
- 🇬🇧 English

### Namespaces
- `common` - Общие элементы
- `auth` - Аутентификация
- `dashboard` - Dashboard
- `company` - Профиль компании
- `search` - Поиск

### Использование
```typescript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('auth');
t('login.title') // "Вход в систему"
```

## 🔐 Безопасность

### Аутентификация
- JWT токены (access + refresh)
- Хранение в localStorage
- Автоматическое обновление при 401
- Protected routes для приватных страниц

### Валидация
- Client-side с Zod
- Server-side (pending backend)
- Regex паттерны для ИНН, ОГРН, телефона
- Email domain validation

## 📝 Соблюдение стандартов CLAUDE.md

✅ **TypeScript**
- Строгая типизация (strict: true)
- Явная типизация возвращаемых значений
- @types/ для глобальных типов
- Нет использования `any`

✅ **Redux + RTK Query**
- Папка __data__/ для данных
- API в src/__data__/api/
- Slices в src/__data__/slices/
- tagTypes для кэширования
- Типизированные endpoints

✅ **UI/Styling**
- Chakra UI как основа
- Emotion для сложных кейсов
- Theme-токены
- Responsive arrays

✅ **Интернационализация**
- locales/ для переводов
- i18next через hooks
- Все тексты - ключи перевода

✅ **Соглашения**
- Компоненты < 200 строк
- Pages соответствуют маршрутам
- Только необходимые assets

## 🚀 Следующие шаги

### Этап 5: Dashboard ⏳
- [ ] MainLayout с Header и Sidebar
- [ ] Dashboard page со статистикой
- [ ] StatCard компоненты
- [ ] AI Recommendations виджет

### Этап 6: Профиль компании ⏳
- [ ] CompanyProfile с вкладками
- [ ] AboutTab - О компании
- [ ] SpecializationTab - Специализация (Я продаю/покупаю)
- [ ] LegalTab - Реквизиты
- [ ] ReviewsTab - Отзывы

### Этап 7: Поиск ⏳
- [ ] Search page с layout
- [ ] SmartSearchBar с AI
- [ ] FiltersPanel
- [ ] ResultsGrid
- [ ] CompanyCard

### Этап 8: Финализация ⏳
- [ ] Lottie анимации
- [ ] Error boundaries
- [ ] Loading states
- [ ] Testing & QA

## 📚 Дополнительные ресурсы

- [Chakra UI Docs](https://chakra-ui.com/)
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [i18next Docs](https://www.i18next.com/)

## 👥 Команда

- Frontend Development: AI Assistant (Claude)
- Architecture: Based on CLAUDE.md specifications
- Tech Stack: React + TypeScript + Chakra UI + Redux Toolkit

