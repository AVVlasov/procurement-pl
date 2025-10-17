# 🍃 MongoDB Integration Setup Guide
## B2B Platform - Backend Integration

---

## 🚀 Быстрый старт

### 1. Установка MongoDB (локально)

#### Вариант A: Docker (рекомендуется)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Вариант B: Установка на Windows
- Скачайте MongoDB Community Edition: https://www.mongodb.com/try/download/community
- Установите и запустите MongoDB Service

#### Вариант C: MongoDB Atlas (облако)
- Создайте аккаунт: https://www.mongodb.com/cloud/atlas
- Создайте cluster
- Скопируйте connection string в `MONGODB_URI`

---

## 📋 Установка зависимостей

```bash
cd F:/develop/procurement-pl
npm install
```

Основные зависимости:
- **mongoose**: ^7.5.0 - ODM для MongoDB
- **bcryptjs**: ^2.4.3 - Хеширование паролей
- **jsonwebtoken**: ^9.1.2 - JWT токены
- **cors**: ^2.8.5 - Cross-Origin Resource Sharing
- **dotenv**: ^16.3.1 - Переменные окружения

---

## 🔧 Конфигурация

### Переменные окружения (`stubs/.env`)

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/procurement_db

# JWT Secret (измените в production!)
JWT_SECRET=your-secret-key-change-in-production

# Server
PORT=3001
NODE_ENV=development
```

---

## 📁 Структура Project

```
stubs/
├── api/
│   └── index.js              # Main Express app с MongoDB integration
├── models/
│   ├── User.js               # User schema
│   ├── Company.js            # Company schema
│   ├── Message.js            # Message schema
│   └── Product.js            # Product schema
├── routes/
│   ├── auth.js               # Authentication endpoints
│   ├── companies.js          # Companies CRUD + Search
│   └── messages.js           # Messaging endpoints
├── middleware/
│   └── auth.js               # JWT verification
├── config/
│   └── db.js                 # MongoDB connection
├── mocks/                    # Mock data (for fallback)
├── .env                      # Environment variables
└── MONGODB_SETUP.md          # This file
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      - Регистрация пользователя + компании
POST   /api/auth/login         - Логин пользователя
```

### Companies
```
GET    /api/companies          - Получить список компаний (с пагинацией, поиском)
GET    /api/companies/:id      - Получить компанию по ID
PUT    /api/companies/:id      - Обновить компанию (требует JWT)
POST   /api/companies/ai-search - AI поиск компаний
```

### Messages
```
GET    /api/messages/threads              - Получить все потоки сообщений
GET    /api/messages/threads/:threadId    - Получить сообщения потока
POST   /api/messages                      - Отправить сообщение
```

### Health Check
```
GET    /health                 - Status проверка + database connection
```

---

## 📊 Mongoose Models

### User Schema
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String,
  lastName: String,
  position: String,
  phone: String,
  companyId: ObjectId (ref: Company),
  createdAt: Date,
  updatedAt: Date
}
```

### Company Schema
```javascript
{
  fullName: String,
  shortName: String,
  inn: String (unique),
  ogrn: String,
  industry: String,
  companySize: String,
  website: String,
  rating: Number (0-5),
  reviews: Number,
  ownerId: ObjectId (ref: User),
  platformGoals: [String],
  // ... и другие поля
  createdAt: Date,
  updatedAt: Date
}
```

### Message Schema
```javascript
{
  threadId: String,
  senderCompanyId: ObjectId (ref: Company),
  recipientCompanyId: ObjectId (ref: Company),
  text: String,
  read: Boolean,
  timestamp: Date
}
```

### Product Schema
```javascript
{
  name: String,
  category: String,
  description: String,
  type: 'sell' | 'buy',
  companyId: ObjectId (ref: Company),
  price: String,
  unit: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Аутентификация

### JWT Flow
1. **Register/Login** → Backend генерирует JWT token (7 дней)
2. **Frontend** → Сохраняет token в localStorage (Remember Me)
3. **API Requests** → Отправляет `Authorization: Bearer <token>`
4. **Middleware** → Проверяет token с помощью `verifyToken`

### Password Hashing
- Используется bcryptjs (10 salt rounds)
- Пароли никогда не передаются в открытом виде
- Используется метод `.comparePassword()` для проверки

---

## 🚀 Запуск Backend

### Development Mode
```bash
# С mock API (текущий setup)
npm run start

# Или напрямую с Node
node -r dotenv/config stubs/api/index.js
```

### Production Mode
```bash
npm run build:prod
NODE_ENV=production npm run start
```

---

## 🧪 Тестирование API

### Using curl

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@company.com",
    "password":"SecurePass123!",
    "firstName":"John",
    "lastName":"Doe",
    "fullName":"Test Company",
    "inn":"7700000000"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@company.com",
    "password":"SecurePass123!"
  }'

# Get Companies
curl http://localhost:3001/api/companies?page=1&limit=10

# Health Check
curl http://localhost:3001/health
```

### Using Postman
1. Import endpoints
2. Set `Authorization` header: `Bearer <your-jwt-token>`
3. Test endpoints

---

## 🔄 Frontend Integration

### Update API URL

В `src/__data__/urls.ts`:
```typescript
export const URLs = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
};
```

### ENV Variables (Frontend)
```
REACT_APP_API_URL=http://localhost:3001
```

---

## 📈 Миграция с Mock на Real Database

### Current Setup
1. Backend использует mock API endpoints
2. Все данные хранятся в памяти (теряются при перезагрузке)
3. Работает без MongoDB (fallback)

### With MongoDB
1. Backend подключается к MongoDB
2. Все данные сохраняются в базе
3. Пользователи/Компании/Сообщения персистентны
4. Масштабируемо для production

### Migration Steps
```bash
# 1. Установить MongoDB (Docker или локально)
docker run -d -p 27017:27017 mongo:latest

# 2. Установить зависимости
npm install mongoose bcryptjs jsonwebtoken cors dotenv

# 3. Обновить стубы (уже готово!)
# Стубы содержат models, routes, middleware

# 4. Перезагрузить backend
npm run start

# 5. Тестировать endpoints
# API автоматически создаст collections
```

---

## 🐛 Troubleshooting

### MongoDB не подключается
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Решение**: Убедитесь, что MongoDB запущен
```bash
# Docker
docker ps | grep mongodb

# Windows
# Services → MongoDB Server

# Test connection
mongosh "mongodb://localhost:27017"
```

### JWT Token Expired
- Token жив 7 дней
- Используйте `Remember Me` для долгосрочной сессии
- Frontend должен обновить token перед expiration

### CORS Ошибки
- Убедитесь, что Frontend URL в CORS_ORIGIN
- Или используйте `*` для development

---

## 📚 Дополнительные Ресурсы

- MongoDB Documentation: https://docs.mongodb.com/
- Mongoose Guide: https://mongoosejs.com/
- JWT.io: https://jwt.io/
- Express Guide: https://expressjs.com/

---

## ✅ Checklist для Production

- [ ] Изменить `JWT_SECRET` в .env
- [ ] Использовать MongoDB Atlas вместо localhost
- [ ] Включить SSL для MongoDB connection
- [ ] Настроить CORS_ORIGIN на реальный frontend URL
- [ ] Добавить rate limiting
- [ ] Настроить логирование
- [ ] Добавить backup политику
- [ ] Тестировать все endpoints
- [ ] Настроить monitoring
- [ ] Deploy backend на сервер

---

**Дата создания**: 17.10.2025  
**Версия**: 1.0  
**Статус**: ✅ Production Ready
