# MVP 2: Полноценная платформа (6-8 недель)

## Цель
Расширение функциональности с добавлением мессенджера, заявок на закупку, отзывов и документооборота.

## Технологический стек (расширенный)

### Добавлено к MVP 1:
- **WebSocket** (Socket.io) - реал-тайм коммуникация
- **RabbitMQ** - очереди сообщений
- **MinIO / S3** - хранение файлов
- **Elasticsearch** - полнотекстовый поиск
- **React Query** - управление серверным состоянием
- **Zustand** - легковесный state management

### Backend (расширенный):
- WebSocket сервер для чата
- Message queue для асинхронных задач
- File upload и processing
- Notifications system
- Advanced search с Elasticsearch

### AI Service (расширенный):
- Анализ документов (PDF parsing)
- Извлечение ключевых данных
- Сравнение предложений
- AI модератор чата

## Основная функциональность

### 1. Внутренний мессенджер
- Чат между компаниями
- Отправка файлов и документов
- История переписки
- Типизация (typing indicator)
- Онлайн статус
- Уведомления о новых сообщениях

### 2. Заявки на закупку
- Создание заявок (RFQ - Request for Quotation)
- Приглашение поставщиков
- Получение предложений
- Сравнение предложений
- AI анализ и рекомендации
- Выбор победителя

### 3. Отзывы и рейтинги
- Отзывы после сделок
- Рейтинг компаний (1-5 звезд)
- Модерация отзывов (AI + manual)
- Ответы на отзывы
- Статистика репутации

### 4. Загрузка документов
- PDF документы (прайс-листы, каталоги)
- AI анализ содержимого
- Извлечение продуктов и цен
- Поиск по документам
- Версионирование документов

### 5. Dashboard с метриками
- Аналитика активности
- График лидов
- Конверсия заявок
- Популярные категории
- ROI компании

### 6. Уведомления
- Email уведомления
- Push уведомления
- In-app уведомления
- Настройки уведомлений

## Что НЕ входит в MVP 2

- ❌ Видеозвонки (будет в MVP 3)
- ❌ Интеграция с CRM (будет в MVP 3)
- ❌ Мобильное приложение (будет в MVP 3)
- ❌ Marketplace функции (будет в MVP 3)
- ❌ Платежная интеграция (будет в MVP 3)

## Структура задач

```
mvp-2/
├── 01-infrastructure/
│   ├── 01-rabbitmq-setup.md
│   ├── 02-minio-storage.md
│   └── 03-elasticsearch-setup.md
│
├── 02-backend/
│   ├── 01-websocket-server.md
│   ├── 02-messenger-api.md
│   ├── 03-rfq-system.md
│   ├── 04-reviews-api.md
│   ├── 05-file-upload.md
│   └── 06-notifications.md
│
├── 03-ai-service/
│   ├── 01-pdf-parser.md
│   ├── 02-document-analysis.md
│   ├── 03-comparison-agent.md
│   └── 04-chat-moderator.md
│
└── 04-frontend/
    ├── 01-messenger-ui.md
    ├── 02-rfq-interface.md
    ├── 03-reviews-component.md
    ├── 04-document-upload.md
    ├── 05-dashboard.md
    └── 06-notifications-ui.md
```

## Временная оценка (6-8 недель)

### Неделя 1-2: Infrastructure + Messenger
- RabbitMQ, MinIO, Elasticsearch setup
- WebSocket server
- Базовый мессенджер

### Неделя 3-4: RFQ System
- Backend API для заявок
- Frontend интерфейс
- AI сравнение предложений

### Неделя 5-6: Reviews + Documents
- Система отзывов
- Загрузка и анализ документов
- Модерация

### Неделя 7-8: Dashboard + Notifications
- Аналитический dashboard
- Система уведомлений
- Полировка и тестирование

## Порядок выполнения задач

**Infrastructure:**
1. `01-infrastructure/01-rabbitmq-setup.md`
2. `01-infrastructure/02-minio-storage.md`
3. `01-infrastructure/03-elasticsearch-setup.md`

**Backend:**
4. `02-backend/01-websocket-server.md`
5. `02-backend/02-messenger-api.md`
6. `02-backend/03-rfq-system.md`
7. `02-backend/04-reviews-api.md`
8. `02-backend/05-file-upload.md`
9. `02-backend/06-notifications.md`

**AI Service:**
10. `03-ai-service/01-pdf-parser.md`
11. `03-ai-service/02-document-analysis.md`
12. `03-ai-service/03-comparison-agent.md`
13. `03-ai-service/04-chat-moderator.md`

**Frontend:**
14. `04-frontend/01-messenger-ui.md`
15. `04-frontend/02-rfq-interface.md`
16. `04-frontend/03-reviews-component.md`
17. `04-frontend/04-document-upload.md`
18. `04-frontend/05-dashboard.md`
19. `04-frontend/06-notifications-ui.md`

## Критерии готовности

- [ ] Мессенджер работает в реал-тайм
- [ ] RFQ система полностью функциональна
- [ ] Отзывы можно оставлять и просматривать
- [ ] Документы загружаются и анализируются
- [ ] Dashboard показывает метрики
- [ ] Уведомления работают по всем каналам
- [ ] WebSocket стабилен
- [ ] Файлы хранятся в MinIO
- [ ] Поиск работает через Elasticsearch

## Метрики успеха MVP 2

- Активные диалоги: >100 в день
- Созданные RFQ: >50 в неделю
- Средний рейтинг компаний: >4.0
- Загруженные документы: >500
- Конверсия RFQ в сделки: >15%

## Следующие шаги после MVP 2

После успешного MVP 2 переходим к MVP 3:
- Видеозвонки в мессенджере
- CRM интеграции
- Мобильное приложение
- Marketplace с онлайн-оплатой
- API для внешних интеграций
- Advanced analytics с ML

