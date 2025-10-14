# Задача: Минимальный Express сервер (MVP 0)

## Описание
Создание базового Express сервера без сложных middleware и зависимостей.

## Цель
Быстро запустить backend API для обработки запросов от frontend.

## Технические требования

### 1. src/index.js
```javascript
import 'dotenv/config';
import app from './app.js';
import { testConnection } from './db.js';

const PORT = process.env.PORT || 3000;

async function start() {
  // Проверка подключения к БД
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

start();
```

### 2. src/app.js
```javascript
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import productRoutes from './routes/products.js';

const app = express();

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/products', productRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
```

### 3. src/db.js
```javascript
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

export async function query(text, params) {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}
```

### 4. src/utils/errors.js
```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}
```

### 5. src/middlewares/auth.js
```javascript
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors.js';
import { query } from '../db.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Получение пользователя из БД
    const result = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }
    
    req.user = result.rows[0];
    
    // Получение компании пользователя
    const companyResult = await query(
      'SELECT id, full_name FROM companies WHERE user_id = $1',
      [req.user.id]
    );
    
    if (companyResult.rows.length > 0) {
      req.company = companyResult.rows[0];
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
}
```

### 6. src/routes/auth.js (пустой шаблон)
```javascript
import express from 'express';

const router = express.Router();

// Будет реализовано в следующей задаче
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

export default router;
```

### 7. src/routes/companies.js (пустой шаблон)
```javascript
import express from 'express';

const router = express.Router();

// Будет реализовано в следующей задаче
router.get('/:id', (req, res) => {
  res.json({ message: 'Get company endpoint - to be implemented' });
});

export default router;
```

### 8. src/routes/products.js (пустой шаблон)
```javascript
import express from 'express';

const router = express.Router();

// Будет реализовано в следующей задаче
router.get('/', (req, res) => {
  res.json({ message: 'Get products endpoint - to be implemented' });
});

export default router;
```

### 9. Тестирование endpoints

Создать файл `backend/test-endpoints.http` для тестирования:
```http
### Health Check
GET http://localhost:3000/health

### Register (to be implemented)
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}

### Login (to be implemented)
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}
```

## Критерии приёмки
- [ ] Express сервер запускается без ошибок
- [ ] Подключение к PostgreSQL работает
- [ ] Health check endpoint возвращает 200 OK
- [ ] CORS настроен для frontend
- [ ] Базовая обработка ошибок работает
- [ ] Middleware аутентификации создан
- [ ] Структура routes создана

## Зависимости
- Задача 01-basic-project-setup
- Задача 02-postgres-local-setup

## Приоритет
Критический (P0)

## Оценка времени
2-3 часа

## Инструкции по запуску

```bash
cd backend
npm install
cp .env.example .env
# Отредактировать .env с данными PostgreSQL
npm run dev
```

Проверить работу:
```bash
curl http://localhost:3000/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```


