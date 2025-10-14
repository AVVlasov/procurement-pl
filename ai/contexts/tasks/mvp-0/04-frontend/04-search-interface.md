# Задача: Интерфейс поиска (MVP 0)

## Описание
Простой интерфейс для AI поиска компаний.

## Цель
Продемонстрировать работу AI агента для поиска компаний.

## Технические требования

### 1. src/pages/Search.jsx
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../api/search';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Введите запрос');
      return;
    }

    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const data = await searchAPI.aiSearch(query.trim());
      setResults(data.companies || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка поиска');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const viewCompany = (companyId) => {
    navigate(`/company/${companyId}`);
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>AI Поиск компаний</h1>

      {/* Форма поиска */}
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: Ищу IT компанию для разработки веб-приложения"
            style={{
              flex: 1,
              padding: '0.75rem',
              fontSize: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ padding: '0.75rem 2rem' }}
          >
            {loading ? 'Поиск...' : 'Найти'}
          </button>
        </div>
        
        <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
          Опишите, что вы ищете на естественном языке. AI агент найдет релевантные компании.
        </p>
      </form>

      {/* Ошибка */}
      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee', 
          color: '#c00', 
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {/* Результаты */}
      {searched && !loading && (
        <div>
          <h2 style={{ marginBottom: '1rem' }}>
            Найдено компаний: {results.length}
          </h2>

          {results.length === 0 ? (
            <p style={{ color: '#666' }}>
              По вашему запросу ничего не найдено. Попробуйте изменить запрос.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((company) => (
                <div
                  key={company.id}
                  style={{
                    padding: '1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => viewCompany(company.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0066cc';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <h3 style={{ marginBottom: '0.5rem' }}>
                    {company.full_name}
                  </h3>
                  
                  <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    ИНН: {company.inn}
                  </p>
                  
                  {company.description && (
                    <p style={{ marginBottom: '0.5rem' }}>
                      {company.description}
                    </p>
                  )}
                  
                  {company.website && (
                    <p style={{ color: '#0066cc', fontSize: '0.875rem' }}>
                      🌐 {company.website}
                    </p>
                  )}
                  
                  {company.relevance_score && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.875rem', 
                      color: '#666' 
                    }}>
                      Релевантность: {(company.relevance_score * 100).toFixed(0)}%
                    </div>
                  )}
                  
                  {company.explanation && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      backgroundColor: '#f0f8ff', 
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}>
                      💡 {company.explanation}
                    </div>
                  )}
                  
                  {company.matched_product && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      backgroundColor: '#f0fff0', 
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                    }}>
                      ✓ Найдено: {company.matched_product}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Примеры запросов */}
      {!searched && (
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Примеры запросов:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {[
              'Ищу IT компанию для разработки веб-приложения',
              'Нужен поставщик офисной мебели',
              'Компания, которая предоставляет бухгалтерские услуги',
              'Производитель упаковочных материалов',
            ].map((example, index) => (
              <li key={index} style={{ marginBottom: '0.5rem' }}>
                <button
                  onClick={() => setQuery(example)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0066cc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '0.5rem',
                  }}
                >
                  → {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Search;
```

## Критерии приёмки
- [ ] Форма поиска работает
- [ ] AI запрос отправляется к backend
- [ ] Результаты отображаются
- [ ] Релевантность компаний показывается
- [ ] Клик по компании открывает профиль
- [ ] Примеры запросов кликабельны
- [ ] Обработка ошибок работает
- [ ] Loading state отображается
- [ ] Пустые результаты обрабатываются

## Зависимости
- Задача 01-react-vite-setup
- Задача 02-simple-api-integration (backend)
- Задача 01-adapt-search-agent (AI service)

## Приоритет
Критический (P0)

## Оценка времени
2-3 часа

## Примечания
Это основной демонстрационный функционал MVP 0, показывающий работу AI агента для поиска.


