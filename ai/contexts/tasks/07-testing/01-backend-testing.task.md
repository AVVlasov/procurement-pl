# Задача: Backend тестирование

## Описание
Написание unit и integration тестов для Backend API с покрытием >80%.

## Цель
Обеспечить надежность и качество Backend кода через автоматизированное тестирование.

## Технические требования

### 1. Настройка Jest (package.json)
```json
{
  "scripts": {
    "test": "NODE_ENV=test jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/"],
    "testMatch": ["**/__tests__/**/*.test.js"],
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/index.js",
      "!src/database/migrations/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### 2. tests/setup.js
```javascript
import { db } from '../src/config/database.js';

beforeAll(async () => {
  // Запуск миграций для тестовой БД
  await db.migrate.latest();
});

afterAll(async () => {
  // Откат миграций и закрытие подключения
  await db.migrate.rollback(null, true);
  await db.destroy();
});

beforeEach(async () => {
  // Очистка таблиц перед каждым тестом
  await db('users').del();
  await db('companies').del();
});
```

### 3. tests/unit/services/authService.test.js
```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../../../src/config/database.js';
import { authController } from '../../../src/controllers/authController.js';

describe('Auth Service', () => {
  describe('register', () => {
    it('should create a new user and company', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        inn: '1234567890',
        ogrn: '1234567890123',
        fullName: 'Test Company LLC',
        legalForm: 'ООО',
        industry: 'IT',
        companySize: '11-50',
        website: 'https://example.com',
        firstName: 'John',
        lastName: 'Doe',
        position: 'Director',
        phone: '+79991234567',
        agreeToTerms: true,
      };

      const req = { body: userData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();

      const user = await db('users').where({ email: userData.email }).first();
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should reject duplicate email', async () => {
      // Создание пользователя
      await db('users').insert({
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password', 10),
      });

      const req = {
        body: {
          email: 'test@example.com',
          password: 'Password123',
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(409);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const password = 'Password123';
      const passwordHash = await bcrypt.hash(password, 10);

      const [user] = await db('users').insert({
        email: 'test@example.com',
        password_hash: passwordHash,
      }).returning('*');

      const req = {
        body: {
          email: 'test@example.com',
          password,
        },
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.tokens).toBeDefined();
      expect(response.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const req = {
        body: {
          email: 'wrong@example.com',
          password: 'wrong',
        },
      };
      const res = { json: jest.fn() };
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });
  });
});
```

### 4. tests/integration/api/companies.test.js
```javascript
import request from 'supertest';
import app from '../../../src/app.js';
import { db } from '../../../src/config/database.js';

describe('Companies API', () => {
  let authToken;
  let userId;
  let companyId;

  beforeAll(async () => {
    // Создание тестового пользователя и компании
    const [user] = await db('users').insert({
      email: 'test@example.com',
      password_hash: 'hash',
    }).returning('*');
    userId = user.id;

    const [company] = await db('companies').insert({
      user_id: userId,
      inn: '1234567890',
      ogrn: '1234567890123',
      full_name: 'Test Company',
      legal_form: 'ООО',
      industry: 'IT',
      company_size: '11-50',
      website: 'https://example.com',
    }).returning('*');
    companyId = company.id;

    // Получение токена
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123',
      });
    
    authToken = loginRes.body.tokens.accessToken;
  });

  describe('GET /api/companies/:id', () => {
    it('should get company profile', async () => {
      const res = await request(app)
        .get(`/api/companies/${companyId}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', companyId);
      expect(res.body).toHaveProperty('full_name', 'Test Company');
    });

    it('should return 404 for non-existent company', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/companies/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('should update company profile', async () => {
      const res = await request(app)
        .put(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slogan: 'New slogan',
          description: 'New description',
        })
        .expect(200);

      expect(res.body.company).toHaveProperty('slogan', 'New slogan');
    });

    it('should reject unauthorized update', async () => {
      await request(app)
        .put(`/api/companies/${companyId}`)
        .send({ slogan: 'New slogan' })
        .expect(401);
    });
  });

  describe('PATCH /api/companies/:id/logo', () => {
    it('should upload logo', async () => {
      const res = await request(app)
        .patch(`/api/companies/${companyId}/logo`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('logo', Buffer.from('fake image'), 'logo.png')
        .expect(200);

      expect(res.body).toHaveProperty('logoUrl');
    });
  });
});
```

### 5. tests/integration/api/search.test.js
```javascript
import request from 'supertest';
import app from '../../../src/app.js';
import { db } from '../../../src/config/database.js';

describe('Search API', () => {
  beforeAll(async () => {
    // Создание тестовых компаний
    await db('companies').insert([
      {
        inn: '1111111111',
        ogrn: '1111111111111',
        full_name: 'IT Company 1',
        legal_form: 'ООО',
        industry: 'IT',
        company_size: '11-50',
        website: 'https://it1.com',
        user_id: null,
      },
      {
        inn: '2222222222',
        ogrn: '2222222222222',
        full_name: 'Finance Company 2',
        legal_form: 'АО',
        industry: 'Finance',
        company_size: '51-250',
        website: 'https://finance2.com',
        user_id: null,
      },
    ]);
  });

  describe('POST /api/search/companies', () => {
    it('should search companies by industry', async () => {
      const res = await request(app)
        .post('/api/search/companies')
        .send({
          filters: {
            industry: 'IT',
          },
        })
        .expect(200);

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].industry).toBe('IT');
    });

    it('should search companies by size', async () => {
      const res = await request(app)
        .post('/api/search/companies')
        .send({
          filters: {
            company_size: '51-250',
          },
        })
        .expect(200);

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].company_size).toBe('51-250');
    });
  });
});
```

### 6. tests/unit/middlewares/auth.test.js
```javascript
import { authenticate } from '../../../src/middlewares/auth.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  it('should authenticate valid token', async () => {
    const userId = 'test-user-id';
    const token = jwt.sign({ userId }, process.env.JWT_SECRET);

    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const res = {};
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(userId);
    expect(next).toHaveBeenCalled();
  });

  it('should reject invalid token', async () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    };
    const res = {};
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  it('should reject missing token', async () => {
    const req = {
      headers: {},
    };
    const res = {};
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });
});
```

## Критерии приёмки
- [ ] Jest настроен и работает
- [ ] Unit тесты для контроллеров написаны
- [ ] Unit тесты для сервисов написаны
- [ ] Unit тесты для middleware написаны
- [ ] Integration тесты для API endpoints написаны
- [ ] Покрытие тестами >80%
- [ ] Все тесты проходят успешно
- [ ] CI/CD запускает тесты автоматически

## Зависимости
- Все backend задачи должны быть завершены

## Приоритет
Высокий (P1)

## Оценка времени
12-16 часов

