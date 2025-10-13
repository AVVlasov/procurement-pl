# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Web приложение B2B платформы для поиска партнеров, для продажи и закупки. Поиск лучший партнеров под заказ

## 🛠️ Tech Stack
- **TypeScript / React**
- **Redux Toolkit / RTK Query** — state и data слой
- **Emotion** — стилизация компонентов, кастомизация тем
- **@chakra-ui/react** — UI-фреймворк
- **Lottie** — анимация интерфейса
- **brojs/cli** — управление сборкой, dev-server, генерацией, тестами и scaffold-командами
- **REST API** — интеграция с backend, Express/NodeJS моки
- **i18next** — интернационализация (ru/en)
- **ESLint, Prettier, Stylelint** — автоматизация чистоты кода
- **Jenkins** — автоматизация тестирования и деплоя
- **Webpack** — сборка фронтенда

## 📂 Project Structure
@types/ # Глобальные типы
locales/ # Локализация (i18next: ru/en)
remote-assets/ # Внешние ресурсы (images, icons)
src/
├── data/ # Data слой: API, store, константы, RTK Query
│ ├── api/ # API-клиенты, endpoints
│ └── slices/ # Redux Toolkit slices
├── assets/ # Картинки, иконки, SVG для проекта
├── components/ # Кастомные UI-компоненты, аватары, модальные окна, формы
│ └── animations/ # Композиции с Lottie/Emotion
├── hooks/ # Custom React hooks
├── pages/ # Маршруты приложения, состояние страниц
├── utils/ # Вспомогательные функции
└── types/ # Локальные типы и интерфейсы
stubs/
├── api/ # Моки для backend/Express
└── mocks/ # Test data и json-файлы
app.tsx # Корневой компонент
index.tsx # Точка входа микрофронтенда
bro.config.js # Фронтовая конфигурация (роутинг, интеграция)
tsconfig.json # TS-конфиг
.eslintrc.js # Linting-правила
.prettierrc.json # Formatting-правила
Jenkinsfile / .github/ # CI/CD pipeline
README.md # Описание, инструкции
LICENSE # Лицензия


## 📝 Code Standards

### TypeScript
- Строгая типизация во всех слоях (tsconfig strict: true).
- Явная типизация возвращаемых значений.
- Классификация типов: @types/ для глобальных, src/types/ для модульных.
- Не использовать `any` без спец. причины и комментария.

### Redux + RTK Query
- Одна папка __data__/ для данных и Redux-слоев.
- API клиенты в `src/__data__/api/`, slices в `src/__data__/slices/`.
- Использовать tagTypes для кэширования, invalidate для мутаций.
- Все endpoints должны быть типизированы.

### UI/Styling
- Chakra UI как основной компонентный фреймворк.
- Emotion — только для сложных кейсов/анимаций.
- Предпочитать theme-токены и responsive-массивы Chakra.

### Интернационализация
- Локализация хранится в `locales/`
- Подключение через @brojs/i18nextconfig и хуки i18next
- Все тексты и кнопки должны быть ключами перевода

### Соглашения
- components: максимум 200 строк, тесты рядом (Component.tsx, Component.test.tsx)
- pages: соответствуют маршрутам bro.config.js
- assets: только то, что реально нужно в UI/production