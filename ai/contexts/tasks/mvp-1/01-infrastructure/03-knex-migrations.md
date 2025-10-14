# Задача: Миграции БД через Knex.js (MVP 1)

## Описание
Переход от ручных SQL скриптов к управляемым миграциям БД через Knex.js.

## Цель
Обеспечить версионирование схемы БД, упростить развертывание и откат изменений.

## Технические требования

### 1. Установка зависимостей

```bash
cd backend
npm install knex pg
npm install -D @types/knex
```

### 2. Knex configuration

**backend/knexfile.js**
```javascript
require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'b2b_platform_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },

  staging: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/database/seeds',
    },
  },
};
```

### 3. Database connection

**backend/src/database/connection.js**
```javascript
const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

// Проверка подключения
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connected');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

module.exports = db;
```

### 4. Миграции

**backend/src/database/migrations/20250101000001_create_users_table.js**
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('email');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
```

**backend/src/database/migrations/20250101000002_create_companies_table.js**
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('companies', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('full_name', 500).notNullable();
    table.string('inn', 10).notNullable().unique();
    table.string('kpp', 9);
    table.string('ogrn', 13);
    table.text('description');
    table.string('industry', 100);
    table.string('website', 255);
    table.string('phone', 20);
    table.string('email', 255);
    table.text('address');
    table.text('legal_address');
    table.string('city', 100);
    table.date('registration_date');
    table.integer('employee_count');
    
    // Банковские реквизиты
    table.string('bank_name', 255);
    table.string('bik', 9);
    table.string('checking_account', 20);
    table.string('correspondent_account', 20);
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Внешние ключи
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Индексы
    table.index('inn');
    table.index('user_id');
    table.index('industry');
    table.index('city');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('companies');
};
```

**backend/src/database/migrations/20250101000003_create_products_table.js**
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.integer('company_id').unsigned().notNullable();
    table.enum('type', ['offered', 'needed']).notNullable();
    table.string('name', 500).notNullable();
    table.text('description');
    table.decimal('price', 15, 2);
    table.string('price_unit', 50);
    table.specificType('tags', 'text[]');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Внешние ключи
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');
    
    // Индексы
    table.index('company_id');
    table.index('type');
    table.index(['company_id', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('products');
};
```

**backend/src/database/migrations/20250101000004_create_search_history_table.js**
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('search_history', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.text('query').notNullable();
    table.integer('results_count');
    table.jsonb('results');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Внешние ключи
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Индексы
    table.index('user_id');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('search_history');
};
```

**backend/src/database/migrations/20250101000005_create_recommendations_table.js**
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('recommendations', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('recommended_company_id').unsigned().notNullable();
    table.decimal('match_score', 5, 2).notNullable();
    table.text('reason');
    table.specificType('matched_needs', 'text[]');
    table.boolean('dismissed').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');
    
    // Внешние ключи
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('recommended_company_id').references('id').inTable('companies').onDelete('CASCADE');
    
    // Индексы
    table.index('user_id');
    table.index('recommended_company_id');
    table.index(['user_id', 'dismissed']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('recommendations');
};
```

**backend/src/database/migrations/20250101000006_create_company_stats_table.js**
```javascript
exports.up = function(knex) {
  return knex.schema.createTable('company_stats', (table) => {
    table.integer('company_id').unsigned().primary();
    table.integer('views').defaultTo(0);
    table.integer('contact_clicks').defaultTo(0);
    table.integer('search_appearances').defaultTo(0);
    table.integer('favorites').defaultTo(0);
    table.timestamp('last_viewed_at');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Внешние ключи
    table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('company_stats');
};
```

**backend/src/database/migrations/20250101000007_add_pgvector_extension.js**
```javascript
exports.up = async function(knex) {
  // Добавить расширение pgvector для векторного поиска
  await knex.raw('CREATE EXTENSION IF NOT EXISTS vector');
  
  // Добавить колонку embeddings в companies
  await knex.schema.table('companies', (table) => {
    table.specificType('embedding', 'vector(1536)');
  });
  
  // Добавить колонку embeddings в products
  await knex.schema.table('products', (table) => {
    table.specificType('embedding', 'vector(1536)');
  });
  
  // Создать индексы для векторного поиска
  await knex.raw('CREATE INDEX companies_embedding_idx ON companies USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
  await knex.raw('CREATE INDEX products_embedding_idx ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
};

exports.down = async function(knex) {
  await knex.schema.table('companies', (table) => {
    table.dropColumn('embedding');
  });
  
  await knex.schema.table('products', (table) => {
    table.dropColumn('embedding');
  });
  
  await knex.raw('DROP EXTENSION IF EXISTS vector');
};
```

### 5. Seeds (тестовые данные)

**backend/src/database/seeds/01_users.js**
```javascript
const bcrypt = require('bcrypt');

exports.seed = async function(knex) {
  // Очистить таблицы
  await knex('users').del();
  
  const passwordHash = await bcrypt.hash('demo123', 10);
  
  // Вставить тестовых пользователей
  await knex('users').insert([
    {
      id: 1,
      email: 'demo@example.com',
      password_hash: passwordHash,
      role: 'user',
    },
    {
      id: 2,
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'admin',
    },
  ]);
};
```

**backend/src/database/seeds/02_companies.js**
```javascript
exports.seed = async function(knex) {
  await knex('companies').del();
  
  await knex('companies').insert([
    {
      id: 1,
      user_id: 1,
      full_name: 'ООО "Технологии Будущего"',
      inn: '1234567890',
      description: 'Разработка программного обеспечения',
      industry: 'IT и технологии',
      website: 'https://example.com',
      phone: '+7 (999) 123-45-67',
      email: 'info@example.com',
      city: 'Москва',
    },
    {
      id: 2,
      user_id: 2,
      full_name: 'ООО "Промышленные решения"',
      inn: '9876543210',
      description: 'Производство промышленного оборудования',
      industry: 'Производство',
      website: 'https://promresheniya.ru',
      city: 'Санкт-Петербург',
    },
  ]);
};
```

**backend/src/database/seeds/03_products.js**
```javascript
exports.seed = async function(knex) {
  await knex('products').del();
  
  await knex('products').insert([
    {
      company_id: 1,
      type: 'offered',
      name: 'Разработка веб-приложений',
      description: 'Создание современных веб-приложений на React и Node.js',
      price: 500000,
      price_unit: 'проект',
      tags: ['web', 'react', 'nodejs'],
    },
    {
      company_id: 1,
      type: 'needed',
      name: 'Офисное помещение',
      description: 'Аренда офиса в центре Москвы, 100+ кв.м.',
      tags: ['недвижимость', 'офис'],
    },
    {
      company_id: 2,
      type: 'offered',
      name: 'Промышленные станки',
      description: 'Производство и поставка станков с ЧПУ',
      price: 2000000,
      price_unit: 'шт',
      tags: ['оборудование', 'станки'],
    },
  ]);
};
```

### 6. NPM Scripts

**backend/package.json**
```json
{
  "scripts": {
    "migrate:make": "knex migrate:make",
    "migrate:latest": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback",
    "migrate:status": "knex migrate:status",
    "seed:make": "knex seed:make",
    "seed:run": "knex seed:run",
    "db:reset": "npm run migrate:rollback --all && npm run migrate:latest && npm run seed:run"
  }
}
```

### 7. Обновление моделей

**backend/src/models/User.js**
```javascript
const db = require('../database/connection');
const bcrypt = require('bcrypt');

class User {
  static async create(userData) {
    const { email, password, role = 'user' } = userData;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [user] = await db('users')
      .insert({
        email,
        password_hash: passwordHash,
        role,
      })
      .returning('*');
    
    return user;
  }

  static async findById(id) {
    return await db('users').where({ id }).first();
  }

  static async findByEmail(email) {
    return await db('users').where({ email }).first();
  }

  static async update(id, data) {
    const [user] = await db('users')
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now(),
      })
      .returning('*');
    
    return user;
  }

  static async delete(id) {
    return await db('users').where({ id }).del();
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }
}

module.exports = User;
```

**backend/src/models/Company.js**
```javascript
const db = require('../database/connection');

class Company {
  static async create(companyData) {
    const [company] = await db('companies')
      .insert(companyData)
      .returning('*');
    
    // Создать запись статистики
    await db('company_stats').insert({ company_id: company.id });
    
    return company;
  }

  static async findById(id) {
    return await db('companies').where({ id }).first();
  }

  static async findByUserId(userId) {
    return await db('companies').where({ user_id: userId }).first();
  }

  static async findByInn(inn) {
    return await db('companies').where({ inn }).first();
  }

  static async update(id, data) {
    const [company] = await db('companies')
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now(),
      })
      .returning('*');
    
    return company;
  }

  static async delete(id) {
    return await db('companies').where({ id }).del();
  }

  static async search(query) {
    return await db('companies')
      .where('full_name', 'ilike', `%${query}%`)
      .orWhere('description', 'ilike', `%${query}%`)
      .orWhere('industry', 'ilike', `%${query}%`)
      .limit(20);
  }

  static async incrementViews(id) {
    await db('company_stats')
      .where({ company_id: id })
      .increment('views', 1)
      .update({ last_viewed_at: db.fn.now() });
  }
}

module.exports = Company;
```

### 8. Middleware для инъекции DB

**backend/src/middleware/database.js**
```javascript
const db = require('../database/connection');

function databaseMiddleware(req, res, next) {
  req.db = db;
  next();
}

module.exports = databaseMiddleware;
```

### 9. Graceful shutdown

**backend/src/server.js**
```javascript
const db = require('./database/connection');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await db.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await db.destroy();
  process.exit(0);
});
```

### 10. CI/CD интеграция

**backend/.github/workflows/migrate.yml**
```yaml
name: Database Migrations

on:
  push:
    branches: [main, develop]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Run migrations
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_NAME: ${{ secrets.DB_NAME }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
        run: npm run migrate:latest
        working-directory: ./backend
```

## Критерии приёмки
- [ ] Knex.js установлен и настроен
- [ ] knexfile.js создан для разных окружений
- [ ] Миграции для всех таблиц созданы
- [ ] Seeds для тестовых данных созданы
- [ ] Модели обновлены для работы с Knex
- [ ] NPM scripts для миграций добавлены
- [ ] Расширение pgvector добавлено
- [ ] Индексы для производительности созданы
- [ ] Graceful shutdown реализован
- [ ] Документация обновлена

## Зависимости
- Задача 01-docker-compose
- Задача 02-postgres-local-setup (MVP 0)

## Приоритет
Высокий (P1)

## Оценка времени
2-3 дня

## Инструкции по использованию

### Создание новой миграции
```bash
npm run migrate:make create_new_table
```

### Применение миграций
```bash
npm run migrate:latest
```

### Откат миграции
```bash
npm run migrate:rollback
```

### Проверка статуса
```bash
npm run migrate:status
```

### Создание seed
```bash
npm run seed:make test_data
```

### Запуск seeds
```bash
npm run seed:run
```

### Полный сброс БД
```bash
npm run db:reset
```

## Примечания
Knex.js обеспечивает контроль версий схемы БД и упрощает командную разработку, позволяя разработчикам синхронизировать изменения в структуре базы данных.

