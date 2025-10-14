# Задача: Products & Services API

## Описание
API для управления продуктами/услугами, которые компания предлагает и ищет.

## Технические требования

### 1. Endpoints
```
GET    /api/companies/:id/products-offered
POST   /api/companies/:id/products-offered
PUT    /api/companies/:id/products-offered/:productId
DELETE /api/companies/:id/products-offered/:productId
POST   /api/companies/:id/products-offered/:productId/upload-pdf

GET    /api/companies/:id/products-needed
POST   /api/companies/:id/products-needed
PUT    /api/companies/:id/products-needed/:productId
DELETE /api/companies/:id/products-needed/:productId
```

### 2. Основные функции
- CRUD операции для продуктов/услуг
- Загрузка PDF коммерческих предложений
- Генерация embeddings для AI поиска
- Категоризация продуктов
- Активация/деактивация продуктов

## Критерии приёмки
- [ ] Все endpoints работают
- [ ] Файлы PDF загружаются
- [ ] Embeddings генерируются через AI service
- [ ] Валидация данных работает

## Зависимости
- Задача 03-company-api

## Приоритет
Высокий (P1)

## Оценка времени
6-8 часов

