# Задача: Настройка Redux Toolkit (MVP 1)

## Описание
Внедрение Redux Toolkit для централизованного управления состоянием приложения.

## Цель
Заменить локальное состояние компонентов на централизованное хранилище для улучшения масштабируемости и предсказуемости.

## Технические требования

### 1. Установка зависимостей

```bash
cd frontend
npm install @reduxjs/toolkit react-redux
```

### 2. Структура store

```
src/
├── store/
│   ├── index.js
│   ├── slices/
│   │   ├── authSlice.js
│   │   ├── companySlice.js
│   │   ├── productsSlice.js
│   │   ├── searchSlice.js
│   │   └── uiSlice.js
│   └── api/
│       └── baseApi.js (RTK Query, опционально)
```

### 3. src/store/index.js

```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import companyReducer from './slices/companySlice';
import productsReducer from './slices/productsSlice';
import searchReducer from './slices/searchSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    company: companyReducer,
    products: productsReducer,
    search: searchReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Игнорировать определенные пути для серииализации
        ignoredActions: ['ui/showToast'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

export default store;
```

### 4. src/store/slices/authSlice.js

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../api/auth';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка входа');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      localStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка регистрации');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getMe();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Ошибка получения данных');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch current user
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Если токен невалидный - разлогинить
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem('token');
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

### 5. src/store/slices/companySlice.js

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companiesAPI } from '../../api/companies';

export const fetchMyCompany = createAsyncThunk(
  'company/fetchMyCompany',
  async (_, { rejectWithValue }) => {
    try {
      const response = await companiesAPI.getMyCompany();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchCompanyById = createAsyncThunk(
  'company/fetchCompanyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await companiesAPI.getCompany(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateCompany = createAsyncThunk(
  'company/updateCompany',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await companiesAPI.updateCompany(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const companySlice = createSlice({
  name: 'company',
  initialState: {
    myCompany: null,
    currentCompany: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentCompany: (state) => {
      state.currentCompany = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch my company
    builder
      .addCase(fetchMyCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.myCompany = action.payload.company;
      })
      .addCase(fetchMyCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch company by ID
    builder
      .addCase(fetchCompanyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCompany = action.payload.company;
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update company
    builder
      .addCase(updateCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.myCompany = action.payload.company;
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCompany, clearError } = companySlice.actions;
export default companySlice.reducer;
```

### 6. src/store/slices/productsSlice.js

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsAPI } from '../../api/products';

export const fetchMyProducts = createAsyncThunk(
  'products/fetchMyProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productsAPI.getMyProducts();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await productsAPI.createProduct(productData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await productsAPI.updateProduct(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await productsAPI.deleteProduct(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    offered: [],
    needed: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchMyProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.offered = action.payload.offered || [];
        state.needed = action.payload.needed || [];
      })
      .addCase(fetchMyProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create product
    builder
      .addCase(createProduct.fulfilled, (state, action) => {
        const product = action.payload.product;
        if (product.type === 'offered') {
          state.offered.push(product);
        } else {
          state.needed.push(product);
        }
      });

    // Update product
    builder
      .addCase(updateProduct.fulfilled, (state, action) => {
        const updated = action.payload.product;
        const listKey = updated.type === 'offered' ? 'offered' : 'needed';
        const index = state[listKey].findIndex(p => p.id === updated.id);
        if (index !== -1) {
          state[listKey][index] = updated;
        }
      });

    // Delete product
    builder
      .addCase(deleteProduct.fulfilled, (state, action) => {
        const id = action.payload;
        state.offered = state.offered.filter(p => p.id !== id);
        state.needed = state.needed.filter(p => p.id !== id);
      });
  },
});

export const { clearError } = productsSlice.actions;
export default productsSlice.reducer;
```

### 7. src/store/slices/searchSlice.js

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { searchAPI } from '../../api/search';

export const performAISearch = createAsyncThunk(
  'search/performAISearch',
  async (query, { rejectWithValue }) => {
    try {
      const response = await searchAPI.aiSearch(query);
      return { query, results: response.companies };
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    results: [],
    loading: false,
    error: null,
    searched: false,
  },
  reducers: {
    clearResults: (state) => {
      state.results = [];
      state.query = '';
      state.searched = false;
      state.error = null;
    },
    setQuery: (state, action) => {
      state.query = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(performAISearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performAISearch.fulfilled, (state, action) => {
        state.loading = false;
        state.query = action.payload.query;
        state.results = action.payload.results;
        state.searched = true;
      })
      .addCase(performAISearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.searched = true;
      });
  },
});

export const { clearResults, setQuery } = searchSlice.actions;
export default searchSlice.reducer;
```

### 8. src/store/slices/uiSlice.js

```javascript
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toast: {
      show: false,
      message: '',
      type: 'info', // info, success, warning, error
    },
    modal: {
      show: false,
      type: null,
      data: null,
    },
  },
  reducers: {
    showToast: (state, action) => {
      state.toast = {
        show: true,
        message: action.payload.message,
        type: action.payload.type || 'info',
      };
    },
    hideToast: (state) => {
      state.toast.show = false;
    },
    showModal: (state, action) => {
      state.modal = {
        show: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    hideModal: (state) => {
      state.modal.show = false;
      state.modal.type = null;
      state.modal.data = null;
    },
  },
});

export const { showToast, hideToast, showModal, hideModal } = uiSlice.actions;
export default uiSlice.reducer;
```

### 9. Обновление src/main.jsx

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
```

### 10. Обновление App.jsx с Redux

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './store/slices/authSlice';

import Login from './pages/Login';
import Register from './pages/Register';
import CompanyProfile from './pages/CompanyProfile';
import Search from './pages/Search';
import Layout from './components/Layout';
import { Spinner } from './components/ui';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Проверка токена при загрузке
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
      />

      {/* Защищенные маршруты */}
      {isAuthenticated ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Search />} />
          <Route path="/profile" element={<CompanyProfile />} />
          <Route path="/company/:id" element={<CompanyProfile />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
```

### 11. Пример использования в Login.jsx

```jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import { Button, Input } from '../components/ui';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    // Очистить ошибки при размонтировании
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-card-hover p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Добро пожаловать
            </h1>
            <p className="text-secondary-600">Войдите в свой аккаунт</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />

            <Input
              type="password"
              label="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
            />

            {error && (
              <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
                {error.error || 'Ошибка входа'}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading}>
              Войти
            </Button>
          </form>

          <p className="mt-6 text-center text-secondary-600 text-sm">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
```

### 12. Хуки для удобного использования

**src/hooks/useAuth.js**
```javascript
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  
  return {
    user,
    isAuthenticated,
    loading,
  };
};
```

**src/hooks/useToast.js**
```javascript
import { useDispatch } from 'react-redux';
import { showToast } from '../store/slices/uiSlice';

export const useToast = () => {
  const dispatch = useDispatch();
  
  return {
    success: (message) => dispatch(showToast({ message, type: 'success' })),
    error: (message) => dispatch(showToast({ message, type: 'error' })),
    warning: (message) => dispatch(showToast({ message, type: 'warning' })),
    info: (message) => dispatch(showToast({ message, type: 'info' })),
  };
};
```

## Критерии приёмки
- [ ] Redux Toolkit установлен
- [ ] Store настроен с reducers
- [ ] Auth slice реализован с async thunks
- [ ] Company slice реализован
- [ ] Products slice реализован
- [ ] Search slice реализован
- [ ] UI slice для toast/modal реализован
- [ ] App.jsx обновлен для использования Redux
- [ ] Login.jsx использует Redux
- [ ] Хуки useAuth и useToast созданы
- [ ] Redux DevTools работает

## Зависимости
- Задача 01-tailwind-setup

## Приоритет
Высокий (P1)

## Оценка времени
3-4 дня

## Примечания
Redux Toolkit значительно упрощает работу с Redux за счет встроенных утилит и уменьшения boilerplate кода.

