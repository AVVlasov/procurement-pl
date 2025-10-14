# Задача: Интеграция с API ФНС (MVP 1)

## Описание
Интеграция с открытым API ФНС для автозаполнения данных компании по ИНН.

## Цель
Упростить регистрацию компаний и верифицировать легитимность бизнеса.

## Технические требования

### 1. API Service для ФНС

**src/services/fnsService.js**
```javascript
const axios = require('axios');
const cacheService = require('./cacheService');
const { AppError } = require('../utils/errors');

class FnsService {
  constructor() {
    this.apiUrl = 'https://api-fns.ru/api';
    this.apiKey = process.env.FNS_API_KEY;
  }

  async getCompanyByInn(inn) {
    // Проверка валидности ИНН
    if (!/^\d{10}$/.test(inn)) {
      throw new AppError('Invalid INN format', 400);
    }

    // Кэширование на 7 дней
    const cacheKey = `fns:inn:${inn}`;
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const response = await axios.get(`${this.apiUrl}/search`, {
            params: { q: inn, key: this.apiKey },
            timeout: 10000,
          });

          if (!response.data || response.data.items.length === 0) {
            throw new AppError('Company not found in FNS database', 404);
          }

          const company = response.data.items[0];
          return this.parseCompanyData(company);
        } catch (error) {
          if (error.isOperational) throw error;
          throw new AppError('FNS API error', 503);
        }
      },
      604800 // 7 дней
    );
  }

  parseCompanyData(data) {
    return {
      inn: data.inn,
      kpp: data.kpp,
      ogrn: data.ogrn,
      full_name: data.name?.full_with_opf || data.name?.full,
      legal_address: data.address?.value,
      registration_date: data.state?.registration_date,
      status: data.state?.status,
    };
  }
}

module.exports = new FnsService();
```

### 2. Controller

**src/controllers/fnsController.js**
```javascript
const fnsService = require('../services/fnsService');

class FnsController {
  async checkCompany(req, res, next) {
    try {
      const { inn } = req.params;
      const data = await fnsService.getCompanyByInn(inn);
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FnsController();
```

### 3. Routes

**src/routes/fns.js**
```javascript
const express = require('express');
const router = express.Router();
const fnsController = require('../controllers/fnsController');
const { authenticate } = require('../middleware/auth');

router.get('/check/:inn', authenticate, fnsController.checkCompany);

module.exports = router;
```

## Критерии приёмки
- [ ] FNS API интеграция работает
- [ ] Данные по ИНН получаются и парсятся
- [ ] Кэширование на 7 дней настроено
- [ ] Error handling для недоступности API
- [ ] Валидация ИНН
- [ ] Frontend использует API

## Приоритет
Высокий (P1)

## Оценка времени
2 дня

