# Задача: Улучшение архитектуры Backend (MVP 1)

## Описание
Рефакторинг кода backend из простой структуры MVP 0 в слоистую архитектуру для лучшей масштабируемости.

## Цель
Разделить код на слои (routes, controllers, services, models) для улучшения maintainability и тестируемости.

## Технические требования

### 1. Новая структура проекта

```
backend/
├── src/
│   ├── config/          # Конфигурация
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── app.js
│   ├── controllers/     # Обработчики HTTP запросов
│   │   ├── authController.js
│   │   ├── companyController.js
│   │   ├── productController.js
│   │   └── searchController.js
│   ├── services/        # Бизнес-логика
│   │   ├── authService.js
│   │   ├── companyService.js
│   │   ├── productService.js
│   │   ├── searchService.js
│   │   └── cacheService.js
│   ├── models/          # Модели данных
│   │   ├── User.js
│   │   ├── Company.js
│   │   └── Product.js
│   ├── routes/          # Определение маршрутов
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── companies.js
│   │   ├── products.js
│   │   └── search.js
│   ├── middleware/      # Middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── cache.js
│   ├── utils/           # Утилиты
│   │   ├── logger.js
│   │   ├── errors.js
│   │   └── validators.js
│   ├── database/        # БД
│   │   ├── connection.js
│   │   ├── migrations/
│   │   └── seeds/
│   └── server.js        # Точка входа
├── tests/               # Тесты
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
└── README.md
```

### 2. Controllers (обработчики запросов)

**src/controllers/authController.js**
```javascript
const authService = require('../services/authService');
const { validateRequest } = require('../utils/validators');
const { AppError } = require('../utils/errors');

class AuthController {
  async register(req, res, next) {
    try {
      // Валидация
      const errors = validateRequest(req.body, {
        email: 'required|email',
        password: 'required|min:6',
        companyName: 'required|min:3',
        inn: 'required|length:10',
      });

      if (errors) {
        throw new AppError('Validation failed', 400, errors);
      }

      // Вызов сервиса
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validateRequest(req.body, {
        email: 'required|email',
        password: 'required',
      });

      if (errors) {
        throw new AppError('Validation failed', 400, errors);
      }

      const result = await authService.login(req.body);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Инвалидация токена (если используется blacklist)
      await authService.logout(req.user.id);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
```

**src/controllers/companyController.js**
```javascript
const companyService = require('../services/companyService');
const { validateRequest } = require('../utils/validators');
const { AppError } = require('../utils/errors');

class CompanyController {
  async getMyCompany(req, res, next) {
    try {
      const data = await companyService.getCompanyByUserId(req.user.id);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await companyService.getCompanyById(id);

      if (!data) {
        throw new AppError('Company not found', 404);
      }

      // Инкремент просмотров
      await companyService.incrementViews(id);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req, res, next) {
    try {
      const { id } = req.params;

      // Проверка прав доступа
      const company = await companyService.getCompanyById(id);
      if (!company || company.user_id !== req.user.id) {
        throw new AppError('Access denied', 403);
      }

      const updated = await companyService.updateCompany(id, req.body);

      res.json({
        success: true,
        data: { company: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  async searchCompanies(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      const result = await companyService.searchCompanies(q, { page, limit });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompanyController();
```

### 3. Services (бизнес-логика)

**src/services/authService.js**
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { AppError } = require('../utils/errors');

class AuthService {
  async register(userData) {
    const { email, password, companyName, inn, ...companyData } = userData;

    // Проверка существования пользователя
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Проверка ИНН
    const existingCompany = await Company.findByInn(inn);
    if (existingCompany) {
      throw new AppError('Company with this INN already registered', 409);
    }

    // Создание пользователя
    const user = await User.create({
      email,
      password,
    });

    // Создание компании
    const company = await Company.create({
      user_id: user.id,
      full_name: companyName,
      inn,
      ...companyData,
    });

    // Генерация токена
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      company,
      token,
    };
  }

  async login(credentials) {
    const { email, password } = credentials;

    // Найти пользователя
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Проверка пароля
    const isValid = await User.verifyPassword(user, password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Проверка активности
    if (!user.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    // Генерация токена
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return this.sanitizeUser(user);
  }

  async logout(userId) {
    // Добавить токен в blacklist (опционально)
    // await redis.sadd('token:blacklist', token);
    return true;
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  sanitizeUser(user) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
```

**src/services/companyService.js**
```javascript
const Company = require('../models/Company');
const Product = require('../models/Product');
const cacheService = require('./cacheService');
const { AppError } = require('../utils/errors');

class CompanyService {
  async getCompanyByUserId(userId) {
    const cacheKey = `company:user:${userId}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const company = await Company.findByUserId(userId);
        if (!company) {
          throw new AppError('Company not found', 404);
        }

        const products = await Product.findByCompanyId(company.id);

        return {
          company,
          products: {
            offered: products.filter(p => p.type === 'offered'),
            needed: products.filter(p => p.type === 'needed'),
          },
        };
      },
      600
    );
  }

  async getCompanyById(id) {
    const cacheKey = `company:${id}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const company = await Company.findById(id);
        if (!company) {
          return null;
        }

        const products = await Product.findByCompanyId(id);

        return {
          company,
          products: {
            offered: products.filter(p => p.type === 'offered'),
            needed: products.filter(p => p.type === 'needed'),
          },
        };
      },
      600
    );
  }

  async updateCompany(id, data) {
    const company = await Company.update(id, data);

    // Инвалидация кэша
    await cacheService.invalidatePattern(`company:${id}*`);
    await cacheService.invalidatePattern(`company:user:*`);

    return company;
  }

  async searchCompanies(query, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const cacheKey = `companies:search:${query}:${page}:${limit}`;

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const companies = await Company.search(query, { limit, offset });
        const total = await Company.count({ query });

        return {
          companies,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        };
      },
      300
    );
  }

  async incrementViews(id) {
    await Company.incrementViews(id);
    // Не инвалидируем кэш для статистики - обновим при следующем запросе
  }
}

module.exports = new CompanyService();
```

### 4. Обновленные Routes

**src/routes/auth.js**
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
```

**src/routes/companies.js**
```javascript
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticate } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

router.get(
  '/my/profile',
  authenticate,
  companyController.getMyCompany
);

router.get(
  '/search',
  authenticate,
  cacheMiddleware(300),
  companyController.searchCompanies
);

router.get(
  '/:id',
  authenticate,
  cacheMiddleware(600),
  companyController.getCompanyById
);

router.put(
  '/:id',
  authenticate,
  companyController.updateCompany
);

module.exports = router;
```

**src/routes/index.js**
```javascript
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const companyRoutes = require('./companies');
const productRoutes = require('./products');
const searchRoutes = require('./search');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/products', productRoutes);
router.use('/search', searchRoutes);

module.exports = router;
```

### 5. Error Handling

**src/utils/errors.js**
```javascript
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(errors) {
    super('Validation Error', 400, errors);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
};
```

**src/middleware/errorHandler.js**
```javascript
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Логирование ошибки
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Operational errors - отправляем клиенту
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      errors: err.errors,
    });
  }

  // Programming or unknown errors - не раскрываем детали
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    error: 'Something went wrong',
  });
}

// Not found handler
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
```

### 6. Logger

**src/utils/logger.js**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'b2b-backend' },
  transports: [
    // Файл для ошибок
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // Файл для всех логов
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

// В разработке - вывод в консоль
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
```

### 7. Обновленный server.js

**src/server.js**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');
const db = require('./database/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await db.destroy();
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;
```

### 8. Dependencies

**package.json**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "winston": "^3.11.0",
    "joi": "^17.11.0"
  }
}
```

## Критерии приёмки
- [ ] Код разделен на слои (routes, controllers, services, models)
- [ ] Controllers содержат только обработку HTTP
- [ ] Services содержат бизнес-логику
- [ ] Models содержат работу с данными
- [ ] Error handling централизован
- [ ] Logger настроен с Winston
- [ ] Validation вынесена в отдельные функции
- [ ] Все endpoints используют новую структуру
- [ ] Код стал более тестируемым
- [ ] Документация обновлена

## Зависимости
- MVP 0 backend завершен
- Задача 03-knex-migrations

## Приоритет
Высокий (P1)

## Оценка времени
4-5 дней

## Примечания
Правильная архитектура критична для масштабируемости. Разделение на слои упрощает тестирование и поддержку кода.

