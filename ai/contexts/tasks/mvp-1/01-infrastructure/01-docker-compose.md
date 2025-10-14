# Задача: Docker Compose для всех сервисов (MVP 1)

## Описание
Контейнеризация всех сервисов платформы для упрощения развертывания и разработки.

## Цель
Обеспечить единообразное окружение для разработки и продакшна, упростить запуск всех сервисов одной командой.

## Технические требования

### 1. Структура проекта

```
project-root/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── ...
├── ai-service/
│   ├── Dockerfile
│   └── ...
└── nginx/
    ├── nginx.conf
    └── Dockerfile
```

### 2. docker-compose.yml (production)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: b2b-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-b2b_platform}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_INITDB_ARGS: "-E UTF8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - b2b-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: b2b-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis123}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - b2b-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: b2b-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-b2b_platform}
      REDIS_URL: redis://:${REDIS_PASSWORD:-redis123}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      AI_SERVICE_URL: http://ai-service:8000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3000:3000"
    networks:
      - b2b-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # AI Service
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    container_name: b2b-ai-service
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-b2b_platform}
      REDIS_URL: redis://:${REDIS_PASSWORD:-redis123}@redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"
    networks:
      - b2b-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    container_name: b2b-frontend
    environment:
      VITE_API_URL: ${VITE_API_URL:-http://localhost/api}
    depends_on:
      - backend
    ports:
      - "5173:80"
    networks:
      - b2b-network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: b2b-nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    ports:
      - "80:80"
      - "443:443"
    networks:
      - b2b-network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  b2b-network:
    driver: bridge
```

### 3. docker-compose.dev.yml (development)

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: b2b-postgres-dev
    environment:
      POSTGRES_DB: b2b_platform_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - b2b-network-dev

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: b2b-redis-dev
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    networks:
      - b2b-network-dev

  # Backend API (с hot reload)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: b2b-backend-dev
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/b2b_platform_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-key-change-in-production
      AI_SERVICE_URL: http://ai-service:8000
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debugging port
    networks:
      - b2b-network-dev
    command: npm run dev

  # AI Service (с hot reload)
  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
      target: development
    container_name: b2b-ai-service-dev
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/b2b_platform_dev
      REDIS_URL: redis://redis:6379
    volumes:
      - ./ai-service:/app
    depends_on:
      - postgres
      - redis
    ports:
      - "8000:8000"
    networks:
      - b2b-network-dev
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Frontend (с hot reload)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: b2b-frontend-dev
    environment:
      VITE_API_URL: http://localhost:3000/api
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    ports:
      - "5173:5173"
    networks:
      - b2b-network-dev
    command: npm run dev -- --host

networks:
  b2b-network-dev:
    driver: bridge
```

### 4. backend/Dockerfile

```dockerfile
# Multi-stage build for Node.js backend

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Если есть TypeScript, раскомментировать:
# RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=build /app/src ./src
# Если используется TypeScript:
# COPY --from=build /app/dist ./dist
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
EXPOSE 3000
CMD ["node", "src/server.js"]
# Если TypeScript: CMD ["node", "dist/server.js"]
```

### 5. ai-service/Dockerfile

```dockerfile
# Multi-stage build for Python AI service

# Development stage
FROM python:3.11-slim AS development
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production stage
FROM python:3.11-slim AS production
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    addgroup --gid 1001 --system python && \
    adduser --no-create-home --shell /bin/false --disabled-password --uid 1001 --system --group python
COPY . .
RUN chown -R python:python /app
USER python
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 6. frontend/Dockerfile

```dockerfile
# Multi-stage build for React frontend

# Development stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 7. nginx/nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream ai-service {
        server ai-service:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    # Redirect HTTP to HTTPS (для продакшна)
    server {
        listen 80;
        server_name _;
        
        # Для разработки - прокси на сервисы
        location /api/ {
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /ai/ {
            proxy_pass http://ai-service/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # HTTPS server (для продакшна)
    # server {
    #     listen 443 ssl http2;
    #     server_name your-domain.com;
    #     
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #     
    #     # Остальная конфигурация аналогична HTTP
    # }
}
```

### 8. nginx/frontend.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 9. .env.example

```env
# Database
POSTGRES_DB=b2b_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-me-in-production

# Redis
REDIS_PASSWORD=change-me-in-production

# Backend
JWT_SECRET=change-me-in-production-use-long-random-string
NODE_ENV=production

# AI Service
OPENAI_API_KEY=your-openai-api-key

# Frontend
VITE_API_URL=http://localhost/api
```

### 10. Скрипты для управления

**Makefile**
```makefile
.PHONY: help dev build up down logs clean

help: ## Показать справку
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Запустить в режиме разработки
	docker-compose -f docker-compose.dev.yml up -d

build: ## Собрать все образы
	docker-compose build

up: ## Запустить в production режиме
	docker-compose up -d

down: ## Остановить все контейнеры
	docker-compose down

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-backend: ## Показать логи backend
	docker-compose logs -f backend

logs-ai: ## Показать логи AI service
	docker-compose logs -f ai-service

logs-frontend: ## Показать логи frontend
	docker-compose logs -f frontend

clean: ## Удалить все контейнеры и volumes
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v

restart: ## Перезапустить все сервисы
	docker-compose restart

ps: ## Показать статус контейнеров
	docker-compose ps

shell-backend: ## Зайти в shell backend
	docker-compose exec backend sh

shell-ai: ## Зайти в shell AI service
	docker-compose exec ai-service sh

db-migrate: ## Запустить миграции БД
	docker-compose exec backend npm run migrate

db-seed: ## Заполнить БД тестовыми данными
	docker-compose exec backend npm run seed

backup-db: ## Создать backup БД
	docker-compose exec postgres pg_dump -U postgres b2b_platform > backup_$(shell date +%Y%m%d_%H%M%S).sql
```

### 11. .dockerignore

**backend/.dockerignore**
```
node_modules
npm-debug.log
.env
.env.*
.git
.gitignore
README.md
docker-compose*.yml
Dockerfile
```

**frontend/.dockerignore**
```
node_modules
npm-debug.log
dist
.env
.env.*
.git
.gitignore
README.md
docker-compose*.yml
Dockerfile
```

**ai-service/.dockerignore**
```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env
venv
.env
.env.*
.git
.gitignore
README.md
docker-compose*.yml
Dockerfile
```

### 12. Healthcheck endpoints

**backend/src/routes/health.js**
```javascript
const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Проверка подключения к БД
    const dbCheck = await req.db.raw('SELECT 1');
    
    // Проверка Redis
    const redisCheck = await req.redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbCheck ? 'up' : 'down',
        redis: redisCheck === 'PONG' ? 'up' : 'down',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

module.exports = router;
```

**ai-service/main.py**
```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "1.0.0"
    }
```

## Критерии приёмки
- [ ] docker-compose.yml для production создан
- [ ] docker-compose.dev.yml для разработки создан
- [ ] Dockerfiles для всех сервисов созданы
- [ ] Multi-stage builds настроены
- [ ] Nginx reverse proxy настроен
- [ ] Healthcheck endpoints работают
- [ ] Volumes для PostgreSQL и Redis настроены
- [ ] Networks изолированы
- [ ] .env.example создан
- [ ] Makefile с командами создан
- [ ] Все сервисы запускаются одной командой
- [ ] Hot reload работает в dev режиме

## Зависимости
- MVP 0 завершен

## Приоритет
Критический (P0)

## Оценка времени
3-4 дня

## Инструкции по запуску

### Development
```bash
# Создать .env файл
cp .env.example .env

# Запустить все сервисы
make dev

# Проверить статус
make ps

# Просмотр логов
make logs
```

### Production
```bash
# Собрать образы
make build

# Запустить
make up

# Проверить
curl http://localhost/api/health
```

## Примечания
Docker Compose упрощает развертывание и обеспечивает единообразное окружение для всех разработчиков команды.

