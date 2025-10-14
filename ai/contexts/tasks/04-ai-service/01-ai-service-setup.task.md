# Задача: Базовая инфраструктура AI Service

## Описание
Настройка FastAPI приложения для AI сервиса с подключением к PostgreSQL, RabbitMQ и LangChain.

## Цель
Создать фундамент для всех AI агентов с правильной архитектурой.

## Технические требования

### 1. Структура AI Service
```
ai-service/
├── app/
│   ├── main.py              # FastAPI приложение
│   ├── config/
│   │   ├── settings.py      # Настройки
│   │   ├── database.py      # SQLAlchemy
│   │   ├── rabbitmq.py      # RabbitMQ consumer
│   │   └── langchain.py     # LangChain setup
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── verification_agent.py
│   │   ├── search_agent.py
│   │   ├── recommendation_agent.py
│   │   ├── document_agent.py
│   │   └── report_agent.py
│   ├── services/
│   │   ├── fns_service.py   # API ФНС
│   │   ├── embedding_service.py
│   │   └── vector_search_service.py
│   ├── models/
│   │   └── schemas.py       # Pydantic модели
│   ├── utils/
│   │   ├── logger.py
│   │   └── helpers.py
│   └── consumers/
│       └── task_consumer.py
├── tests/
├── Dockerfile
├── requirements.txt
└── .env.example
```

### 2. app/main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.config.database import init_db, close_db
from app.config.rabbitmq import start_consumers, stop_consumers
from app.utils.logger import logger
from app.routes import health, search, recommendations, documents, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Service...")
    await init_db()
    await start_consumers()
    logger.info("AI Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Service...")
    await stop_consumers()
    await close_db()
    logger.info("AI Service shut down")

app = FastAPI(
    title="B2B Platform AI Service",
    description="AI-powered services for B2B procurement platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(search.router, prefix="/ai/search", tags=["Search"])
app.include_router(recommendations.router, prefix="/ai/recommendations", tags=["Recommendations"])
app.include_router(documents.router, prefix="/ai/documents", tags=["Documents"])
app.include_router(reports.router, prefix="/ai/reports", tags=["Reports"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
```

### 3. app/config/settings.py
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    database_url: str
    
    # RabbitMQ
    rabbitmq_url: str
    
    # Redis
    redis_url: str
    
    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4"
    embedding_model: str = "text-embedding-ada-002"
    
    # Service
    environment: str = "development"
    log_level: str = "INFO"
    
    # API Keys
    fns_api_key: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### 4. app/config/database.py
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config.settings import settings
from app.utils.logger import logger

# Замена postgresql на postgresql+asyncpg для async
DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.environment == "development",
    pool_size=10,
    max_overflow=20,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def init_db():
    logger.info("Initializing database connection...")
    try:
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

async def close_db():
    logger.info("Closing database connection...")
    await engine.dispose()

async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
```

### 5. app/config/rabbitmq.py
```python
import asyncio
import aio_pika
from app.config.settings import settings
from app.utils.logger import logger

connection = None
channel = None

QUEUES = {
    "COMPANY_VERIFICATION": "company_verification_queue",
    "SMART_SEARCH": "smart_search_queue",
    "RECOMMENDATION": "recommendation_queue",
    "DOCUMENT_ANALYSIS": "document_analysis_queue",
    "REPORT_GENERATION": "report_generation_queue",
}

async def get_rabbitmq_connection():
    global connection, channel
    
    if connection is None or connection.is_closed:
        connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        
    return connection, channel

async def start_consumers():
    from app.consumers.task_consumer import (
        consume_verification_tasks,
        consume_search_tasks,
        consume_recommendation_tasks,
        consume_document_tasks,
        consume_report_tasks,
    )
    
    logger.info("Starting RabbitMQ consumers...")
    
    asyncio.create_task(consume_verification_tasks())
    asyncio.create_task(consume_search_tasks())
    asyncio.create_task(consume_recommendation_tasks())
    asyncio.create_task(consume_document_tasks())
    asyncio.create_task(consume_report_tasks())
    
    logger.info("All consumers started")

async def stop_consumers():
    global connection, channel
    
    logger.info("Stopping RabbitMQ consumers...")
    
    if channel:
        await channel.close()
    if connection:
        await connection.close()
    
    logger.info("Consumers stopped")
```

### 6. app/config/langchain.py
```python
from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from langchain.memory import ConversationBufferMemory
from app.config.settings import settings

# LLM для генерации текста
llm = ChatOpenAI(
    model=settings.openai_model,
    api_key=settings.openai_api_key,
    temperature=0.7,
)

# Embeddings для векторного поиска
embeddings = OpenAIEmbeddings(
    model=settings.embedding_model,
    api_key=settings.openai_api_key,
)

def get_conversation_memory():
    return ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True,
    )
```

### 7. app/utils/logger.py
```python
import logging
import sys
from app.config.settings import settings

# Настройка логгера
logger = logging.getLogger("ai_service")
logger.setLevel(getattr(logging, settings.log_level.upper()))

# Форматтер
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Handler для консоли
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Handler для файла
file_handler = logging.FileHandler('logs/ai_service.log')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)
```

### 8. app/routes/health.py
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db
from app.config.rabbitmq import get_rabbitmq_connection
from datetime import datetime

router = APIRouter()

@router.get("/")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Проверка БД
        await db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    try:
        # Проверка RabbitMQ
        await get_rabbitmq_connection()
        rabbitmq_status = "healthy"
    except Exception as e:
        rabbitmq_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "ok" if db_status == "healthy" and rabbitmq_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status,
            "rabbitmq": rabbitmq_status,
        }
    }
```

### 9. app/models/schemas.py
```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskType(str, Enum):
    VERIFICATION = "company_verification"
    SEARCH = "smart_search"
    RECOMMENDATION = "recommendation"
    DOCUMENT_ANALYSIS = "document_analysis"
    REPORT_GENERATION = "report_generation"

class CompanyVerificationTask(BaseModel):
    company_id: str
    inn: str
    ogrn: str

class SearchTask(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    company_id: Optional[str] = None

class RecommendationTask(BaseModel):
    company_id: str
    limit: int = 10

class DocumentAnalysisTask(BaseModel):
    document_id: str
    file_path: str
    file_type: str

class ReportGenerationTask(BaseModel):
    company_id: str
    request_ids: List[str]

class SearchResponse(BaseModel):
    companies: List[Dict[str, Any]]
    total: int
    relevance_scores: Dict[str, float]

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    explanations: Dict[str, str]
```

### 10. Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Копирование requirements
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование кода
COPY . .

# Создание директорий
RUN mkdir -p logs

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 11. requirements.txt
```
fastapi==0.108.0
uvicorn[standard]==0.25.0
sqlalchemy==2.0.23
asyncpg==0.29.0
aio-pika==9.3.1
langchain==0.1.0
openai==1.6.1
pgvector==0.2.4
pypdf2==3.0.1
pdfplumber==0.10.3
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
redis==5.0.1
numpy==1.26.2
scikit-learn==1.3.2
httpx==0.25.2
pytest==7.4.3
pytest-asyncio==0.21.1
black==23.12.1
flake8==7.0.0
```

## Критерии приёмки
- [ ] FastAPI приложение запускается
- [ ] Подключение к PostgreSQL через SQLAlchemy работает
- [ ] RabbitMQ подключение установлено
- [ ] LangChain настроен с OpenAI
- [ ] Health check endpoint работает
- [ ] Логирование настроено
- [ ] Структура проекта создана
- [ ] Dockerfile работает

## Зависимости
- Задача 02-docker-compose
- Задача 01-database-schema

## Приоритет
Критический (P0)

## Оценка времени
4-6 часов

