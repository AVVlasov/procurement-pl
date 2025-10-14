# Задача: Базовая инфраструктура Backend

## Описание
Настройка базового Express/Fastify сервера с middleware, логированием и обработкой ошибок.

## Цель
Создать фундамент для всех API endpoints с правильной архитектурой и best practices.

## Технические требования

### 1. Структура Backend
```
backend/
├── src/
│   ├── index.js              # Точка входа
│   ├── app.js                # Express app конфигурация
│   ├── config/
│   │   ├── database.js       # Knex конфигурация
│   │   ├── redis.js          # Redis клиент
│   │   ├── rabbitmq.js       # RabbitMQ подключение
│   │   └── constants.js      # Константы приложения
│   ├── middlewares/
│   │   ├── auth.js           # JWT authentication
│   │   ├── errorHandler.js   # Обработка ошибок
│   │   ├── validation.js     # Валидация запросов
│   │   ├── rateLimit.js      # Rate limiting
│   │   └── logger.js         # Request logging
│   ├── utils/
│   │   ├── logger.js         # Winston logger
│   │   ├── errors.js         # Custom error classes
│   │   └── helpers.js        # Вспомогательные функции
│   ├── routes/
│   │   └── index.js          # Главный роутер
│   ├── controllers/
│   ├── services/
│   ├── models/
│   └── database/
│       ├── migrations/
│       └── seeds/
├── tests/
├── Dockerfile
├── package.json
└── .env.example
```

### 2. src/index.js
```javascript
import 'dotenv/config';
import app from './app.js';
import logger from './utils/logger.js';
import { initDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import { initRabbitMQ } from './config/rabbitmq.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Инициализация подключений
    await initDatabase();
    logger.info('Database connected');
    
    await initRedis();
    logger.info('Redis connected');
    
    await initRabbitMQ();
    logger.info('RabbitMQ connected');
    
    // Запуск сервера
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        // Закрытие подключений
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### 3. src/app.js
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/logger.js';
import { rateLimiter } from './middlewares/rateLimit.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handler (должен быть последним)
app.use(errorHandler);

export default app;
```

### 4. src/utils/logger.js
```javascript
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// В development добавляем консоль с цветами
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
  }));
}

export default logger;
```

### 5. src/utils/errors.js
```javascript
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
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

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
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

### 6. src/middlewares/errorHandler.js
```javascript
import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Логирование ошибки
  if (err.isOperational) {
    logger.warn(`Operational error: ${err.message}`);
  } else {
    logger.error('Programming or unknown error:', err);
  }
  
  // Knex/PostgreSQL ошибки
  if (err.code === '23505') {
    error = new AppError('Duplicate field value', 409);
  }
  if (err.code === '23503') {
    error = new AppError('Invalid reference', 400);
  }
  if (err.code === '22P02') {
    error = new AppError('Invalid UUID format', 400);
  }
  
  // JWT ошибки
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }
  
  // Joi validation ошибки
  if (err.isJoi) {
    error = new AppError(err.details[0].message, 400);
  }
  
  // Multer ошибки (файлы)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large', 400);
  }
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: error.status || 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
```

### 7. src/middlewares/logger.js
```javascript
import logger from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Request failed:', logData);
    } else {
      logger.info('Request completed:', logData);
    }
  });
  
  next();
}
```

### 8. src/middlewares/rateLimit.js
```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';

export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:',
  }),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 минут
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Более строгий лимит для auth endpoints
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth_rate_limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes',
  },
});
```

### 9. src/config/database.js
```javascript
import knex from 'knex';
import knexConfig from '../../knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

export const db = knex(config);

export async function initDatabase() {
  try {
    await db.raw('SELECT 1');
    return db;
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}
```

### 10. src/config/redis.js
```javascript
import { createClient } from 'redis';
import logger from '../utils/logger.js';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

export async function initRedis() {
  await redisClient.connect();
  return redisClient;
}

// Utility functions
export const cache = {
  async get(key) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  },
  
  async set(key, value, expiresIn = 3600) {
    await redisClient.setEx(key, expiresIn, JSON.stringify(value));
  },
  
  async del(key) {
    await redisClient.del(key);
  },
  
  async exists(key) {
    return await redisClient.exists(key);
  },
};
```

### 11. src/config/rabbitmq.js
```javascript
import amqp from 'amqplib';
import logger from '../utils/logger.js';

let connection = null;
let channel = null;

const QUEUES = {
  COMPANY_VERIFICATION: 'company_verification_queue',
  SMART_SEARCH: 'smart_search_queue',
  RECOMMENDATION: 'recommendation_queue',
  DOCUMENT_ANALYSIS: 'document_analysis_queue',
  REPORT_GENERATION: 'report_generation_queue',
};

export async function initRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Создание всех очередей
    for (const queue of Object.values(QUEUES)) {
      await channel.assertQueue(queue, { durable: true });
    }
    
    logger.info('RabbitMQ queues created');
    return { connection, channel };
  } catch (error) {
    throw new Error(`RabbitMQ connection failed: ${error.message}`);
  }
}

export async function publishToQueue(queueName, message) {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  
  const messageBuffer = Buffer.from(JSON.stringify(message));
  return channel.sendToQueue(queueName, messageBuffer, { persistent: true });
}

export { QUEUES };
```

### 12. Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Копирование package files
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Создание директории для логов
RUN mkdir -p logs uploads

EXPOSE 3000

CMD ["node", "src/index.js"]
```

## Критерии приёмки
- [ ] Express сервер настроен и запускается
- [ ] Все middleware работают корректно
- [ ] Логирование настроено (Winston)
- [ ] Обработка ошибок централизована
- [ ] Подключения к PostgreSQL, Redis, RabbitMQ инициализируются
- [ ] Rate limiting работает
- [ ] Health check endpoint доступен
- [ ] Graceful shutdown реализован
- [ ] Dockerfile создан

## Зависимости
- Задача 01-project-structure
- Задача 02-docker-compose
- Задача 01-database-schema

## Приоритет
Критический (P0)

## Оценка времени
6-8 часов

