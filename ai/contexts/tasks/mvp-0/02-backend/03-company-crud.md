# Задача: CRUD для компаний (MVP 0)

## Описание
Базовые операции для профилей компаний: просмотр и редактирование.

## Цель
Позволить пользователям просматривать и редактировать профили компаний.

## Технические требования

### 1. src/controllers/companyController.js
```javascript
import { query } from '../db.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const companyController = {
  // Получение компании по ID
  async getCompany(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `SELECT c.*, u.email as user_email
         FROM companies c
         JOIN users u ON c.user_id = u.id
         WHERE c.id = $1 AND c.is_active = true`,
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Company not found');
      }
      
      const company = result.rows[0];
      
      // Получение продуктов/услуг
      const productsResult = await query(
        `SELECT * FROM products_services 
         WHERE company_id = $1 AND is_active = true 
         ORDER BY created_at DESC`,
        [id]
      );
      
      res.json({
        company,
        products: productsResult.rows,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Обновление компании
  async updateCompany(req, res, next) {
    try {
      const { id } = req.params;
      const { description, website, phone, email } = req.body;
      
      // Проверка, что пользователь владеет компанией
      if (req.company.id !== id) {
        throw new ValidationError('You can only update your own company');
      }
      
      // Обновление только разрешенных полей
      const result = await query(
        `UPDATE companies 
         SET description = COALESCE($1, description),
             website = COALESCE($2, website),
             phone = COALESCE($3, phone),
             email = COALESCE($4, email),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [description, website, phone, email, id]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Company not found');
      }
      
      res.json({
        message: 'Company updated successfully',
        company: result.rows[0],
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Поиск компаний (простой, без AI)
  async searchCompanies(req, res, next) {
    try {
      const { q, limit = 20, offset = 0 } = req.query;
      
      if (!q || q.trim().length === 0) {
        // Вернуть все компании, если нет запроса
        const result = await query(
          `SELECT id, full_name, inn, description, website
           FROM companies
           WHERE is_active = true
           ORDER BY created_at DESC
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );
        
        return res.json({
          companies: result.rows,
          total: result.rows.length,
          query: null,
        });
      }
      
      // Полнотекстовый поиск
      const result = await query(
        `SELECT id, full_name, inn, description, website,
                ts_rank(to_tsvector('russian', full_name || ' ' || COALESCE(description, '')), 
                        plainto_tsquery('russian', $1)) as rank
         FROM companies
         WHERE is_active = true
           AND to_tsvector('russian', full_name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('russian', $1)
         ORDER BY rank DESC, created_at DESC
         LIMIT $2 OFFSET $3`,
        [q, limit, offset]
      );
      
      res.json({
        companies: result.rows,
        total: result.rows.length,
        query: q,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Получение своей компании
  async getMyCompany(req, res, next) {
    try {
      if (!req.company) {
        throw new NotFoundError('You have not created a company yet');
      }
      
      const result = await query(
        'SELECT * FROM companies WHERE id = $1',
        [req.company.id]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Company not found');
      }
      
      // Получение продуктов/услуг
      const productsResult = await query(
        `SELECT * FROM products_services 
         WHERE company_id = $1 
         ORDER BY created_at DESC`,
        [req.company.id]
      );
      
      const products = {
        offered: productsResult.rows.filter(p => p.type === 'offered'),
        needed: productsResult.rows.filter(p => p.type === 'needed'),
      };
      
      res.json({
        company: result.rows[0],
        products,
      });
      
    } catch (error) {
      next(error);
    }
  },
};
```

### 2. Обновление src/routes/companies.js
```javascript
import express from 'express';
import { companyController } from '../controllers/companyController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Публичные endpoints
router.get('/search', companyController.searchCompanies);
router.get('/:id', companyController.getCompany);

// Защищенные endpoints
router.get('/my/profile', authenticate, companyController.getMyCompany);
router.put('/:id', authenticate, companyController.updateCompany);

export default router;
```

### 3. Тестирование

Создать файл `backend/test-companies.http`:
```http
### Поиск компаний (без токена)
GET http://localhost:3000/api/companies/search?q=IT

### Поиск всех компаний
GET http://localhost:3000/api/companies/search

### Получение компании по ID
GET http://localhost:3000/api/companies/COMPANY_ID_HERE

### Получение своей компании (с токеном)
GET http://localhost:3000/api/companies/my/profile
Authorization: Bearer YOUR_TOKEN_HERE

### Обновление компании
PUT http://localhost:3000/api/companies/COMPANY_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "description": "Мы предоставляем лучшие IT услуги",
  "website": "https://example.com",
  "phone": "+7 (999) 123-45-67",
  "email": "info@example.com"
}
```

## Критерии приёмки
- [ ] GET /api/companies/:id возвращает данные компании
- [ ] GET /api/companies/my/profile возвращает профиль текущего пользователя
- [ ] PUT /api/companies/:id обновляет компанию
- [ ] Пользователь может обновлять только свою компанию
- [ ] GET /api/companies/search работает с параметром q
- [ ] Полнотекстовый поиск работает на русском языке
- [ ] Возвращаются только активные компании

## Зависимости
- Задача 02-auth-simple
- Задача 02-postgres-local-setup

## Приоритет
Критический (P0)

## Оценка времени
2 часа

## Примеры использования

### Получение компании
```javascript
const response = await fetch(`http://localhost:3000/api/companies/${companyId}`);
const data = await response.json();
// data.company и data.products
```

### Обновление компании
```javascript
const token = localStorage.getItem('token');
const response = await fetch(`http://localhost:3000/api/companies/${companyId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    description: 'Новое описание компании',
    website: 'https://example.com',
  }),
});
```

### Поиск компаний
```javascript
const response = await fetch('http://localhost:3000/api/companies/search?q=программное+обеспечение');
const data = await response.json();
// data.companies - массив найденных компаний
```


