# Задача: Базовая настройка проекта (MVP 0)

## Описание
Создание упрощенной структуры монорепозитория без Docker, с минимальными зависимостями.

## Цель
Быстро настроить проект для разработки в одиночку, без лишней сложности.

## Технические требования

### 1. Структура проекта
```
tatarpunk-tasks/
├── backend/            # Node.js + Express
├── frontend/           # React + Vite
├── ai-service/         # Python + FastAPI (минимальный)
├── .gitignore
└── README.md
```

### 2. Backend package.json (упрощенный)
```json
{
  "name": "backend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 3. Frontend package.json (упрощенный)
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
```

### 4. AI Service requirements.txt (минимальный)
```
fastapi==0.108.0
uvicorn[standard]==0.25.0
python-dotenv==1.0.0
openai==1.6.1
httpx==0.25.2
```

### 5. Backend .env.example
```env
PORT=3000
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=b2b_mvp
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production

# Frontend URL
FRONTEND_URL=http://localhost:5173

# AI Service URL
AI_SERVICE_URL=http://localhost:8000
```

### 6. Frontend .env.example
```env
VITE_API_URL=http://localhost:3000/api
VITE_AI_SERVICE_URL=http://localhost:8000
```

### 7. AI Service .env.example
```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/b2b_mvp

# Модели
OPENAI_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-ada-002
```

### 8. .gitignore
```
# Dependencies
node_modules/
__pycache__/
*.pyc

# Environment
.env
.env.local

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Build
dist/
build/

# Database
*.sqlite
*.db
```

### 9. Структура Backend
```
backend/
├── src/
│   ├── index.js           # Entry point
│   ├── app.js             # Express app
│   ├── db.js              # PostgreSQL connection
│   ├── routes/
│   │   ├── auth.js
│   │   ├── companies.js
│   │   └── products.js
│   ├── controllers/
│   ├── middlewares/
│   │   └── auth.js
│   └── utils/
│       └── errors.js
├── package.json
└── .env
```

### 10. Структура Frontend
```
frontend/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── CompanyProfile.jsx
│   │   └── Search.jsx
│   ├── components/
│   ├── api/
│   │   └── client.js
│   └── utils/
├── index.html
├── vite.config.js
└── package.json
```

### 11. Структура AI Service
```
ai-service/
├── app/
│   ├── main.py            # FastAPI app
│   ├── config.py          # Settings
│   ├── search_agent.py    # Адаптированный агент
│   └── database.py        # DB connection
├── requirements.txt
└── .env
```

## Критерии приёмки
- [ ] Структура проекта создана
- [ ] Backend package.json с минимальными зависимостями
- [ ] Frontend package.json с минимальными зависимостями
- [ ] AI Service requirements.txt с минимальными зависимостями
- [ ] .env.example файлы созданы для всех сервисов
- [ ] .gitignore настроен
- [ ] README.md с инструкциями по запуску

## Зависимости
Нет

## Приоритет
Критический (P0)

## Оценка времени
2-3 часа

## Инструкции по запуску

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Отредактировать .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Отредактировать .env
uvicorn app.main:app --reload
```


