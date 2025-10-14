# Задача: AI Agent для интеллектуального поиска

## Описание
Реализация AI агента для обработки естественного языка запросов и семантического поиска компаний.

## Цель
Обеспечить интеллектуальный поиск компаний с использованием NLP и vector search.

## Технические требования

### 1. app/agents/search_agent.py
```python
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from app.config.langchain import llm, embeddings
from app.services.vector_search_service import VectorSearchService
from app.services.embedding_service import EmbeddingService
from app.config.database import async_session_maker
from app.utils.logger import logger
from sqlalchemy import select, and_, or_
from typing import List, Dict, Any
import json

class SmartSearchAgent:
    def __init__(self):
        self.vector_search = VectorSearchService()
        self.embedding_service = EmbeddingService()
        
        # Создание tools для агента
        self.tools = [
            Tool(
                name="search_by_semantic",
                func=self._semantic_search,
                description="Поиск компаний по семантическому сходству с запросом"
            ),
            Tool(
                name="search_by_filters",
                func=self._filter_search,
                description="Поиск компаний по фильтрам: отрасль, размер, география, выручка"
            ),
            Tool(
                name="search_by_products",
                func=self._product_search,
                description="Поиск компаний по продуктам и услугам"
            ),
        ]
        
        # Промпт для агента
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """Ты - умный помощник по поиску бизнес-партнеров на B2B платформе.
            
            Твоя задача - понять запрос пользователя и найти наиболее подходящие компании.
            
            У тебя есть доступ к следующим инструментам:
            - search_by_semantic: для поиска по смыслу запроса
            - search_by_filters: для фильтрации по параметрам компании
            - search_by_products: для поиска по конкретным продуктам/услугам
            
            Сначала проанализируй запрос:
            1. Определи, что ищет пользователь (поставщика, клиента, партнера)
            2. Извлеки ключевые критерии (отрасль, продукты, география)
            3. Используй подходящие инструменты
            4. Объедини и ранжируй результаты
            
            Отвечай на русском языке, будь точным и полезным."""),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Создание агента
        self.agent = create_openai_functions_agent(llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=True,
            max_iterations=3,
        )
    
    async def _semantic_search(self, query: str) -> str:
        """Семантический поиск компаний"""
        try:
            # Генерация embedding для запроса
            query_embedding = await self.embedding_service.get_embedding(query)
            
            # Vector search в БД
            results = await self.vector_search.search_companies(
                query_embedding,
                limit=10
            )
            
            return json.dumps({
                "results": results,
                "count": len(results),
            }, ensure_ascii=False)
            
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return json.dumps({"error": str(e)})
    
    async def _filter_search(self, filters: str) -> str:
        """Поиск по фильтрам"""
        try:
            # Парсинг фильтров из строки
            filters_dict = json.loads(filters)
            
            async with async_session_maker() as session:
                from app.models.database import Company
                
                query = select(Company).where(Company.is_active == True)
                
                if "industry" in filters_dict:
                    query = query.where(Company.industry == filters_dict["industry"])
                
                if "company_size" in filters_dict:
                    query = query.where(Company.company_size == filters_dict["company_size"])
                
                if "revenue_range" in filters_dict:
                    query = query.where(Company.revenue_range == filters_dict["revenue_range"])
                
                result = await session.execute(query.limit(10))
                companies = result.scalars().all()
                
                return json.dumps({
                    "results": [
                        {
                            "id": str(c.id),
                            "name": c.full_name,
                            "industry": c.industry,
                            "company_size": c.company_size,
                        }
                        for c in companies
                    ],
                    "count": len(companies),
                }, ensure_ascii=False)
                
        except Exception as e:
            logger.error(f"Filter search error: {e}")
            return json.dumps({"error": str(e)})
    
    async def _product_search(self, product_query: str) -> str:
        """Поиск по продуктам/услугам"""
        try:
            # Embedding для продукта
            query_embedding = await self.embedding_service.get_embedding(product_query)
            
            # Поиск похожих продуктов
            results = await self.vector_search.search_products(
                query_embedding,
                limit=20
            )
            
            # Группировка по компаниям
            companies = {}
            for product in results:
                company_id = product["company_id"]
                if company_id not in companies:
                    companies[company_id] = {
                        "company_id": company_id,
                        "company_name": product["company_name"],
                        "products": [],
                    }
                companies[company_id]["products"].append({
                    "name": product["name"],
                    "description": product["description"],
                    "similarity": product["similarity"],
                })
            
            return json.dumps({
                "results": list(companies.values())[:10],
                "count": len(companies),
            }, ensure_ascii=False)
            
        except Exception as e:
            logger.error(f"Product search error: {e}")
            return json.dumps({"error": str(e)})
    
    async def search(self, query: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Главный метод поиска"""
        try:
            logger.info(f"Smart search query: {query}")
            
            # Запуск агента
            result = await self.agent_executor.ainvoke({
                "input": query,
            })
            
            # Парсинг результата
            output = result.get("output", "")
            
            # Извлечение компаний из результата
            companies = self._extract_companies_from_output(output)
            
            return {
                "companies": companies,
                "total": len(companies),
                "explanation": output,
                "query": query,
            }
            
        except Exception as e:
            logger.error(f"Search agent error: {e}")
            raise
    
    def _extract_companies_from_output(self, output: str) -> List[Dict[str, Any]]:
        """Извлечение списка компаний из ответа агента"""
        companies = []
        
        try:
            # Попытка найти JSON в ответе
            import re
            json_match = re.search(r'\{.*\}', output, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                if "results" in data:
                    companies = data["results"]
        except:
            pass
        
        return companies


# Функция для использования в consumers
async def process_search_task(task_data: Dict[str, Any]) -> Dict[str, Any]:
    """Обработка задачи поиска из очереди"""
    try:
        agent = SmartSearchAgent()
        
        query = task_data.get("query")
        filters = task_data.get("filters", {})
        
        result = await agent.search(query, context=filters)
        
        return {
            "status": "completed",
            "result": result,
        }
        
    except Exception as e:
        logger.error(f"Search task processing error: {e}")
        return {
            "status": "failed",
            "error": str(e),
        }
```

### 2. app/services/vector_search_service.py
```python
from sqlalchemy import text
from app.config.database import async_session_maker
from app.utils.logger import logger
from typing import List, Dict, Any
import numpy as np

class VectorSearchService:
    """Сервис для векторного поиска с использованием pgvector"""
    
    async def search_companies(
        self,
        query_embedding: List[float],
        limit: int = 10,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Поиск компаний по embedding"""
        try:
            async with async_session_maker() as session:
                # pgvector поиск с cosine similarity
                query = text("""
                    SELECT 
                        c.id,
                        c.full_name,
                        c.industry,
                        c.company_size,
                        c.description,
                        1 - (c.description_embedding <=> :embedding) as similarity
                    FROM companies c
                    WHERE c.is_active = true
                        AND c.description_embedding IS NOT NULL
                        AND 1 - (c.description_embedding <=> :embedding) > :threshold
                    ORDER BY similarity DESC
                    LIMIT :limit
                """)
                
                result = await session.execute(
                    query,
                    {
                        "embedding": str(query_embedding),
                        "threshold": threshold,
                        "limit": limit,
                    }
                )
                
                companies = []
                for row in result:
                    companies.append({
                        "id": str(row.id),
                        "name": row.full_name,
                        "industry": row.industry,
                        "company_size": row.company_size,
                        "description": row.description,
                        "similarity": float(row.similarity),
                    })
                
                return companies
                
        except Exception as e:
            logger.error(f"Vector search error: {e}")
            return []
    
    async def search_products(
        self,
        query_embedding: List[float],
        limit: int = 20,
        threshold: float = 0.6
    ) -> List[Dict[str, Any]]:
        """Поиск продуктов/услуг по embedding"""
        try:
            async with async_session_maker() as session:
                query = text("""
                    SELECT 
                        p.id,
                        p.name,
                        p.description,
                        p.company_id,
                        c.full_name as company_name,
                        1 - (p.embedding <=> :embedding) as similarity
                    FROM products_services_offered p
                    JOIN companies c ON p.company_id = c.id
                    WHERE p.is_active = true
                        AND p.embedding IS NOT NULL
                        AND 1 - (p.embedding <=> :embedding) > :threshold
                    ORDER BY similarity DESC
                    LIMIT :limit
                """)
                
                result = await session.execute(
                    query,
                    {
                        "embedding": str(query_embedding),
                        "threshold": threshold,
                        "limit": limit,
                    }
                )
                
                products = []
                for row in result:
                    products.append({
                        "id": str(row.id),
                        "name": row.name,
                        "description": row.description,
                        "company_id": str(row.company_id),
                        "company_name": row.company_name,
                        "similarity": float(row.similarity),
                    })
                
                return products
                
        except Exception as e:
            logger.error(f"Product vector search error: {e}")
            return []
    
    async def update_company_embedding(self, company_id: str, embedding: List[float]):
        """Обновление embedding для компании"""
        try:
            async with async_session_maker() as session:
                query = text("""
                    UPDATE companies
                    SET description_embedding = :embedding
                    WHERE id = :company_id
                """)
                
                await session.execute(
                    query,
                    {
                        "company_id": company_id,
                        "embedding": str(embedding),
                    }
                )
                await session.commit()
                
        except Exception as e:
            logger.error(f"Update embedding error: {e}")
            raise
    
    async def update_product_embedding(self, product_id: str, embedding: List[float]):
        """Обновление embedding для продукта"""
        try:
            async with async_session_maker() as session:
                query = text("""
                    UPDATE products_services_offered
                    SET embedding = :embedding
                    WHERE id = :product_id
                """)
                
                await session.execute(
                    query,
                    {
                        "product_id": product_id,
                        "embedding": str(embedding),
                    }
                )
                await session.commit()
                
        except Exception as e:
            logger.error(f"Update product embedding error: {e}")
            raise
```

### 3. app/services/embedding_service.py
```python
from app.config.langchain import embeddings
from app.utils.logger import logger
from typing import List

class EmbeddingService:
    """Сервис для генерации embeddings"""
    
    async def get_embedding(self, text: str) -> List[float]:
        """Генерация embedding для текста"""
        try:
            if not text or not text.strip():
                return [0.0] * 1536  # Размер OpenAI embeddings
            
            embedding = await embeddings.aembed_query(text)
            return embedding
            
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            raise
    
    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Генерация embeddings для нескольких текстов"""
        try:
            embeddings_list = await embeddings.aembed_documents(texts)
            return embeddings_list
            
        except Exception as e:
            logger.error(f"Batch embedding generation error: {e}")
            raise
```

### 4. app/consumers/task_consumer.py (часть для search)
```python
import json
import asyncio
from app.config.rabbitmq import get_rabbitmq_connection, QUEUES
from app.agents.search_agent import process_search_task
from app.utils.logger import logger

async def consume_search_tasks():
    """Consumer для задач умного поиска"""
    connection, channel = await get_rabbitmq_connection()
    
    queue = await channel.declare_queue(QUEUES["SMART_SEARCH"], durable=True)
    
    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                try:
                    task_data = json.loads(message.body.decode())
                    logger.info(f"Processing search task: {task_data.get('query')}")
                    
                    result = await process_search_task(task_data)
                    
                    logger.info(f"Search task completed: {result['status']}")
                    
                except Exception as e:
                    logger.error(f"Error processing search task: {e}")
```

### 5. app/routes/search.py
```python
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import SearchTask, SearchResponse
from app.agents.search_agent import SmartSearchAgent
from app.utils.logger import logger

router = APIRouter()

@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(task: SearchTask):
    """Семантический поиск компаний"""
    try:
        agent = SmartSearchAgent()
        result = await agent.search(task.query, context=task.filters)
        
        return SearchResponse(
            companies=result["companies"],
            total=result["total"],
            relevance_scores={
                c["id"]: c.get("similarity", 0.0)
                for c in result["companies"]
            }
        )
        
    except Exception as e:
        logger.error(f"Semantic search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

## Критерии приёмки
- [ ] Smart Search Agent создан с LangChain
- [ ] Семантический поиск через pgvector работает
- [ ] Поиск по продуктам/услугам работает
- [ ] Фильтрация компаний работает
- [ ] NLP обработка запросов работает
- [ ] Consumer для очереди search tasks работает
- [ ] Embeddings генерируются и сохраняются в БД
- [ ] API endpoint для semantic search работает

## Зависимости
- Задача 01-ai-service-setup
- Задача 01-database-schema

## Приоритет
Высокий (P1)

## Оценка времени
8-12 часов

