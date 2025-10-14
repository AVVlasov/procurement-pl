# Задача: Настройка Redis для кэширования (MVP 1)

## Описание
Интеграция Redis для кэширования данных и улучшения производительности.

## Цель
Снизить нагрузку на БД и ускорить отклик API за счет кэширования часто запрашиваемых данных.

## Технические требования

### 1. Установка зависимостей

```bash
cd backend
npm install redis ioredis
```

### 2. Redis client configuration

**backend/src/config/redis.js**
```javascript
const Redis = require('ioredis');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Основной клиент
const redis = new Redis(redisConfig);

// Клиент для pub/sub (опционально для MVP 2)
const redisPub = new Redis(redisConfig);
const redisSub = new Redis(redisConfig);

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

module.exports = {
  redis,
  redisPub,
  redisSub,
};
```

### 3. Cache middleware

**backend/src/middleware/cache.js**
```javascript
const { redis } = require('../config/redis');

/**
 * Cache middleware для кэширования GET запросов
 * @param {number} ttl - Time to live в секундах
 * @param {function} keyGenerator - Функция для генерации ключа кэша
 */
function cacheMiddleware(ttl = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // Кэшируем только GET запросы
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Генерация ключа кэша
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `cache:${req.originalUrl}`;

      // Попытка получить из кэша
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log(`✅ Cache hit: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      console.log(`❌ Cache miss: ${cacheKey}`);

      // Перехват оригинального res.json
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Сохранить в кэш
        redis.setex(cacheKey, ttl, JSON.stringify(data))
          .catch(err => console.error('Redis set error:', err));
        
        // Вернуть данные клиенту
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Инвалидация кэша по паттерну
 */
async function invalidateCache(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️  Invalidated ${keys.length} cache keys: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Очистка всего кэша
 */
async function clearCache() {
  try {
    await redis.flushdb();
    console.log('🗑️  Cache cleared');
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  clearCache,
};
```

### 4. Cache service

**backend/src/services/cacheService.js**
```javascript
const { redis } = require('../config/redis');

class CacheService {
  /**
   * Получить значение из кэша
   */
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Установить значение в кэш
   */
  async set(key, value, ttl = 300) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Удалить из кэша
   */
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Проверить существование ключа
   */
  async exists(key) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Получить или установить (cache-aside pattern)
   */
  async getOrSet(key, fetchFunction, ttl = 300) {
    try {
      // Попытка получить из кэша
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Если нет в кэше - получить данные
      const data = await fetchFunction();
      
      // Сохранить в кэш
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      // Если ошибка кэша - получить данные напрямую
      return await fetchFunction();
    }
  }

  /**
   * Инвалидация по паттерну
   */
  async invalidatePattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Invalidated ${keys.length} keys matching: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Increment counter
   */
  async increment(key, ttl = null) {
    try {
      const value = await redis.incr(key);
      if (ttl && value === 1) {
        await redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set with hash
   */
  async hset(key, field, value) {
    try {
      await redis.hset(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache hset error:`, error);
      return false;
    }
  }

  /**
   * Get from hash
   */
  async hget(key, field) {
    try {
      const value = await redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache hget error:`, error);
      return null;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall(key) {
    try {
      const data = await redis.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      console.error(`Cache hgetall error:`, error);
      return {};
    }
  }
}

module.exports = new CacheService();
```

### 5. Применение кэширования в API

**backend/src/routes/companies.js** (обновленный)
```javascript
const express = require('express');
const router = express.Router();
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');
const cacheService = require('../services/cacheService');

// Кэширование списка компаний на 5 минут
router.get(
  '/companies',
  cacheMiddleware(300, (req) => `companies:list:${req.query.page || 1}`),
  async (req, res) => {
    // ... код получения компаний
  }
);

// Кэширование отдельной компании на 10 минут
router.get(
  '/companies/:id',
  cacheMiddleware(600, (req) => `company:${req.params.id}`),
  async (req, res) => {
    const { id } = req.params;
    
    const company = await cacheService.getOrSet(
      `company:${id}`,
      async () => {
        // Получение из БД
        return await db('companies').where({ id }).first();
      },
      600
    );

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ company });
  }
);

// При обновлении - инвалидация кэша
router.put('/companies/:id', async (req, res) => {
  const { id } = req.params;
  
  // Обновление компании
  await db('companies').where({ id }).update(req.body);
  
  // Инвалидация кэша
  await invalidateCache(`company:${id}*`);
  await invalidateCache('companies:list:*');
  
  res.json({ message: 'Company updated' });
});

module.exports = router;
```

### 6. Кэширование для поиска

**backend/src/routes/search.js**
```javascript
const cacheService = require('../services/cacheService');

router.post('/search/ai', async (req, res) => {
  const { query } = req.body;
  
  // Генерация ключа кэша на основе хеша запроса
  const crypto = require('crypto');
  const queryHash = crypto
    .createHash('md5')
    .update(query.toLowerCase().trim())
    .digest('hex');
  
  const cacheKey = `search:${queryHash}`;
  
  // Попытка получить из кэша (кэш на 1 час)
  const cachedResults = await cacheService.get(cacheKey);
  if (cachedResults) {
    return res.json({ 
      ...cachedResults, 
      cached: true 
    });
  }
  
  // Выполнить AI поиск
  const results = await aiService.search(query);
  
  // Сохранить в кэш
  await cacheService.set(cacheKey, results, 3600);
  
  res.json({ 
    ...results, 
    cached: false 
  });
});
```

### 7. Session storage в Redis

**backend/src/middleware/session.js**
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { redis } = require('../config/redis');

const sessionMiddleware = session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET || 'session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});

module.exports = sessionMiddleware;
```

### 8. Rate limiting с Redis

**backend/src/middleware/rateLimiter.js**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redis } = require('../config/redis');

// Общий rate limiter
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий limiter для авторизации
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Limiter для AI запросов
const aiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:ai:',
  }),
  windowMs: 60 * 1000, // 1 минута
  max: 10,
  message: 'Too many AI requests, please slow down.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
};
```

### 9. Мониторинг Redis

**backend/src/routes/admin.js**
```javascript
const express = require('express');
const router = express.Router();
const { redis } = require('../config/redis');

// Статистика Redis (только для админов)
router.get('/admin/redis/stats', async (req, res) => {
  try {
    const info = await redis.info();
    const dbSize = await redis.dbsize();
    const memory = await redis.info('memory');
    
    res.json({
      dbSize,
      info: parseRedisInfo(info),
      memory: parseRedisInfo(memory),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Очистка кэша (только для админов)
router.post('/admin/redis/flush', async (req, res) => {
  try {
    await redis.flushdb();
    res.json({ message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseRedisInfo(info) {
  const lines = info.split('\r\n');
  const result = {};
  lines.forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':');
      result[key] = value;
    }
  });
  return result;
}

module.exports = router;
```

### 10. Обновление package.json

```json
{
  "dependencies": {
    "ioredis": "^5.3.2",
    "express-session": "^1.17.3",
    "connect-redis": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "rate-limit-redis": "^4.2.0"
  }
}
```

### 11. Environment variables

**.env**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
SESSION_SECRET=your-session-secret
```

### 12. Тесты для cache service

**backend/tests/cacheService.test.js**
```javascript
const cacheService = require('../src/services/cacheService');

describe('CacheService', () => {
  beforeEach(async () => {
    await cacheService.del('test:key');
  });

  test('should set and get value', async () => {
    await cacheService.set('test:key', { foo: 'bar' }, 60);
    const value = await cacheService.get('test:key');
    expect(value).toEqual({ foo: 'bar' });
  });

  test('should return null for non-existent key', async () => {
    const value = await cacheService.get('non:existent');
    expect(value).toBeNull();
  });

  test('should delete key', async () => {
    await cacheService.set('test:key', 'value', 60);
    await cacheService.del('test:key');
    const value = await cacheService.get('test:key');
    expect(value).toBeNull();
  });

  test('should use getOrSet pattern', async () => {
    const fetchFn = jest.fn(() => Promise.resolve({ data: 'fetched' }));
    
    // Первый вызов - fetch
    const result1 = await cacheService.getOrSet('test:key', fetchFn, 60);
    expect(result1).toEqual({ data: 'fetched' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    
    // Второй вызов - из кэша
    const result2 = await cacheService.getOrSet('test:key', fetchFn, 60);
    expect(result2).toEqual({ data: 'fetched' });
    expect(fetchFn).toHaveBeenCalledTimes(1); // не вызывается повторно
  });
});
```

## Критерии приёмки
- [ ] Redis client настроен
- [ ] Cache middleware реализован
- [ ] CacheService создан с методами get/set/del
- [ ] Кэширование применено к API endpoints
- [ ] Session storage использует Redis
- [ ] Rate limiting использует Redis
- [ ] Инвалидация кэша работает
- [ ] Мониторинг Redis доступен
- [ ] Тесты для cache service написаны
- [ ] Документация обновлена

## Зависимости
- Задача 01-docker-compose

## Приоритет
Высокий (P1)

## Оценка времени
2-3 дня

## Примечания
Redis значительно улучшает производительность за счет кэширования часто запрашиваемых данных и снижения нагрузки на PostgreSQL.

