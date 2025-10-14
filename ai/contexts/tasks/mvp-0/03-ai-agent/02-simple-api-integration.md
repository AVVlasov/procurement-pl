# Задача: Простая интеграция AI с Backend (MVP 0)

## Описание
Создание endpoint в backend для проксирования запросов к AI сервису.

## Цель
Позволить frontend обращаться к AI поиску через единый backend API.

## Технические требования

### 1. Backend: src/controllers/searchController.js
```javascript
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const searchController = {
  // AI поиск компаний
  async aiSearch(req, res, next) {
    try {
      const { query } = req.body;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Query is required',
        });
      }
      
      // Запрос к AI сервису
      const response = await axios.post(`${AI_SERVICE_URL}/search`, {
        query: query.trim(),
        filters: req.body.filters || null,
      });
      
      res.json(response.data);
      
    } catch (error) {
      console.error('AI Search error:', error.response?.data || error.message);
      
      if (error.response) {
        // Ошибка от AI сервиса
        return res.status(error.response.status).json({
          error: 'AI service error',
          details: error.response.data,
        });
      }
      
      // Общая ошибка
      next(error);
    }
  },
  
  // Проверка доступности AI сервиса
  async healthCheck(req, res, next) {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000,
      });
      
      res.json({
        ai_service: 'available',
        details: response.data,
      });
      
    } catch (error) {
      res.status(503).json({
        ai_service: 'unavailable',
        error: error.message,
      });
    }
  },
};
```

### 2. Backend: src/routes/search.js
```javascript
import express from 'express';
import { searchController } from '../controllers/searchController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// AI поиск (защищен токеном)
router.post('/ai', authenticate, searchController.aiSearch);

// Проверка доступности AI
router.get('/ai/health', searchController.healthCheck);

export default router;
```

### 3. Обновление Backend: src/app.js
```javascript
import searchRoutes from './routes/search.js';

// Добавить к существующим routes:
app.use('/api/search', searchRoutes);
```

### 4. Backend: Timeout и retry логика
```javascript
// src/utils/ai-client.js
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000, // 30 секунд для AI запросов
});

// Retry логика для отказоустойчивости
export async function searchWithRetry(query, filters = null, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await aiClient.post('/search', {
        query,
        filters,
      });
      
      return response.data;
      
    } catch (error) {
      console.error(`AI search attempt ${attempt + 1} failed:`, error.message);
      lastError = error;
      
      // Подождать перед повтором
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
}
```

Обновить searchController:
```javascript
import { searchWithRetry } from '../utils/ai-client.js';

export const searchController = {
  async aiSearch(req, res, next) {
    try {
      const { query } = req.body;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: 'Query is required',
        });
      }
      
      // Использовать retry логику
      const result = await searchWithRetry(query.trim(), req.body.filters);
      
      res.json(result);
      
    } catch (error) {
      console.error('AI Search error:', error.response?.data || error.message);
      next(error);
    }
  },
};
```

### 5. Тестирование

Создать `backend/test-ai-search.http`:
```http
### Проверка доступности AI сервиса
GET http://localhost:3000/api/search/ai/health

### AI поиск компаний
POST http://localhost:3000/api/search/ai
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "query": "Ищу IT компанию для разработки веб-приложения"
}

### AI поиск с фильтрами (будущее расширение)
POST http://localhost:3000/api/search/ai
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "query": "Поставщик серверного оборудования",
  "filters": {
    "industry": "IT"
  }
}
```

### 6. Обработка ошибок AI сервиса

В `src/app.js` добавить специальную обработку:
```javascript
// Error Handler (обновленный)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Особая обработка ошибок AI сервиса
  if (err.response && err.response.data && err.response.data.detail) {
    return res.status(err.response.status).json({
      error: 'AI service error',
      message: err.response.data.detail,
    });
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});
```

## Критерии приёмки
- [ ] Backend проксирует запросы к AI сервису
- [ ] POST /api/search/ai работает с токеном
- [ ] Результаты от AI возвращаются корректно
- [ ] Retry логика работает при сбоях
- [ ] Health check AI сервиса работает
- [ ] Ошибки AI сервиса обрабатываются правильно
- [ ] Timeout для AI запросов настроен (30 сек)

## Зависимости
- Задача 01-adapt-search-agent
- Задача 02-auth-simple
- Задача 01-express-minimal

## Приоритет
Критический (P0)

## Оценка времени
1-2 часа

## Инструкции по тестированию

1. Запустить AI сервис:
```bash
cd ai-service
source venv/bin/activate
uvicorn app.main:app --reload
```

2. Запустить backend:
```bash
cd backend
npm run dev
```

3. Проверить health check:
```bash
curl http://localhost:3000/api/search/ai/health
```

4. Выполнить поиск (после получения токена):
```bash
# Сначала получить токен
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}' \
  | jq -r '.token')

# Затем выполнить поиск
curl -X POST http://localhost:3000/api/search/ai \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"IT компания"}'
```

## Fallback при недоступности AI

Добавить fallback на обычный поиск:
```javascript
async aiSearch(req, res, next) {
  try {
    const { query } = req.body;
    
    try {
      // Попытка AI поиска
      const result = await searchWithRetry(query.trim(), req.body.filters);
      return res.json(result);
    } catch (aiError) {
      console.warn('AI search failed, falling back to regular search');
      
      // Fallback на обычный поиск
      const fallbackResult = await query(
        `SELECT id, full_name, inn, description, website
         FROM companies
         WHERE is_active = true
           AND to_tsvector('russian', full_name || ' ' || COALESCE(description, '')) 
               @@ plainto_tsquery('russian', $1)
         LIMIT 10`,
        [query.trim()]
      );
      
      return res.json({
        companies: fallbackResult.rows,
        total: fallbackResult.rows.length,
        query: query.trim(),
        mode: 'fallback',
      });
    }
    
  } catch (error) {
    next(error);
  }
}
```


