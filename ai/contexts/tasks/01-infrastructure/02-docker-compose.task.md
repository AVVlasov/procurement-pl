# Задача: Docker Compose инфраструктура

## Описание
Настройка Docker Compose для локальной разработки с PostgreSQL, Redis и RabbitMQ.

## Цель
Обеспечить единую среду разработки для всех разработчиков с автоматическим поднятием всех зависимостей.

## Технические требования

### 1. docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: b2b-postgres
    environment:
      POSTGRES_DB: b2b_platform
      POSTGRES_USER: b2b_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-dev_password_123}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U b2b_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - b2b-network

  redis:
    image: redis:7-alpine
    container_name: b2b-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - b2b-network

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: b2b-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER:-b2b_user}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD:-dev_password_123}
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - ./docker/rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - b2b-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: b2b-backend
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://b2b_user:${POSTGRES_PASSWORD:-dev_password_123}@postgres:5432/b2b_platform
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://b2b_user:${RABBITMQ_PASSWORD:-dev_password_123}@rabbitmq:5672
      JWT_SECRET: ${JWT_SECRET:-dev_jwt_secret_change_in_production}
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - b2b-network
    command: npm run dev

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: b2b-ai-service
    environment:
      DATABASE_URL: postgresql://b2b_user:${POSTGRES_PASSWORD:-dev_password_123}@postgres:5432/b2b_platform
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://b2b_user:${RABBITMQ_PASSWORD:-dev_password_123}@rabbitmq:5672
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./ai-service:/app
      - ./uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - b2b-network
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: b2b-frontend
    environment:
      VITE_API_URL: http://localhost:3000/api
      VITE_WS_URL: ws://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - b2b-network
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:

networks:
  b2b-network:
    driver: bridge
```

### 2. docker/postgres/init.sql
```sql
-- Включение расширения pgvector для AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Создание дополнительных расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- для полнотекстового поиска

-- Настройка прав
GRANT ALL PRIVILEGES ON DATABASE b2b_platform TO b2b_user;
```

### 3. docker/rabbitmq/rabbitmq.conf
```
# Конфигурация RabbitMQ
loopback_users.guest = false
listeners.tcp.default = 5672
management.tcp.port = 15672

# Настройки производительности
vm_memory_high_watermark.relative = 0.6
disk_free_limit.absolute = 2GB
```

### 4. .env.example
```env
# Database
POSTGRES_PASSWORD=your_postgres_password

# RabbitMQ
RABBITMQ_USER=b2b_user
RABBITMQ_PASSWORD=your_rabbitmq_password

# Backend
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# API ФНС
FNS_API_URL=https://egrul.nalog.ru
FNS_API_KEY=your_fns_api_key

# AI Service
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-ada-002

# Redis
REDIS_URL=redis://localhost:6379

# Email (для уведомлений)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_smtp_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Makefile для удобства
```makefile
.PHONY: help up down restart logs clean migrate seed

help:
	@echo "Доступные команды:"
	@echo "  make up         - Запустить все сервисы"
	@echo "  make down       - Остановить все сервисы"
	@echo "  make restart    - Перезапустить сервисы"
	@echo "  make logs       - Показать логи всех сервисов"
	@echo "  make clean      - Удалить все данные и volumes"
	@echo "  make migrate    - Запустить миграции БД"
	@echo "  make seed       - Наполнить БД тестовыми данными"

up:
	docker-compose up -d
	@echo "Сервисы запущены!"
	@echo "Backend:    http://localhost:3000"
	@echo "AI Service: http://localhost:8000"
	@echo "Frontend:   http://localhost:5173"
	@echo "RabbitMQ:   http://localhost:15672"

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	rm -rf uploads/*

migrate:
	docker-compose exec backend npm run migrate

seed:
	docker-compose exec backend npm run seed

test:
	docker-compose exec backend npm test
	docker-compose exec ai-service pytest

shell-backend:
	docker-compose exec backend sh

shell-ai:
	docker-compose exec ai-service bash

shell-db:
	docker-compose exec postgres psql -U b2b_user -d b2b_platform
```

### 6. docker-compose.prod.yml (для продакшена)
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
    command: node src/index.js
    restart: always

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile.prod
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./docker/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: always
```

## Критерии приёмки
- [ ] Docker Compose файл создан и работает
- [ ] PostgreSQL запускается с pgvector расширением
- [ ] Redis работает и доступен
- [ ] RabbitMQ работает с management UI
- [ ] Все сервисы могут подключаться друг к другу
- [ ] Health checks настроены для всех сервисов
- [ ] Volumes для персистентности данных созданы
- [ ] .env.example создан с примерами всех переменных
- [ ] Makefile создан для удобства работы
- [ ] Документация по запуску в README.md

## Зависимости
- Задача 01-project-structure

## Приоритет
Критический (P0)

## Оценка времени
3-5 часов

