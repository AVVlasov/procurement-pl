# Задача: Настройка PostgreSQL (MVP 0)

## Описание
Установка PostgreSQL локально и создание упрощенной схемы базы данных без миграций.

## Цель
Быстро настроить базу данных с минимальными таблицами для MVP 0.

## Технические требования

### 1. Установка PostgreSQL

#### Windows
```bash
# Скачать с https://www.postgresql.org/download/windows/
# Или через chocolatey:
choco install postgresql
```

#### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Создание базы данных
```sql
-- Подключиться как postgres user
psql -U postgres

-- Создать базу данных
CREATE DATABASE b2b_mvp;

-- Создать пользователя
CREATE USER b2b_user WITH PASSWORD 'your_password';

-- Выдать права
GRANT ALL PRIVILEGES ON DATABASE b2b_mvp TO b2b_user;

-- Подключиться к базе
\c b2b_mvp

-- Включить расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. Схема базы данных (упрощенная для MVP 0)

#### Таблица: users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

#### Таблица: companies
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inn VARCHAR(12) UNIQUE NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    description TEXT,
    website VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_inn ON companies(inn);
```

#### Таблица: products_services (объединенная для "Я ПРОДАЮ")
```sql
CREATE TABLE products_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('offered', 'needed')),
    name VARCHAR(300) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_company_id ON products_services(company_id);
CREATE INDEX idx_products_type ON products_services(type);
CREATE INDEX idx_products_active ON products_services(is_active);

-- Полнотекстовый поиск (для базового поиска)
CREATE INDEX idx_products_search ON products_services 
USING GIN (to_tsvector('russian', name || ' ' || COALESCE(description, '')));
```

### 4. SQL скрипт для инициализации

Создать файл `backend/database/init.sql`:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inn VARCHAR(12) UNIQUE NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    description TEXT,
    website VARCHAR(500),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_inn ON companies(inn);

-- Products and Services table
CREATE TABLE IF NOT EXISTS products_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('offered', 'needed')),
    name VARCHAR(300) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_company_id ON products_services(company_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products_services(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON products_services(is_active);
CREATE INDEX IF NOT EXISTS idx_products_search ON products_services 
USING GIN (to_tsvector('russian', name || ' ' || COALESCE(description, '')));
```

### 5. Backend db.js (простое подключение)
```javascript
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Проверка подключения
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Утилитарная функция для запросов
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}
```

### 6. Seed данные для тестирования

Создать файл `backend/database/seed.sql`:
```sql
-- Тестовый пользователь (пароль: test123)
INSERT INTO users (email, password_hash) VALUES 
('test@example.com', '$2b$10$rKjNQz.example.hash');

-- Тестовая компания
INSERT INTO companies (user_id, inn, full_name, description, website, phone, email) VALUES 
((SELECT id FROM users WHERE email = 'test@example.com'),
 '1234567890',
 'ООО "Тестовая Компания"',
 'Поставщик IT услуг и консалтинга',
 'https://example.com',
 '+7 (999) 123-45-67',
 'info@example.com');

-- Тестовые продукты
INSERT INTO products_services (company_id, type, name, description) VALUES
((SELECT id FROM companies WHERE inn = '1234567890'), 
 'offered', 
 'Разработка веб-приложений',
 'Создание современных веб-приложений на React и Node.js'),
((SELECT id FROM companies WHERE inn = '1234567890'), 
 'offered', 
 'IT консалтинг',
 'Консультирование по вопросам цифровой трансформации'),
((SELECT id FROM companies WHERE inn = '1234567890'), 
 'needed', 
 'Серверное оборудование',
 'Нужны серверы Dell PowerEdge для расширения инфраструктуры');
```

## Критерии приёмки
- [ ] PostgreSQL установлен и запущен
- [ ] База данных b2b_mvp создана
- [ ] Все таблицы созданы успешно
- [ ] Индексы созданы
- [ ] Подключение из backend работает
- [ ] Seed данные загружены для тестирования

## Зависимости
- Задача 01-basic-project-setup

## Приоритет
Критический (P0)

## Оценка времени
1-2 часа

## Инструкции по использованию

### Инициализация базы
```bash
psql -U postgres -d b2b_mvp -f backend/database/init.sql
```

### Загрузка seed данных
```bash
psql -U postgres -d b2b_mvp -f backend/database/seed.sql
```

### Проверка таблиц
```bash
psql -U postgres -d b2b_mvp -c "\dt"
```

### Сброс базы (если нужно начать заново)
```bash
psql -U postgres -c "DROP DATABASE IF EXISTS b2b_mvp;"
psql -U postgres -c "CREATE DATABASE b2b_mvp;"
psql -U postgres -d b2b_mvp -f backend/database/init.sql
```


