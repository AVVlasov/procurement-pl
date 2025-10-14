# Задача: Схема базы данных PostgreSQL

## Описание
Создание полной схемы базы данных со всеми таблицами, связями, индексами и миграциями.

## Цель
Реализовать структуру данных для хранения информации о компаниях, пользователях, продуктах, заявках, отзывах и сообщениях.

## Технические требования

### 1. Настройка Knex.js (knexfile.js)
```javascript
import dotenv from 'dotenv';
dotenv.config();

export default {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'b2b_platform',
      user: process.env.DB_USER || 'b2b_user',
      password: process.env.DB_PASSWORD,
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
    connection: process.env.DATABASE_URL,
    pool: {
      min: 5,
      max: 30,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations',
    },
  },
};
```

### 2. Миграция: Users
```javascript
// migrations/001_create_users_table.js
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['user', 'admin', 'moderator']).defaultTo('user');
    table.boolean('email_verified').defaultTo(false);
    table.string('verification_token', 255);
    table.timestamp('verification_token_expires');
    table.string('reset_password_token', 255);
    table.timestamp('reset_password_expires');
    table.timestamp('last_login');
    table.timestamps(true, true);
    
    table.index('email');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('users');
}
```

### 3. Миграция: Companies
```javascript
// migrations/002_create_companies_table.js
export async function up(knex) {
  await knex.schema.createTable('companies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Основная информация
    table.string('inn', 12).notNullable().unique();
    table.string('ogrn', 15).notNullable();
    table.string('full_name', 500).notNullable();
    table.string('short_name', 255);
    table.string('legal_form', 50).notNullable();
    
    // Отраслевая информация
    table.string('industry', 100).notNullable();
    table.enum('company_size', ['1-10', '11-50', '51-250', '251-500', '500+']).notNullable();
    table.enum('revenue_range', ['up_to_60m', '60m_to_120m', '120m_to_2b', 'over_2b']);
    
    // Контактная информация
    table.string('website', 500);
    table.string('phone', 50);
    table.string('email', 255);
    
    // Дополнительная информация
    table.string('logo_url', 500);
    table.integer('foundation_year');
    table.text('slogan');
    table.text('description');
    
    // Верификация
    table.boolean('verified').defaultTo(false);
    table.timestamp('verified_at');
    table.jsonb('fns_data'); // Данные от API ФНС
    
    // Метаданные
    table.integer('view_count').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index('inn');
    table.index('industry');
    table.index('company_size');
    table.index('verified');
    table.index('user_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('companies');
}
```

### 4. Миграция: Contact Persons
```javascript
// migrations/003_create_contact_persons_table.js
export async function up(knex) {
  await knex.schema.createTable('contact_persons', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('middle_name', 100);
    table.string('position', 200).notNullable();
    table.string('phone', 50).notNullable();
    table.string('email', 255).notNullable();
    
    table.boolean('is_primary').defaultTo(false);
    table.boolean('is_legal_contact').defaultTo(false);
    
    table.timestamps(true, true);
    
    table.index('company_id');
    table.index(['company_id', 'is_primary']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('contact_persons');
}
```

### 5. Миграция: Company Addresses
```javascript
// migrations/004_create_company_addresses_table.js
export async function up(knex) {
  await knex.schema.createTable('company_addresses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.enum('type', ['legal', 'actual']).notNullable();
    table.string('country', 100).defaultTo('Россия');
    table.string('region', 200);
    table.string('city', 200);
    table.string('street', 300);
    table.string('building', 50);
    table.string('office', 50);
    table.string('postal_code', 20);
    table.text('full_address').notNullable();
    
    table.timestamps(true, true);
    
    table.index('company_id');
    table.unique(['company_id', 'type']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('company_addresses');
}
```

### 6. Миграция: Bank Details
```javascript
// migrations/005_create_bank_details_table.js
export async function up(knex) {
  await knex.schema.createTable('bank_details', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.string('bank_name', 300).notNullable();
    table.string('bik', 9).notNullable();
    table.string('account_number', 20).notNullable();
    table.string('correspondent_account', 20).notNullable();
    
    table.boolean('is_visible').defaultTo(false); // Скрыто по умолчанию
    table.boolean('is_primary').defaultTo(true);
    
    table.timestamps(true, true);
    
    table.index('company_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('bank_details');
}
```

### 7. Миграция: Products/Services Offered
```javascript
// migrations/006_create_products_services_offered_table.js
export async function up(knex) {
  await knex.schema.createTable('products_services_offered', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.string('name', 300).notNullable();
    table.string('category', 100).notNullable();
    table.text('description');
    table.string('website_link', 500);
    table.string('pdf_url', 500); // Коммерческое предложение
    
    // Для AI семантического поиска
    table.specificType('embedding', 'vector(1536)'); // OpenAI embeddings
    
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index('company_id');
    table.index('category');
    table.index('is_active');
  });
  
  // Создание GIN индекса для полнотекстового поиска
  await knex.raw(`
    CREATE INDEX products_offered_search_idx ON products_services_offered 
    USING GIN (to_tsvector('russian', name || ' ' || COALESCE(description, '')))
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('products_services_offered');
}
```

### 8. Миграция: Products/Services Needed
```javascript
// migrations/007_create_products_services_needed_table.js
export async function up(knex) {
  await knex.schema.createTable('products_services_needed', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.string('name', 300).notNullable();
    table.string('category', 100).notNullable();
    table.text('description');
    
    // Для AI семантического поиска
    table.specificType('embedding', 'vector(1536)');
    
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index('company_id');
    table.index('category');
    table.index('is_active');
  });
  
  await knex.raw(`
    CREATE INDEX products_needed_search_idx ON products_services_needed 
    USING GIN (to_tsvector('russian', name || ' ' || COALESCE(description, '')))
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('products_services_needed');
}
```

### 9. Миграция: Procurement Requests
```javascript
// migrations/008_create_procurement_requests_table.js
export async function up(knex) {
  await knex.schema.createTable('procurement_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.string('title', 500).notNullable();
    table.text('description').notNullable();
    table.string('category', 100);
    table.decimal('budget', 15, 2);
    table.date('deadline');
    
    table.enum('status', [
      'draft',
      'published',
      'in_progress',
      'completed',
      'cancelled'
    ]).defaultTo('draft');
    
    table.integer('view_count').defaultTo(0);
    table.integer('response_count').defaultTo(0);
    
    table.timestamps(true, true);
    
    table.index('company_id');
    table.index('status');
    table.index('category');
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('procurement_requests');
}
```

### 10. Миграция: Procurement Attachments
```javascript
// migrations/009_create_procurement_attachments_table.js
export async function up(knex) {
  await knex.schema.createTable('procurement_attachments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('request_id').notNullable().references('id').inTable('procurement_requests').onDelete('CASCADE');
    
    table.enum('file_type', ['tz', 'contract', 'questionnaire', 'other']).notNullable();
    table.string('file_name', 500).notNullable();
    table.string('file_path', 1000).notNullable();
    table.string('mime_type', 100);
    table.integer('file_size');
    
    table.text('ai_summary'); // AI анализ документа
    table.jsonb('ai_extracted_data'); // Извлеченные данные
    
    table.timestamps(true, true);
    
    table.index('request_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('procurement_attachments');
}
```

### 11. Остальные таблицы (продолжение в следующем файле)

Файл слишком большой. Создам файлы для остальных таблиц отдельно.

## Критерии приёмки
- [ ] Все миграции созданы и работают
- [ ] Knex.js настроен правильно
- [ ] Все таблицы имеют необходимые индексы
- [ ] Foreign keys настроены с правильными ON DELETE
- [ ] pgvector расширение используется для embeddings
- [ ] Полнотекстовый поиск настроен для русского языка
- [ ] Можно запустить миграции и откатить их
- [ ] Seed данные для тестирования созданы

## Зависимости
- Задача 02-docker-compose (PostgreSQL должен быть запущен)

## Приоритет
Критический (P0)

## Оценка времени
6-8 часов

