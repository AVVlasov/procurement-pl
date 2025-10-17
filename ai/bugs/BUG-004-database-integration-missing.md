# 🐛 Баг BUG-004: Отсутствует интеграция с реальной базой данных (используются STUB данные)

## Информация о баге

**Bug ID**: BUG-2025-10-17-004  
**Дата обнаружения**: 17.10.2025  
**Модуль**: Backend Integration / Database  
**Тип**: Архитектурный / Интеграционный  
**Приоритет**: P0 (Критический)  
**Серьезность**: Critical  

---

## Классификация

**Тип ошибки**: Missing database integration (Mock API instead of real backend)

**Описание ошибки требования**:
Фронтенд приложение использует только mock API для всех операций с данными. В production среде отсутствует интеграция с реальной базой данных и backend'ом. Это означает, что:

1. Никакие данные не сохраняются между сеансами
2. Нет синхронизации данных между пользователями
3. Невозможна совместная работа
4. Нет фактического хранилища информации о компаниях

---

## Описание проблемы

### Краткое резюме
Приложение работает только с mock API на базе `stubs/api/index.js`. Все API эндпоинты возвращают hardcoded или сгенерированные данные из памяти. Реальный backend и база данных отсутствуют.

### Детальное описание

**Текущая архитектура:**

```
Frontend (React)
    ↓
RTK Query API clients
    ↓
Mock Express API (stubs/api/index.js)
    ↓
In-Memory Data Storage
    ↓
❌ NO DATABASE
❌ NO REAL BACKEND
```

**Требуемая архитектура:**

```
Frontend (React)
    ↓
RTK Query API clients
    ↓
Real Express Backend
    ↓
PostgreSQL / MongoDB Database
    ↓
✅ PERSISTENT DATA
✅ REAL BACKEND
```

### Проблемы

#### 1. Mock API файл
**Файл**: `stubs/api/index.js`

Содержит полный express сервер, который:
- ✗ Не использует реальную базу данных
- ✗ Хранит данные в памяти (теряются при перезагрузке)
- ✗ Не имеет аутентификации
- ✗ Не валидирует данные на backend'е
- ✗ Не имеет защиты от SQL injection (так как нет БД)

#### 2. RTK Query endpoints без реального подключения
**Файл**: `src/__data__/api/authApi.ts`

```typescript
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${URLs.apiUrl}/auth` }),  // ← Указывает на MOCK API
  // ...
})
```

**Файл**: `src/__data__/urls.ts`

Вероятно содержит:
```typescript
export const URLs = {
  apiUrl: 'http://localhost:3001',  // ← MOCK API URL
}
```

#### 3. Тестовые данные вместо реальных
**Файл**: `stubs/mocks/*.json`

Все файлы содержат hardcoded тестовые данные:
- `stubs/mocks/auth.json` - fake credentials
- `stubs/mocks/companies.json` - fake companies
- `stubs/mocks/products.json` - fake products
- `stubs/mocks/search.json` - fake search results

#### 4. Отсутствие реальной аутентификации
- ✗ Нет JWT токенов
- ✗ Нет сессий в database
- ✗ Нет refresh token механизма
- ✗ Нет хеширования паролей

#### 5. Отсутствие валидации на backend'е
- ✗ Все валидации только на frontend'е
- ✗ Нет проверок на backend'е
- ✗ Можно обойти все ограничения через Postman/curl

### Ожидаемое поведение

**Production требования**:
1. ✅ Реальный backend с Express.js / NestJS / FastAPI
2. ✅ PostgreSQL или MongoDB база данных
3. ✅ Аутентификация с JWT токенами
4. ✅ Валидация всех данных на backend'е
5. ✅ Шифрование паролей (bcrypt)
6. ✅ Защита от CSRF, XSS, SQL injection
7. ✅ Логирование операций
8. ✅ Резервное копирование данных

---

## Затронутые компоненты

### 1. Аутентификация
- ✗ Логин не проверяется в database
- ✗ Любые credentials "работают"
- ✗ Пароли не хешируются
- ✗ Токены mock

### 2. Профиль компании
- ✗ Загруженные файлы не сохраняются
- ✗ Изменения данных теряются при перезагрузке
- ✗ Нет синхронизации между пользователями

### 3. Поиск партнеров
- ✗ Результаты из hardcoded данных
- ✗ Нет индексирования в БД
- ✗ Нет фильтрации в реальной БД
- ✗ Нет рейтинга и статистики

### 4. Сообщения
- ✗ История сообщений не сохраняется
- ✗ Нет оповещений в реальном времени
- ✗ Никакие сообщения не приходят другим пользователям

### 5. Документы
- ✗ Загруженные файлы не сохраняются на диск
- ✗ Нет реального хранилища (S3, Azure Blob, etc.)
- ✗ Нет версионирования файлов

---

## Требуемые изменения

### Фаза 1: Подготовка Backend-а

1. **Создать реальный Backend**
   ```bash
   # Option 1: Express.js + TypeScript + MongoDB (РЕКОМЕНДУЕТСЯ)
   npm init -y
   npm install express cors dotenv mongoose bcryptjs jsonwebtoken
   npm install -D typescript ts-node @types/node @types/express
   # ... создать структуру проекта
   
   # Option 2: NestJS + MongoDB
   npm i -g @nestjs/cli
   nest new backend
   npm install mongoose @nestjs/mongoose
   ```

2. **Создать MongoDB базу данных**
   ```bash
   # Вариант 1: Локально (разработка)
   # Установить MongoDB Community https://www.mongodb.com/try/download/community
   # Или использовать Docker:
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Вариант 2: MongoDB Atlas Cloud (для production)
   # https://www.mongodb.com/cloud/atlas
   # Создать cluster и получить connection string
   ```

3. **Создать Mongoose schemas**
   ```typescript
   // models/User.ts
   import mongoose from 'mongoose';
   import bcrypt from 'bcryptjs';
   
   const userSchema = new mongoose.Schema({
     email: { 
       type: String, 
       unique: true, 
       required: true,
       lowercase: true 
     },
     passwordHash: { 
       type: String, 
       required: true 
     },
     firstName: String,
     lastName: String,
     companyId: mongoose.Schema.Types.ObjectId,
     createdAt: { 
       type: Date, 
       default: Date.now 
     },
   });
   
   // Хешировать пароль перед сохранением
   userSchema.pre('save', async function(next) {
     if (!this.isModified('passwordHash')) return next();
     
     const salt = await bcrypt.genSalt(10);
     this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
     next();
   });
   
   export const User = mongoose.model('User', userSchema);
   
   // models/Company.ts
   const companySchema = new mongoose.Schema({
     name: { type: String, required: true },
     inn: { type: String, unique: true },
     ogrn: String,
     shortName: String,
     website: String,
     industry: String,
     size: String,
     logo: String,
     description: String,
     createdAt: { type: Date, default: Date.now },
   });
   
   export const Company = mongoose.model('Company', companySchema);
   
   // models/Message.ts
   const messageSchema = new mongoose.Schema({
     threadId: String,
     senderCompanyId: mongoose.Schema.Types.ObjectId,
     recipientCompanyId: mongoose.Schema.Types.ObjectId,
     text: String,
     timestamp: { type: Date, default: Date.now },
   });
   
   export const Message = mongoose.model('Message', messageSchema);
   
   // ... другие модели
   ```

4. **Подключиться к MongoDB**
   ```typescript
   // config/database.ts
   import mongoose from 'mongoose';
   
   export const connectDB = async () => {
     try {
       const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';
       
       await mongoose.connect(mongoUri, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
       });
       
       console.log('✅ MongoDB connected');
     } catch (error) {
       console.error('❌ MongoDB connection failed:', error);
       process.exit(1);
     }
   };
   
   // server.ts
   import { connectDB } from './config/database';
   
   const app = express();
   
   connectDB().then(() => {
     app.listen(5000, () => {
       console.log('🚀 Server running on port 5000');
     });
   });
   ```

### Фаза 2: API endpoints

**Создать endpoints для всех операций:**
- POST `/api/auth/login` - проверка в MongoDB
- POST `/api/auth/register` - сохранение в MongoDB
- GET `/api/companies/:id` - получение из MongoDB
- PUT `/api/companies/:id` - обновление в MongoDB
- POST `/api/messages` - сохранение сообщений в MongoDB
- GET `/api/messages/threads/:id` - получение истории
- POST `/api/search` - поиск в MongoDB

**Пример endpoint'а**:
```typescript
// routes/auth.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Найти пользователя в MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Проверить пароль
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Создать JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Фаза 3: Миграция с mock API на реальный

- Отправить POST на реальный backend вместо mock
- Обновить `src/__data__/urls.ts`:
```typescript
export const URLs = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',  // ← REAL API
}
```

### Фаза 4: Безопасность

- ✅ Использовать bcrypt для хеширования паролей
- ✅ JWT токены с expiration
- ✅ CORS настройки
- ✅ Rate limiting (express-rate-limit)
- ✅ Input validation (joi/zod)
- ✅ Логирование (winston/morgan)

---

## Окружение

### Разработка (Development)
- **Frontend**: React на http://localhost:3000
- **Backend**: Express на http://localhost:5000
- **Database**: MongoDB локально на http://localhost:27017

### Production
- **Frontend**: Deployed на Vercel/Netlify
- **Backend**: Deployed на Heroku/Railway/AWS
- **Database**: MongoDB Atlas Cloud

---

## MongoDB vs PostgreSQL

| Параметр | MongoDB | PostgreSQL |
|----------|---------|-----------|
| **Скорость старта** | ⚡ 30 мин | ⚠️ 1-2 часа |
| **Установка** | 📱 Просто (Docker) | 📦 Сложнее |
| **Для development** | ✅ Идеально | ⚠️ Переусложнено |
| **Для production** | ✅ OK | ✅ Лучше |
| **Гибкость schema** | ✅ Да (NoSQL) | ❌ Нет (SQL) |
| **Миграция позже** | ✅ Легко на PG | - |

**Рекомендация**: Используйте MongoDB для быстрого старта MVP, затем мигрируйте на PostgreSQL перед production если нужно.

---

## Влияние на функционал

- **Критичность**: Critical (P0)
- **Область воздействия**: Все компоненты приложения
- **Готовность к production**: 0% (невозможно использовать в production)
- **Требования**: БЛОКИРУЕТ выпуск в production

---

## Примечания

### Текущее состояние vs Production
| Функция | Mock API | Production |
|---------|----------|------------|
| Сохранение данных | ❌ В памяти | ✅ В БД |
| Аутентификация | ❌ Mock | ✅ JWT + БД |
| Валидация | ❌ Frontend only | ✅ Backend + Frontend |
| Файлы | ❌ Не сохраняются | ✅ В S3/диск |
| Многопользовательность | ❌ Нет | ✅ Да |
| Безопасность | ❌ Нет | ✅ Да |

---

## Комментарии

**QA Engineer** (17.10.2025):
> Приложение полностью зависит от mock API. Это нормально для разработки, но production готовности нет. Нужен реальный backend с базой данных. Все данные пользователей теряются при перезагрузке приложения или сервера.

---

**Статус**: New  
**Автор**: QA Testing Team  
**Дата создания**: 17.10.2025  
**Приоритет**: CRITICAL - блокирует production release
