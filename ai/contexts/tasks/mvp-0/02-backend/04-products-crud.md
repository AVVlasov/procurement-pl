# Задача: CRUD для продуктов/услуг (MVP 0)

## Описание
Операции для управления списками "Я ПРОДАЮ" и "Я ПОКУПАЮ".

## Цель
Позволить компаниям добавлять, редактировать и удалять свои продукты/услуги.

## Технические требования

### 1. src/controllers/productController.js
```javascript
import { query } from '../db.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const productController = {
  // Получение всех продуктов компании
  async getCompanyProducts(req, res, next) {
    try {
      const { companyId } = req.params;
      const { type } = req.query; // 'offered' или 'needed'
      
      let queryText = `
        SELECT * FROM products_services 
        WHERE company_id = $1 AND is_active = true
      `;
      const params = [companyId];
      
      if (type) {
        queryText += ' AND type = $2';
        params.push(type);
      }
      
      queryText += ' ORDER BY created_at DESC';
      
      const result = await query(queryText, params);
      
      res.json({
        products: result.rows,
        total: result.rows.length,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Создание продукта/услуги
  async createProduct(req, res, next) {
    try {
      const { type, name, description } = req.body;
      
      // Валидация
      if (!type || !['offered', 'needed'].includes(type)) {
        throw new ValidationError('Type must be "offered" or "needed"');
      }
      
      if (!name || name.trim().length === 0) {
        throw new ValidationError('Name is required');
      }
      
      if (!req.company) {
        throw new ValidationError('You must have a company to create products');
      }
      
      const result = await query(
        `INSERT INTO products_services (company_id, type, name, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.company.id, type, name.trim(), description?.trim() || null]
      );
      
      res.status(201).json({
        message: 'Product created successfully',
        product: result.rows[0],
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Обновление продукта
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      // Проверка, что продукт принадлежит компании пользователя
      const checkResult = await query(
        'SELECT company_id FROM products_services WHERE id = $1',
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Product not found');
      }
      
      if (checkResult.rows[0].company_id !== req.company.id) {
        throw new ValidationError('You can only update your own products');
      }
      
      // Обновление
      const result = await query(
        `UPDATE products_services
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [name?.trim(), description?.trim(), id]
      );
      
      res.json({
        message: 'Product updated successfully',
        product: result.rows[0],
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Удаление продукта (мягкое удаление)
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      
      // Проверка владения
      const checkResult = await query(
        'SELECT company_id FROM products_services WHERE id = $1',
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Product not found');
      }
      
      if (checkResult.rows[0].company_id !== req.company.id) {
        throw new ValidationError('You can only delete your own products');
      }
      
      // Мягкое удаление
      await query(
        'UPDATE products_services SET is_active = false WHERE id = $1',
        [id]
      );
      
      res.json({
        message: 'Product deleted successfully',
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  // Получение своих продуктов
  async getMyProducts(req, res, next) {
    try {
      if (!req.company) {
        return res.json({
          offered: [],
          needed: [],
        });
      }
      
      const result = await query(
        `SELECT * FROM products_services 
         WHERE company_id = $1 AND is_active = true
         ORDER BY created_at DESC`,
        [req.company.id]
      );
      
      const products = {
        offered: result.rows.filter(p => p.type === 'offered'),
        needed: result.rows.filter(p => p.type === 'needed'),
      };
      
      res.json(products);
      
    } catch (error) {
      next(error);
    }
  },
  
  // Поиск по продуктам (простой)
  async searchProducts(req, res, next) {
    try {
      const { q, type, limit = 50 } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.json({
          products: [],
          total: 0,
        });
      }
      
      let queryText = `
        SELECT ps.*, c.full_name as company_name, c.id as company_id
        FROM products_services ps
        JOIN companies c ON ps.company_id = c.id
        WHERE ps.is_active = true AND c.is_active = true
          AND to_tsvector('russian', ps.name || ' ' || COALESCE(ps.description, '')) @@ plainto_tsquery('russian', $1)
      `;
      const params = [q];
      
      if (type) {
        queryText += ' AND ps.type = $2';
        params.push(type);
      }
      
      queryText += ` ORDER BY ts_rank(
        to_tsvector('russian', ps.name || ' ' || COALESCE(ps.description, '')),
        plainto_tsquery('russian', $1)
      ) DESC LIMIT ${parseInt(limit)}`;
      
      const result = await query(queryText, params);
      
      res.json({
        products: result.rows,
        total: result.rows.length,
        query: q,
      });
      
    } catch (error) {
      next(error);
    }
  },
};
```

### 2. Обновление src/routes/products.js
```javascript
import express from 'express';
import { productController } from '../controllers/productController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Публичные endpoints
router.get('/search', productController.searchProducts);
router.get('/company/:companyId', productController.getCompanyProducts);

// Защищенные endpoints
router.get('/my', authenticate, productController.getMyProducts);
router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

export default router;
```

### 3. Тестирование

Создать файл `backend/test-products.http`:
```http
### Создание продукта "Я ПРОДАЮ"
POST http://localhost:3000/api/products
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "type": "offered",
  "name": "Разработка веб-приложений",
  "description": "Создаем современные веб-приложения на React и Node.js"
}

### Создание потребности "Я ПОКУПАЮ"
POST http://localhost:3000/api/products
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "type": "needed",
  "name": "Серверное оборудование",
  "description": "Ищем поставщика серверов Dell PowerEdge"
}

### Получение своих продуктов
GET http://localhost:3000/api/products/my
Authorization: Bearer YOUR_TOKEN_HERE

### Получение продуктов компании
GET http://localhost:3000/api/products/company/COMPANY_ID_HERE

### Получение только "Я ПРОДАЮ"
GET http://localhost:3000/api/products/company/COMPANY_ID_HERE?type=offered

### Обновление продукта
PUT http://localhost:3000/api/products/PRODUCT_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "name": "Обновленное название",
  "description": "Обновленное описание"
}

### Удаление продукта
DELETE http://localhost:3000/api/products/PRODUCT_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE

### Поиск продуктов
GET http://localhost:3000/api/products/search?q=разработка&type=offered
```

## Критерии приёмки
- [ ] POST /api/products создает продукт/услугу
- [ ] GET /api/products/my возвращает продукты текущей компании
- [ ] GET /api/products/company/:id возвращает продукты указанной компании
- [ ] PUT /api/products/:id обновляет продукт
- [ ] DELETE /api/products/:id удаляет продукт (мягкое удаление)
- [ ] Пользователь может управлять только своими продуктами
- [ ] GET /api/products/search ищет по названию и описанию
- [ ] Фильтрация по type (offered/needed) работает

## Зависимости
- Задача 02-auth-simple
- Задача 03-company-crud
- Задача 02-postgres-local-setup

## Приоритет
Критический (P0)

## Оценка времени
2-3 часа

## Примеры использования

### Создание продукта
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    type: 'offered',
    name: 'IT Консалтинг',
    description: 'Консультации по вопросам цифровой трансформации',
  }),
});
```

### Получение своих продуктов
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:3000/api/products/my', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
const data = await response.json();
// data.offered - массив продуктов "Я ПРОДАЮ"
// data.needed - массив потребностей "Я ПОКУПАЮ"
```

### Поиск продуктов
```javascript
const response = await fetch('http://localhost:3000/api/products/search?q=программное+обеспечение&type=offered');
const data = await response.json();
// data.products - массив найденных продуктов
```


