# Задача: Адаптация готового AI агента поиска (MVP 0)

## Описание
Адаптация существующего прототипа AI агента для поиска компаний под нашу базу данных.

## Цель
Быстро интегрировать готовый AI агент для демонстрации интеллектуального поиска.

## Технические требования

### 1. Структура AI Service (минимальная)
```
ai-service/
├── app/
│   ├── main.py          # FastAPI приложение
│   ├── config.py        # Настройки
│   ├── database.py      # Подключение к БД
│   ├── search_agent.py  # Адаптированный агент
│   └── embeddings.py    # Генерация embeddings
├── requirements.txt
├── .env
└── README.md
```

### 2. requirements.txt (минимальный)
```
fastapi==0.108.0
uvicorn[standard]==0.25.0
python-dotenv==1.0.0
openai==1.6.1
asyncpg==0.29.0
httpx==0.25.2
pydantic==2.5.3
```

### 3. app/config.py
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4"
    embedding_model: str = "text-embedding-ada-002"
    
    # Database
    database_url: str
    
    # Service
    environment: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### 4. app/database.py
```python
import asyncpg
from app.config import settings

pool = None

async def init_db():
    """Инициализация пула подключений к БД"""
    global pool
    pool = await asyncpg.create_pool(settings.database_url)
    print("✅ Database pool created")

async def close_db():
    """Закрытие пула подключений"""
    global pool
    if pool:
        await pool.close()
        print("✅ Database pool closed")

async def get_pool():
    """Получение пула подключений"""
    return pool
```

### 5. app/embeddings.py
```python
import openai
from app.config import settings
from typing import List

# Настройка OpenAI
openai.api_key = settings.openai_api_key

async def generate_embedding(text: str) -> List[float]:
    """Генерация embedding для текста"""
    try:
        if not text or not text.strip():
            # Возврат нулевого вектора для пустого текста
            return [0.0] * 1536
        
        response = await openai.embeddings.acreate(
            model=settings.embedding_model,
            input=text.strip()
        )
        
        return response.data[0].embedding
        
    except Exception as e:
        print(f"Error generating embedding: {e}")
        raise

async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Генерация embeddings для нескольких текстов"""
    try:
        response = await openai.embeddings.acreate(
            model=settings.embedding_model,
            input=[t.strip() for t in texts if t and t.strip()]
        )
        
        return [item.embedding for item in response.data]
        
    except Exception as e:
        print(f"Error generating batch embeddings: {e}")
        raise
```

### 6. app/search_agent.py (адаптированный)
```python
import openai
from app.config import settings
from app.database import get_pool
from app.embeddings import generate_embedding
from typing import List, Dict, Any
import json

# Настройка OpenAI
openai.api_key = settings.openai_api_key

class SearchAgent:
    """
    AI агент для интеллектуального поиска компаний.
    Адаптация готового прототипа.
    """
    
    def __init__(self):
        self.model = settings.openai_model
    
    async def search(self, query: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Главный метод поиска.
        
        Args:
            query: Поисковый запрос на естественном языке
            filters: Дополнительные фильтры (опционально)
        
        Returns:
            Результаты поиска с объяснением
        """
        try:
            # Шаг 1: Анализ запроса через GPT
            intent = await self._analyze_query(query)
            
            # Шаг 2: Генерация embedding для семантического поиска
            query_embedding = await generate_embedding(query)
            
            # Шаг 3: Поиск в БД
            if intent.get('search_type') == 'products':
                results = await self._search_products(query, query_embedding)
            else:
                results = await self._search_companies(query, query_embedding)
            
            # Шаг 4: Ранжирование и объяснение результатов
            ranked_results = await self._rank_and_explain(query, results, intent)
            
            return {
                'companies': ranked_results,
                'total': len(ranked_results),
                'query': query,
                'intent': intent,
            }
            
        except Exception as e:
            print(f"Search error: {e}")
            raise
    
    async def _analyze_query(self, query: str) -> Dict[str, Any]:
        """Анализ запроса для определения намерения пользователя"""
        try:
            response = await openai.chat.completions.acreate(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """Ты - помощник по анализу поисковых запросов на B2B платформе.
                        
                        Проанализируй запрос и определи:
                        1. Что ищет пользователь: компании или конкретные продукты/услуги
                        2. Ключевые слова и критерии
                        3. Отрасль или сферу деятельности
                        
                        Ответь в формате JSON:
                        {
                            "search_type": "companies" или "products",
                            "keywords": ["ключевое слово 1", "ключевое слово 2"],
                            "industry": "отрасль или null",
                            "intent": "краткое описание намерения"
                        }
                        """
                    },
                    {"role": "user", "content": query}
                ],
                temperature=0.3,
                max_tokens=300,
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            print(f"Query analysis error: {e}")
            return {
                "search_type": "companies",
                "keywords": [query],
                "industry": None,
                "intent": query
            }
    
    async def _search_companies(self, query: str, embedding: List[float]) -> List[Dict]:
        """Поиск компаний в БД (семантический + текстовый)"""
        pool = await get_pool()
        
        # Пока без vector search (добавим позже в MVP 1)
        # Используем простой полнотекстовый поиск
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    id, 
                    full_name, 
                    inn, 
                    description, 
                    website,
                    phone,
                    email,
                    ts_rank(
                        to_tsvector('russian', full_name || ' ' || COALESCE(description, '')),
                        plainto_tsquery('russian', $1)
                    ) as rank
                FROM companies
                WHERE is_active = true
                  AND to_tsvector('russian', full_name || ' ' || COALESCE(description, '')) 
                      @@ plainto_tsquery('russian', $1)
                ORDER BY rank DESC
                LIMIT 20
            """, query)
            
            return [dict(row) for row in rows]
    
    async def _search_products(self, query: str, embedding: List[float]) -> List[Dict]:
        """Поиск через продукты/услуги"""
        pool = await get_pool()
        
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT DISTINCT ON (c.id)
                    c.id, 
                    c.full_name, 
                    c.inn, 
                    c.description, 
                    c.website,
                    c.phone,
                    c.email,
                    ps.name as matched_product,
                    ps.description as product_description,
                    ts_rank(
                        to_tsvector('russian', ps.name || ' ' || COALESCE(ps.description, '')),
                        plainto_tsquery('russian', $1)
                    ) as rank
                FROM companies c
                JOIN products_services ps ON c.id = ps.company_id
                WHERE c.is_active = true 
                  AND ps.is_active = true
                  AND to_tsvector('russian', ps.name || ' ' || COALESCE(ps.description, '')) 
                      @@ plainto_tsquery('russian', $1)
                ORDER BY c.id, rank DESC
                LIMIT 20
            """, query)
            
            return [dict(row) for row in rows]
    
    async def _rank_and_explain(
        self, 
        query: str, 
        results: List[Dict], 
        intent: Dict
    ) -> List[Dict]:
        """Ранжирование результатов и добавление объяснений"""
        if not results:
            return []
        
        # Для MVP 0 возвращаем результаты как есть
        # В MVP 1 добавим AI объяснения
        for result in results:
            result['relevance_score'] = float(result.get('rank', 0))
            result['explanation'] = f"Найдено по запросу: {query}"
        
        return results[:10]  # Топ 10 результатов

# Глобальный экземпляр агента
search_agent = SearchAgent()
```

### 7. app/main.py
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

from app.database import init_db, close_db
from app.search_agent import search_agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting AI Service...")
    await init_db()
    print("✅ AI Service started")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down AI Service...")
    await close_db()
    print("✅ AI Service stopped")

app = FastAPI(
    title="B2B AI Search Service (MVP 0)",
    description="Минимальный AI сервис для поиска компаний",
    version="0.1.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic модели
class SearchRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None

class SearchResponse(BaseModel):
    companies: list
    total: int
    query: str
    intent: Optional[Dict[str, Any]] = None

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "AI Search Service",
        "version": "0.1.0"
    }

# Поиск
@app.post("/search", response_model=SearchResponse)
async def search_companies(request: SearchRequest):
    """
    Интеллектуальный поиск компаний.
    
    Пример запроса:
    {
        "query": "Ищу поставщика IT оборудования в Москве"
    }
    """
    try:
        result = await search_agent.search(request.query, request.filters)
        return SearchResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Запуск сервера
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 8. .env.example
```env
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4
EMBEDDING_MODEL=text-embedding-ada-002

# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/b2b_mvp

# Service
ENVIRONMENT=development
```

## Критерии приёмки
- [ ] FastAPI сервис запускается без ошибок
- [ ] Подключение к PostgreSQL работает
- [ ] OpenAI API работает
- [ ] Endpoint POST /search принимает запросы
- [ ] Анализ запроса через GPT работает
- [ ] Поиск компаний в БД работает
- [ ] Результаты возвращаются с релевантностью
- [ ] Health check endpoint доступен

## Зависимости
- Задача 02-postgres-local-setup
- Готовый прототип AI агента (адаптируется)

## Приоритет
Критический (P0)

## Оценка времени
4-6 часов (с адаптацией прототипа)

## Инструкции по запуску

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Отредактировать .env (добавить OPENAI_API_KEY)
uvicorn app.main:app --reload --port 8000
```

## Тестирование

```bash
# Health check
curl http://localhost:8000/health

# Поиск
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Ищу IT компанию"}'
```


