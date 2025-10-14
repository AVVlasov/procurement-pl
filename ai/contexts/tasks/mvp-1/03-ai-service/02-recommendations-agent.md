# Задача: AI Recommendations Agent (MVP 1)

## Описание
AI агент для генерации персонализированных рекомендаций партнеров.

## Цель
Рекомендовать релевантные компании на основе профиля и потребностей пользователя.

## Технические требования

### 1. Recommendations Service

**ai-service/services/recommendations_service.py**
```python
from typing import List, Dict
from .embedding_service import EmbeddingService

class RecommendationsService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
    
    async def generate_recommendations(
        self, 
        user_company_id: int,
        db_pool,
        limit: int = 10
    ) -> List[Dict]:
        """Генерация рекомендаций для компании"""
        
        # Получить профиль компании
        company = await db_pool.fetchrow(
            "SELECT * FROM companies WHERE id = $1",
            user_company_id
        )
        
        # Получить потребности компании
        needs = await db_pool.fetch(
            "SELECT * FROM products WHERE company_id = $1 AND type = 'needed'",
            user_company_id
        )
        
        recommendations = []
        
        # Найти компании с подходящими предложениями
        for need in needs:
            if not need['embedding']:
                continue
                
            matches = await db_pool.fetch("""
                SELECT 
                    p.*,
                    c.full_name, c.industry, c.description,
                    1 - (p.embedding <=> $1::vector) as match_score
                FROM products p
                JOIN companies c ON c.id = p.company_id
                WHERE p.type = 'offered' 
                  AND p.company_id != $2
                  AND p.embedding IS NOT NULL
                ORDER BY p.embedding <=> $1::vector
                LIMIT 5
            """, need['embedding'], user_company_id)
            
            for match in matches:
                recommendations.append({
                    'company': {
                        'id': match['company_id'],
                        'full_name': match['full_name'],
                        'industry': match['industry'],
                        'description': match['description'],
                    },
                    'matched_product': match['name'],
                    'your_need': need['name'],
                    'match_score': round(match['match_score'] * 100, 2),
                    'reason': f"Они предлагают '{match['name']}', которое соответствует вашей потребности '{need['name']}'"
                })
        
        # Сортировка по score и удаление дубликатов
        unique_companies = {}
        for rec in recommendations:
            company_id = rec['company']['id']
            if company_id not in unique_companies or rec['match_score'] > unique_companies[company_id]['match_score']:
                unique_companies[company_id] = rec
        
        result = list(unique_companies.values())
        result.sort(key=lambda x: x['match_score'], reverse=True)
        
        return result[:limit]
```

### 2. API Endpoint

**ai-service/routers/recommendations.py**
```python
from fastapi import APIRouter, Depends
from services.recommendations_service import RecommendationsService

router = APIRouter()
recommendations_service = RecommendationsService()

@router.get("/recommendations/{company_id}")
async def get_recommendations(company_id: int, limit: int = 10):
    recommendations = await recommendations_service.generate_recommendations(
        company_id, 
        get_db_pool(),
        limit
    )
    return {"recommendations": recommendations}
```

## Критерии приёмки
- [ ] Агент рекомендаций реализован
- [ ] Matching между needs и offers работает
- [ ] Match score вычисляется
- [ ] AI объяснения генерируются
- [ ] API endpoint работает

## Приоритет
Средний (P2)

## Оценка времени
3 дня

