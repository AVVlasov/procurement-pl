# Задача: Простая аутентификация (MVP 0)

## Описание
Реализация упрощенной регистрации и входа без email верификации и refresh токенов.

## Цель
Быстро реализовать базовую аутентификацию для демо.

## Технические требования

### 1. src/controllers/authController.js
```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { ValidationError, UnauthorizedError, ConflictError } from '../utils/errors.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d'; // Упрощенно: один токен на 7 дней

// Генерация JWT токена
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export const authController = {
  // Регистрация (упрощенная)
  async register(req, res, next) {
    try {
      const { email, password, companyName, inn } = req.body;
      
      // Валидация
      if (!email || !password || !companyName || !inn) {
        throw new ValidationError('Email, password, company name and INN are required');
      }
      
      if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }
      
      if (inn.length !== 10 || !/^\d+$/.test(inn)) {
        throw new ValidationError('INN must be exactly 10 digits');
      }
      
      // Проверка существующего пользователя
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new ConflictError('User with this email already exists');
      }
      
      // Проверка существующей компании
      const existingCompany = await query(
        'SELECT id FROM companies WHERE inn = $1',
        [inn]
      );
      
      if (existingCompany.rows.length > 0) {
        throw new ConflictError('Company with this INN already exists');
      }
      
      // Хеширование пароля
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Создание пользователя
      const userResult = await query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, passwordHash]
      );
      
      const user = userResult.rows[0];
      
      // Создание компании
      const companyResult = await query(
        `INSERT INTO companies (user_id, inn, full_name, email) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, full_name, inn`,
        [user.id, inn, companyName, email]
      );
      
      const company = companyResult.rows[0];
      
      // Генерация токена
      const token = generateToken(user.id);
      
      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
        },
        company: {
          id: company.id,
          name: company.full_name,
          inn: company.inn,
        },
        token,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Вход
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }
      
      // Поиск пользователя
      const userResult = await query(
        'SELECT id, email, password_hash FROM users WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        throw new UnauthorizedError('Invalid credentials');
      }
      
      const user = userResult.rows[0];
      
      // Проверка пароля
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }
      
      // Получение компании
      const companyResult = await query(
        'SELECT id, full_name, inn FROM companies WHERE user_id = $1',
        [user.id]
      );
      
      const company = companyResult.rows[0];
      
      // Генерация токена
      const token = generateToken(user.id);
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
        },
        company: company ? {
          id: company.id,
          name: company.full_name,
          inn: company.inn,
        } : null,
        token,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Получение текущего пользователя
  async me(req, res, next) {
    try {
      // req.user установлен в middleware authenticate
      const companyResult = await query(
        'SELECT id, full_name, inn, description, website, phone, email FROM companies WHERE user_id = $1',
        [req.user.id]
      );
      
      res.json({
        user: req.user,
        company: companyResult.rows[0] || null,
      });
      
    } catch (error) {
      next(error);
    }
  },
};
```

### 2. Обновление src/routes/auth.js
```javascript
import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);

export default router;
```

### 3. Тестирование

Создать файл `backend/test-auth.http`:
```http
### Регистрация
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "demo123",
  "companyName": "ООО Демо Компания",
  "inn": "1234567890"
}

### Вход
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "demo123"
}

### Получение текущего пользователя
GET http://localhost:3000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

### 4. Валидация данных (простая)

Создать `src/utils/validation.js`:
```javascript
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateINN(inn) {
  return inn && inn.length === 10 && /^\d+$/.test(inn);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}
```

Обновить authController для использования:
```javascript
import { validateEmail, validateINN, validatePassword } from '../utils/validation.js';

// В методе register:
if (!validateEmail(email)) {
  throw new ValidationError('Invalid email format');
}

if (!validatePassword(password)) {
  throw new ValidationError('Password must be at least 6 characters');
}

if (!validateINN(inn)) {
  throw new ValidationError('INN must be exactly 10 digits');
}
```

## Критерии приёмки
- [ ] Регистрация работает с email, пароль, название компании и ИНН
- [ ] При регистрации создается пользователь и компания
- [ ] Вход работает с проверкой пароля
- [ ] JWT токен генерируется и возвращается
- [ ] Endpoint /me возвращает данные пользователя
- [ ] Проверка на существующий email работает
- [ ] Проверка на существующий ИНН работает
- [ ] Пароли хешируются через bcrypt
- [ ] Базовая валидация данных работает

## Зависимости
- Задача 01-express-minimal
- Задача 02-postgres-local-setup

## Приоритет
Критический (P0)

## Оценка времени
2-3 часа

## Примеры использования

### Регистрация
```javascript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    companyName: 'ООО Моя Компания',
    inn: '1234567890',
  }),
});

const data = await response.json();
// Сохранить data.token в localStorage
```

### Вход
```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
});

const data = await response.json();
// Сохранить data.token в localStorage
```

### Получение профиля
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const data = await response.json();
// data.user и data.company
```


