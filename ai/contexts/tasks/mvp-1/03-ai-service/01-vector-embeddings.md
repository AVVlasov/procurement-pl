# Задача: Vector Embeddings для компаний и продуктов (MVP 1)

## Описание
Генерация векторных представлений (embeddings) для компаний и продуктов с использованием OpenAI для семантического поиска.

## Цель
Улучшить AI поиск через векторное сходство вместо простого текстового совпадения.

## Технические требования

### 1. Embedding Service

**ai-service/services/embedding_service.py**
```python
import openai
import numpy as np
from typing import List, Dict
import asyncpg

class EmbeddingService:
    def __init__(self):
        self.model = "text-embedding-ada-002"
        self.dimension = 1536
        
    async def generate_embedding(self, text: str) -> List[float]:
        """Генерация embedding для текста"""
        response = await openai.Embedding.acreate(
            model=self.model,
            input=text
        )
        return response['data'][0]['embedding']
    
    async def generate_company_embedding(self, company: Dict) -> List[float]:
        """Генерация embedding для компании"""
        text = f"""
        Компания: {company['full_name']}
        Сфера: {company.get('industry', '')}
        Описание: {company.get('description', '')}
        """
        return await self.generate_embedding(text.strip())
    
    async def generate_product_embedding(self, product: Dict) -> List[float]:
        """Генерация embedding для продукта"""
        text = f"""
        Тип: {'Предлагает' if product['type'] == 'offered' else 'Ищет'}
        Название: {product['name']}
        Описание: {product.get('description', '')}
        """
        return await self.generate_embedding(text.strip())
    
    async def update_all_embeddings(self, db_pool):
        """Обновление всех embeddings в БД"""
        # Компании
        companies = await db_pool.fetch("SELECT * FROM companies")
        for company in companies:
            embedding = await self.generate_company_embedding(dict(company))
            await db_pool.execute(
                "UPDATE companies SET embedding = $1 WHERE id = $2",
                embedding, company['id']
            )
        
        # Продукты
        products = await db_pool.fetch("SELECT * FROM products")
        for product in products:
            embedding = await self.generate_product_embedding(dict(product))
            await db_pool.execute(
                "UPDATE products SET embedding = $1 WHERE id = $2",
                embedding, product['id']
            )
    
    async def semantic_search(
        self, 
        query: str, 
        db_pool, 
        limit: int = 10
    ) -> List[Dict]:
        """Семантический поиск компаний"""
        query_embedding = await self.generate_embedding(query)
        
        # Векторный поиск через pgvector
        results = await db_pool.fetch("""
            SELECT 
                c.*,
                1 - (c.embedding <=> $1::vector) as similarity
            FROM companies c
            WHERE c.embedding IS NOT NULL
            ORDER BY c.embedding <=> $1::vector
            LIMIT $2
        """, query_embedding, limit)
        
        return [dict(r) for r in results]
```

## Критерии приёмки
- [ ] Embeddings генерируются для компаний
- [ ] Embeddings генерируются для продуктов
- [ ] pgvector расширение используется
- [ ] Векторный поиск работает
- [ ] API endpoint для поиска создан

## Приоритет
Высокий (P1)

## Оценка времени
3 дня

