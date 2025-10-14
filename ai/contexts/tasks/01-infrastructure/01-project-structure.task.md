# Задача: Структура проекта и конфигурация

## Описание
Создание монорепозитория с workspaces для всех компонентов системы: frontend (Bro.js), backend (Node.js), AI service (Python).

## Цель
Настроить базовую структуру проекта с правильной организацией кода и зависимостей.

## Технические требования

### 1. Структура директорий
```
tatarpunk-tasks/
├── frontend/           # Bro.js приложение
├── backend/            # Node.js API
├── ai-service/         # Python AI сервис
├── shared/             # Общие типы и утилиты
├── docker/             # Docker конфигурации
├── docs/               # Документация
└── scripts/            # Утилитарные скрипты
```

### 2. Package.json корневой
```json
{
  "name": "b2b-procurement-platform",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ],
  "scripts": {
    "install:all": "npm install && cd ai-service && pip install -r requirements.txt",
    "dev:backend": "npm run dev --workspace=backend",
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:ai": "cd ai-service && python -m uvicorn main:app --reload",
    "dev:all": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\" \"npm run dev:ai\"",
    "lint": "npm run lint --workspaces",
    "test": "npm run test --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

### 3. Backend package.json
```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "lint": "eslint src/",
    "test": "jest",
    "migrate": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "knex": "^3.0.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "redis": "^4.6.11",
    "amqplib": "^0.10.3",
    "socket.io": "^4.6.2",
    "axios": "^1.6.2",
    "joi": "^17.11.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

### 4. AI Service requirements.txt
```
fastapi==0.108.0
uvicorn[standard]==0.25.0
sqlalchemy==2.0.23
asyncpg==0.29.0
pika==1.3.2
aio-pika==9.3.1
langchain==0.1.0
openai==1.6.1
pgvector==0.2.4
pypdf2==3.0.1
pdfplumber==0.10.3
python-dotenv==1.0.0
pydantic==2.5.3
redis==5.0.1
numpy==1.26.2
scikit-learn==1.3.2
pytest==7.4.3
black==23.12.1
flake8==7.0.0
```

### 5. ESLint конфигурация (.eslintrc.json)
```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "warn",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}
```

### 6. Prettier конфигурация (.prettierrc)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 7. Python конфигурация (setup.cfg для flake8)
```ini
[flake8]
max-line-length = 100
exclude = .git,__pycache__,venv,migrations
ignore = E203,W503

[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

### 8. .gitignore
```
# Dependencies
node_modules/
venv/
__pycache__/

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/
*.egg-info/

# Uploads
uploads/
temp/

# Database
*.sqlite
*.db
```

## Критерии приёмки
- [ ] Создана структура монорепозитория
- [ ] Настроены npm workspaces
- [ ] Созданы package.json для всех компонентов
- [ ] Настроены ESLint и Prettier для Node.js
- [ ] Настроены Black и Flake8 для Python
- [ ] Создан .gitignore
- [ ] Добавлены скрипты для запуска всех сервисов
- [ ] Документирована структура в README.md

## Зависимости
Нет

## Приоритет
Критический (P0)

## Оценка времени
2-4 часа

