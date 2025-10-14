# Задача: Виджет рекомендаций партнеров (MVP 1)

## Описание
Создание виджета с AI рекомендациями потенциальных партнеров на главной странице.

## Цель
Показать пользователям релевантные компании для сотрудничества с объяснением от AI.

## Технические требования

### 1. Redux slice для рекомендаций

**src/store/slices/recommendationsSlice.js**
```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recommendationsAPI } from '../../api/recommendations';

export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetchRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await recommendationsAPI.getRecommendations();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const refreshRecommendations = createAsyncThunk(
  'recommendations/refreshRecommendations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await recommendationsAPI.refreshRecommendations();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastUpdated: null,
  },
  reducers: {
    clearRecommendations: (state) => {
      state.items = [];
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch recommendations
    builder
      .addCase(fetchRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.recommendations;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Refresh recommendations
    builder
      .addCase(refreshRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.recommendations;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(refreshRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearRecommendations } = recommendationsSlice.actions;
export default recommendationsSlice.reducer;
```

### 2. API для рекомендаций

**src/api/recommendations.js**
```javascript
import client from './client';

export const recommendationsAPI = {
  getRecommendations: () => client.get('/recommendations'),
  refreshRecommendations: () => client.post('/recommendations/refresh'),
  dismissRecommendation: (id) => client.post(`/recommendations/${id}/dismiss`),
};
```

### 3. Обновление store

**src/store/index.js**
```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import companyReducer from './slices/companySlice';
import productsReducer from './slices/productsSlice';
import searchReducer from './slices/searchSlice';
import uiReducer from './slices/uiSlice';
import recommendationsReducer from './slices/recommendationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    company: companyReducer,
    products: productsReducer,
    search: searchReducer,
    ui: uiReducer,
    recommendations: recommendationsReducer,
  },
  // ... остальная конфигурация
});

export default store;
```

### 4. Компонент виджета рекомендаций

**src/components/recommendations/RecommendationsWidget.jsx**
```jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchRecommendations, refreshRecommendations } from '../../store/slices/recommendationsSlice';
import { Card, Button, Badge, Spinner } from '../ui';

function RecommendationsWidget() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, error, lastUpdated } = useSelector(
    (state) => state.recommendations
  );

  useEffect(() => {
    // Загрузить рекомендации при монтировании
    if (items.length === 0) {
      dispatch(fetchRecommendations());
    }
  }, [dispatch, items.length]);

  const handleRefresh = () => {
    dispatch(refreshRecommendations());
  };

  const handleViewCompany = (companyId) => {
    navigate(`/company/${companyId}`);
  };

  if (loading && items.length === 0) {
    return (
      <Card>
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-error mb-4">Ошибка загрузки рекомендаций</p>
          <Button variant="outline" onClick={handleRefresh}>
            Попробовать снова
          </Button>
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🤝</div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Пока нет рекомендаций
          </h3>
          <p className="text-secondary-600 mb-4">
            Заполните профиль компании, чтобы получить персонализированные рекомендации
          </p>
          <Button onClick={() => navigate('/profile')}>
            Перейти в профиль
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900">
            Рекомендуемые партнеры
          </h2>
          <p className="text-sm text-secondary-600 mt-1">
            AI подобрал компании специально для вас
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          loading={loading}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Обновить
        </Button>
      </div>

      {/* Recommendations list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onClick={() => handleViewCompany(recommendation.company.id)}
          />
        ))}
      </div>

      {lastUpdated && (
        <p className="text-xs text-secondary-500 text-center">
          Обновлено: {new Date(lastUpdated).toLocaleString('ru-RU')}
        </p>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation, onClick }) {
  const { company, match_score, reason, matched_needs } = recommendation;

  return (
    <Card hoverable onClick={onClick}>
      {/* Score badge */}
      <div className="flex items-start justify-between mb-3">
        <Badge variant={match_score >= 80 ? 'success' : 'primary'}>
          {match_score}% совпадение
        </Badge>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Dismiss recommendation
          }}
          className="text-secondary-400 hover:text-secondary-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Company info */}
      <h3 className="text-lg font-semibold text-secondary-900 mb-2 line-clamp-1">
        {company.full_name}
      </h3>

      {company.industry && (
        <Badge variant="primary" className="mb-3">
          {company.industry}
        </Badge>
      )}

      {company.description && (
        <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
          {company.description}
        </p>
      )}

      {/* AI explanation */}
      {reason && (
        <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mb-3">
          <div className="flex items-start space-x-2">
            <span className="text-primary-600 text-lg flex-shrink-0">💡</span>
            <p className="text-sm text-primary-900">
              {reason}
            </p>
          </div>
        </div>
      )}

      {/* Matched needs */}
      {matched_needs && matched_needs.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-secondary-500 uppercase">
            Совпадения:
          </p>
          <div className="flex flex-wrap gap-1">
            {matched_needs.slice(0, 3).map((need, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-success/10 text-success text-xs rounded"
              >
                ✓ {need}
              </span>
            ))}
            {matched_needs.length > 3 && (
              <span className="text-xs text-secondary-500">
                +{matched_needs.length - 3} еще
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default RecommendationsWidget;
```

### 5. Компактный виджет для боковой панели

**src/components/recommendations/RecommendationsSidebar.jsx**
```jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchRecommendations } from '../../store/slices/recommendationsSlice';
import { Card, Badge, Spinner } from '../ui';

function RecommendationsSidebar({ limit = 3 }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector((state) => state.recommendations);

  useEffect(() => {
    if (items.length === 0) {
      dispatch(fetchRecommendations());
    }
  }, [dispatch, items.length]);

  const displayItems = items.slice(0, limit);

  if (loading && items.length === 0) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-secondary-900">
          Рекомендации
        </h3>
        <button
          onClick={() => navigate('/')}
          className="text-primary-600 hover:text-primary-700 text-sm"
        >
          Все →
        </button>
      </div>

      <div className="space-y-3">
        {displayItems.map((rec) => (
          <div
            key={rec.id}
            onClick={() => navigate(`/company/${rec.company.id}`)}
            className="group cursor-pointer p-3 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-sm font-medium text-secondary-900 group-hover:text-primary-600 line-clamp-1">
                {rec.company.full_name}
              </h4>
              <Badge variant="success" className="text-xs ml-2 flex-shrink-0">
                {rec.match_score}%
              </Badge>
            </div>
            {rec.reason && (
              <p className="text-xs text-secondary-600 line-clamp-2">
                {rec.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default RecommendationsSidebar;
```

### 6. Интеграция в главную страницу

**src/pages/Search.jsx** (обновленный)
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { performAISearch } from '../store/slices/searchSlice';
import { Button, Card, Spinner } from '../components/ui';
import RecommendationsWidget from '../components/recommendations/RecommendationsWidget';

function Search() {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { results, loading, error, searched } = useSelector(
    (state) => state.search
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    dispatch(performAISearch(query.trim()));
  };

  return (
    <div className="space-y-8">
      {/* Search form */}
      <Card>
        <h1 className="text-3xl font-bold text-secondary-900 mb-6">
          AI Поиск компаний
        </h1>

        <form onSubmit={handleSearch}>
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Например: Ищу IT компанию для разработки веб-приложения"
              className="flex-1 input"
            />
            <Button type="submit" loading={loading} size="lg">
              Найти
            </Button>
          </div>
          <p className="text-sm text-secondary-600 mt-2">
            Опишите, что вы ищете на естественном языке. AI найдет релевантные компании.
          </p>
        </form>
      </Card>

      {/* Search results */}
      {searched && (
        <div>
          {/* ... результаты поиска ... */}
        </div>
      )}

      {/* Recommendations widget - показываем только если не было поиска */}
      {!searched && (
        <RecommendationsWidget />
      )}
    </div>
  );
}

export default Search;
```

### 7. Toast уведомления

**src/components/ui/Toast.jsx**
```jsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideToast } from '../../store/slices/uiSlice';

function Toast() {
  const dispatch = useDispatch();
  const { toast } = useSelector((state) => state.ui);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, dispatch]);

  if (!toast.show) return null;

  const variants = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    warning: 'bg-warning text-white',
    info: 'bg-primary-600 text-white',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className={`${variants[toast.type]} rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md`}>
        <span className="text-2xl">{icons[toast.type]}</span>
        <p className="flex-1">{toast.message}</p>
        <button
          onClick={() => dispatch(hideToast())}
          className="text-white/80 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Toast;
```

### 8. Добавление Toast в App

**src/App.jsx**
```jsx
import Toast from './components/ui/Toast';

function App() {
  // ... остальной код

  return (
    <>
      <Routes>
        {/* ... маршруты ... */}
      </Routes>
      <Toast />
    </>
  );
}
```

## Критерии приёмки
- [ ] Redux slice для рекомендаций реализован
- [ ] API для получения рекомендаций подключен
- [ ] Виджет рекомендаций отображается на главной
- [ ] Карточки рекомендаций показывают AI объяснения
- [ ] Match score отображается для каждой рекомендации
- [ ] Кнопка "Обновить" работает
- [ ] Клик по карточке открывает профиль компании
- [ ] Компактный виджет для боковой панели работает
- [ ] Toast уведомления реализованы
- [ ] Responsive дизайн работает

## Зависимости
- Задача 01-tailwind-setup
- Задача 02-redux-setup
- Задача 02-recommendations-agent (AI service)
- Задача 03-recommendations-api (backend)

## Приоритет
Средний (P2)

## Оценка времени
3-4 дня

## Примечания
Виджет рекомендаций - это ключевая функция MVP 1, которая демонстрирует возможности AI для подбора партнеров.

