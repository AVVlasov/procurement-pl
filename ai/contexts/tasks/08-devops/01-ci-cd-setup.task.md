# Задача: Настройка CI/CD

## Описание
Настройка GitHub Actions для автоматического тестирования, сборки и деплоя приложения.

## Цель
Автоматизировать процесс тестирования и деплоя для обеспечения качества кода.

## Технические требования

### 1. .github/workflows/backend-ci.yml
```yaml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-ci.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run linter
        working-directory: ./backend
        run: npm run lint
      
      - name: Run tests
        working-directory: ./backend
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test_jwt_secret_for_ci
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build Docker image
        working-directory: ./backend
        run: docker build -t b2b-backend:${{ github.sha }} .
```

### 2. .github/workflows/ai-service-ci.yml
```yaml
name: AI Service CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'ai-service/**'
      - '.github/workflows/ai-service-ci.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'ai-service/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        working-directory: ./ai-service
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Run linter (flake8)
        working-directory: ./ai-service
        run: flake8 app/
      
      - name: Run formatter check (black)
        working-directory: ./ai-service
        run: black --check app/
      
      - name: Run tests
        working-directory: ./ai-service
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./ai-service/coverage.xml
          flags: ai-service

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build Docker image
        working-directory: ./ai-service
        run: docker build -t b2b-ai-service:${{ github.sha }} .
```

### 3. .github/workflows/frontend-ci.yml
```yaml
name: Frontend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-ci.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run linter
        working-directory: ./frontend
        run: npm run lint
      
      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Build
        working-directory: ./frontend
        env:
          VITE_API_URL: https://api.b2b-platform.com
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/
```

### 4. .github/workflows/deploy-staging.yml
```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
      
      - name: Deploy to staging server
        run: |
          ssh ${{ secrets.STAGING_USER }}@${{ secrets.STAGING_HOST }} << 'EOF'
            cd /var/www/b2b-platform
            git pull origin develop
            docker-compose -f docker-compose.staging.yml down
            docker-compose -f docker-compose.staging.yml up -d --build
            docker-compose -f docker-compose.staging.yml exec backend npm run migrate
          EOF
      
      - name: Health check
        run: |
          sleep 30
          curl -f ${{ secrets.STAGING_URL }}/health || exit 1
```

### 5. .github/workflows/deploy-production.yml
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://b2b-platform.com
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Create deployment
        uses: actions/github-script@v7
        with:
          script: |
            const deployment = await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.sha,
              environment: 'production',
              required_contexts: [],
            });
      
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
      
      - name: Deploy to production server
        run: |
          ssh ${{ secrets.PROD_USER }}@${{ secrets.PROD_HOST }} << 'EOF'
            cd /var/www/b2b-platform
            git pull origin main
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose -f docker-compose.prod.yml exec backend npm run migrate
          EOF
      
      - name: Health check
        run: |
          sleep 30
          curl -f https://b2b-platform.com/health || exit 1
      
      - name: Rollback on failure
        if: failure()
        run: |
          ssh ${{ secrets.PROD_USER }}@${{ secrets.PROD_HOST }} << 'EOF'
            cd /var/www/b2b-platform
            docker-compose -f docker-compose.prod.yml down
            git checkout HEAD~1
            docker-compose -f docker-compose.prod.yml up -d
          EOF
```

### 6. .github/workflows/security-scan.yml
```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 0'  # Еженедельно
  workflow_dispatch:

jobs:
  scan-dependencies:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit (Backend)
        working-directory: ./backend
        run: npm audit --audit-level=high
      
      - name: Run npm audit (Frontend)
        working-directory: ./frontend
        run: npm audit --audit-level=high
      
      - name: Run safety check (Python)
        working-directory: ./ai-service
        run: |
          pip install safety
          safety check -r requirements.txt

  scan-docker:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy scanner (Backend)
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: './backend'
          format: 'sarif'
          output: 'trivy-backend.sarif'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-backend.sarif'
```

## Критерии приёмки
- [ ] GitHub Actions workflows созданы
- [ ] CI запускается на каждый PR
- [ ] Все тесты запускаются автоматически
- [ ] Линтеры и форматтеры проверяются
- [ ] Docker образы собираются
- [ ] Deploy на staging автоматический
- [ ] Deploy на production требует одобрения
- [ ] Health checks после деплоя работают
- [ ] Rollback при ошибках реализован
- [ ] Security сканирование настроено

## Зависимости
- Все тесты должны быть написаны
- Docker файлы должны быть готовы
- Серверы для staging/production должны быть настроены

## Приоритет
Высокий (P1)

## Оценка времени
8-12 часов

