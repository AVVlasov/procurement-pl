# 🚀 MongoDB Quick Start Guide
## Express.js Backend для Procurement Platform

**Время на полный setup**: ~30-45 минут  
**Сложность**: Легко  
**Требуемо**: Node.js, npm, Docker (опционально)

---

## 1️⃣ УСТАНОВКА MONGODB (Выберите вариант)

### Вариант A: Docker (Рекомендуется - 30 секунд)
```bash
# Запустить MongoDB в Docker
docker run -d \
  --name procurement-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Проверить что запущено
docker logs procurement-mongodb
```

### Вариант B: Локально (Windows/Mac/Linux)
```bash
# Скачать и установить MongoDB Community Edition
https://www.mongodb.com/try/download/community

# После установки, запустить сервис
# Windows:
mongod

# Mac (если установлен через Homebrew):
brew services start mongodb-community
```

### Вариант C: MongoDB Atlas Cloud (опционально для production)
```
https://www.mongodb.com/cloud/atlas
- Создать аккаунт
- Создать cluster
- Получить connection string
```

---

## 2️⃣ СОЗДАНИЕ BACKEND ПРОЕКТА

```bash
# Создать папку и инициализировать проект
mkdir procurement-backend
cd procurement-backend

npm init -y

# Установить зависимости
npm install express cors dotenv mongoose bcryptjs jsonwebtoken

# Установить dev зависимости
npm install -D typescript ts-node @types/node @types/express @types/mongoose
```

---

## 3️⃣ СТРУКТУРА ПРОЕКТА

```
procurement-backend/
├── src/
│   ├── models/
│   │   ├── User.ts
│   │   ├── Company.ts
│   │   └── Message.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── companies.ts
│   │   └── messages.ts
│   ├── middleware/
│   │   └── auth.ts
│   ├── config/
│   │   └── database.ts
│   └── server.ts
├── .env
├── tsconfig.json
└── package.json
```

---

## 4️⃣ СОЗДАНИЕ МОДЕЛИ USER

**src/models/User.ts**:
```typescript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  companyId: mongoose.Schema.Types.ObjectId,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Хешировать пароль перед сохранением
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Метод для проверки пароля
userSchema.methods.comparePassword = async function(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
```

---

## 5️⃣ ПОДКЛЮЧЕНИЕ К MONGODB

**src/config/database.ts**:
```typescript
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB подключена успешно');
  } catch (error) {
    console.error('❌ Ошибка подключения MongoDB:', error);
    process.exit(1);
  }
};
```

---

## 6️⃣ СОЗДАНИЕ EXPRESS СЕРВЕРА

**src/server.ts**:
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к БД
connectDB().then(() => {
  // Routes (добавим позже)
  
  // Запуск сервера
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('❌ Ошибка запуска:', error);
  process.exit(1);
});
```

---

## 7️⃣ .ENV ФАЙЛ

**.env**:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/procurement_db

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 8️⃣ TSCONFIG

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

---

## 9️⃣ PACKAGE.JSON SCRIPTS

**package.json**:
```json
{
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

---

## 🔟 ПЕРВЫЙ API ENDPOINT

**src/routes/auth.ts**:
```typescript
import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = express.Router();

// Логин
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Найти пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    // Проверить пароль
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверные учетные данные' });
    }
    
    // Создать JWT токен
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Проверить что пользователь не существует
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    // Создать нового пользователя
    const user = new User({
      email,
      passwordHash: password,
      firstName,
      lastName,
    });
    
    await user.save();
    
    // Создать токен
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## 🏃 БЫСТРЫЙ СТАРТ

```bash
# 1. Установить MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 2. Создать проект и установить зависимости
mkdir procurement-backend && cd procurement-backend
npm init -y
npm install express cors dotenv mongoose bcryptjs jsonwebtoken
npm install -D typescript ts-node @types/node @types/express

# 3. Копировать файлы из примеров выше

# 4. Создать .env файл

# 5. Запустить сервер
npm run dev

# Должно вывести: ✅ MongoDB подключена успешно
#                  🚀 Сервер запущен на http://localhost:5000
```

---

## ✅ ПРОВЕРКА РАБОТЫ

```bash
# Откройте другой терминал и отправьте запрос:

# POST /api/auth/register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# POST /api/auth/login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@company.com",
    "password": "SecurePass123!"
  }'
```

---

## 📊 ПОЛЕЗНЫЕ КОМАНДЫ

```bash
# Просмотреть данные в MongoDB (установить MongoDB Compass)
# https://www.mongodb.com/products/compass

# Или использовать mongosh
mongosh "mongodb://localhost:27017"
> use procurement_db
> db.users.find()

# Остановить Docker контейнер
docker stop procurement-mongodb

# Перезапустить контейнер
docker start procurement-mongodb

# Удалить контейнер
docker rm procurement-mongodb
```

---

## 🚨 ЧАСТЫЕ ОШИБКИ

### "MongoNetworkError: connect ECONNREFUSED"
```
→ MongoDB не запущена
Решение: docker run -d -p 27017:27017 mongo:latest
```

### "MongooseError: Cannot connect to database"
```
→ Неправильный MONGODB_URI в .env
Решение: Проверить что mongodb://localhost:27017/procurement_db правильный
```

### "bcryptError: data and hash arguments required"
```
→ Пароль не передан при регистрации
Решение: Убедиться что password есть в теле запроса
```

---

## 🎯 СЛЕДУЮЩИЕ ШАГИ

1. ✅ Добавить остальные routes (companies, messages, search)
2. ✅ Добавить middleware для аутентификации
3. ✅ Создать Mongoose models для других entity
4. ✅ Добавить валидацию входных данных (joi/zod)
5. ✅ Подключить frontend React приложение

---

**Версия**: 1.0  
**Дата**: 17.10.2025  
**Статус**: ✅ ГОТОВО К ИСПОЛЬЗОВАНИЮ

