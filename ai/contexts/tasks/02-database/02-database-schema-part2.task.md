# Задача: Схема базы данных (часть 2)

## Описание
Продолжение создания схемы БД: Reviews, Messages, Interactions, Platform Goals, Geography и другие вспомогательные таблицы.

## Технические требования

### 1. Миграция: Reviews
```javascript
// migrations/010_create_reviews_table.js
export async function up(knex) {
  await knex.schema.createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('from_company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    table.uuid('to_company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.integer('rating').notNullable().checkBetween([1, 5]);
    table.text('comment');
    
    table.boolean('verified').defaultTo(false); // Проверено, что компании взаимодействовали
    table.boolean('is_visible').defaultTo(true);
    table.boolean('is_moderated').defaultTo(false);
    
    table.timestamps(true, true);
    
    table.index('to_company_id');
    table.index('from_company_id');
    table.index(['to_company_id', 'verified']);
    table.unique(['from_company_id', 'to_company_id']); // Один отзыв от компании к компании
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('reviews');
}
```

### 2. Миграция: Messages
```javascript
// migrations/011_create_messages_table.js
export async function up(knex) {
  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('from_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('to_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('from_company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.uuid('to_company_id').references('id').inTable('companies').onDelete('SET NULL');
    
    table.text('message_text').notNullable();
    table.string('attachment_url', 1000);
    
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    
    table.timestamps(true, true);
    
    table.index('from_user_id');
    table.index('to_user_id');
    table.index(['to_user_id', 'is_read']);
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('messages');
}
```

### 3. Миграция: Company Interactions (для верификации отзывов)
```javascript
// migrations/012_create_company_interactions_table.js
export async function up(knex) {
  await knex.schema.createTable('company_interactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_a_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    table.uuid('company_b_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.enum('interaction_type', [
      'contact_exchange',
      'project',
      'procurement_request',
      'message_exchange'
    ]).notNullable();
    
    table.uuid('reference_id'); // ID связанной записи (заявки, проекта и т.д.)
    
    table.timestamps(true, true);
    
    table.index('company_a_id');
    table.index('company_b_id');
    table.index(['company_a_id', 'company_b_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('company_interactions');
}
```

### 4. Миграция: Platform Goals
```javascript
// migrations/013_create_platform_goals_table.js
export async function up(knex) {
  await knex.schema.createTable('platform_goals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.enum('goal_type', [
      'find_suppliers',
      'find_clients',
      'expand_network',
      'post_tenders',
      'market_research',
      'other'
    ]).notNullable();
    
    table.text('other_description'); // Если goal_type = 'other'
    
    table.timestamps(true, true);
    
    table.index('company_id');
    table.unique(['company_id', 'goal_type']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('platform_goals');
}
```

### 5. Миграция: Partner Industries
```javascript
// migrations/014_create_partner_industries_table.js
export async function up(knex) {
  await knex.schema.createTable('partner_industries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.string('industry', 100).notNullable();
    
    table.timestamps(true, true);
    
    table.index('company_id');
    table.index('industry');
    table.unique(['company_id', 'industry']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('partner_industries');
}
```

### 6. Миграция: Partner Geography
```javascript
// migrations/015_create_partner_geography_table.js
export async function up(knex) {
  await knex.schema.createTable('partner_geography', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').notNullable().references('id').inTable('companies').onDelete('CASCADE');
    
    table.enum('geography_type', [
      'all_russia',
      'specific_region',
      'cis',
      'international'
    ]).notNullable();
    
    table.string('region', 200); // Если geography_type = 'specific_region'
    table.string('country', 100); // Если geography_type = 'international'
    
    table.timestamps(true, true);
    
    table.index('company_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('partner_geography');
}
```

### 7. Миграция: Search Queries (история поиска)
```javascript
// migrations/016_create_search_queries_table.js
export async function up(knex) {
  await knex.schema.createTable('search_queries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    table.text('query_text').notNullable();
    table.jsonb('filters_json'); // Примененные фильтры
    table.integer('results_count');
    
    table.boolean('is_saved').defaultTo(false); // Сохраненный поиск
    table.string('saved_name', 200); // Название сохраненного поиска
    
    table.timestamps(true, true);
    
    table.index('company_id');
    table.index('user_id');
    table.index(['company_id', 'is_saved']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('search_queries');
}
```

### 8. Миграция: AI Tasks (логирование AI задач)
```javascript
// migrations/017_create_ai_tasks_table.js
export async function up(knex) {
  await knex.schema.createTable('ai_tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    table.enum('task_type', [
      'company_verification',
      'smart_search',
      'recommendation',
      'document_analysis',
      'report_generation'
    ]).notNullable();
    
    table.enum('status', [
      'pending',
      'processing',
      'completed',
      'failed'
    ]).defaultTo('pending');
    
    table.jsonb('input_data');
    table.jsonb('result_data');
    table.text('error_message');
    
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.integer('processing_time_ms'); // Время обработки
    
    table.timestamps(true, true);
    
    table.index('task_type');
    table.index('status');
    table.index('company_id');
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('ai_tasks');
}
```

### 9. Миграция: Notifications
```javascript
// migrations/018_create_notifications_table.js
export async function up(knex) {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    table.enum('type', [
      'new_message',
      'new_review',
      'procurement_request',
      'verification_complete',
      'recommendation',
      'system'
    ]).notNullable();
    
    table.string('title', 300).notNullable();
    table.text('message');
    table.string('link', 500);
    
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at');
    
    table.timestamps(true, true);
    
    table.index('user_id');
    table.index(['user_id', 'is_read']);
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('notifications');
}
```

### 10. Миграция: Activity Log (для аналитики)
```javascript
// migrations/019_create_activity_log_table.js
export async function up(knex) {
  await knex.schema.createTable('activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('company_id').references('id').inTable('companies').onDelete('SET NULL');
    
    table.string('action', 100).notNullable(); // 'view_profile', 'search', 'download_pdf', etc.
    table.string('entity_type', 50); // 'company', 'product', 'procurement_request'
    table.uuid('entity_id');
    
    table.string('ip_address', 45);
    table.string('user_agent', 500);
    table.jsonb('metadata');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('company_id');
    table.index('action');
    table.index('created_at');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('activity_log');
}
```

### 11. Миграция: Session Storage (для Redis fallback)
```javascript
// migrations/020_create_sessions_table.js
export async function up(knex) {
  await knex.schema.createTable('sessions', (table) => {
    table.string('sid', 255).primary();
    table.jsonb('sess').notNullable();
    table.timestamp('expired').notNullable();
    
    table.index('expired');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('sessions');
}
```

### 12. Вспомогательные функции и триггеры
```javascript
// migrations/021_create_helper_functions.js
export async function up(knex) {
  // Функция для автоматического обновления updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);
  
  // Применение триггеров ко всем таблицам с updated_at
  const tables = [
    'users', 'companies', 'contact_persons', 'company_addresses',
    'bank_details', 'products_services_offered', 'products_services_needed',
    'procurement_requests', 'procurement_attachments', 'reviews',
    'messages', 'company_interactions', 'platform_goals',
    'partner_industries', 'partner_geography', 'search_queries',
    'ai_tasks', 'notifications'
  ];
  
  for (const table of tables) {
    await knex.raw(`
      CREATE TRIGGER update_${table}_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
  }
  
  // Функция для расчета среднего рейтинга компании
  await knex.raw(`
    CREATE OR REPLACE FUNCTION calculate_company_rating(company_uuid UUID)
    RETURNS DECIMAL(3,2) AS $$
    DECLARE
      avg_rating DECIMAL(3,2);
    BEGIN
      SELECT COALESCE(AVG(rating), 0) INTO avg_rating
      FROM reviews
      WHERE to_company_id = company_uuid AND verified = true AND is_visible = true;
      
      RETURN avg_rating;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(knex) {
  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column CASCADE');
  await knex.raw('DROP FUNCTION IF EXISTS calculate_company_rating CASCADE');
}
```

## Критерии приёмки
- [ ] Все миграции части 2 созданы
- [ ] Триггеры для updated_at работают
- [ ] Вспомогательные функции созданы
- [ ] Индексы оптимизированы для частых запросов
- [ ] Все foreign keys корректны
- [ ] Можно откатить миграции

## Зависимости
- Задача 01-database-schema

## Приоритет
Критический (P0)

## Оценка времени
4-6 часов

