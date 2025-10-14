# Задача: React + Vite Setup (MVP 0)

## Описание
Создание минимального React приложения на Vite без сложных зависимостей.

## Цель
Быстро настроить frontend для работы с backend API.

## Технические требования

### 1. Инициализация проекта
```bash
cd frontend
npm create vite@latest . -- --template react
npm install
```

### 2. package.json (минимальный)
```json
{
  "name": "b2b-platform-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
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

### 3. vite.config.js
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

### 4. src/main.jsx
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

### 5. src/App.jsx
```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Pages (будут созданы в следующих задачах)
import Login from './pages/Login';
import Register from './pages/Register';
import CompanyProfile from './pages/CompanyProfile';
import Search from './pages/Search';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверка токена при загрузке
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
      <Route path="/register" element={<Register setAuth={setIsAuthenticated} />} />

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

### 6. src/api/client.js
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавление токена к запросам
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обработка ответов
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Разлогинить при 401
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

### 7. src/api/auth.js
```javascript
import client from './client';

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (credentials) => client.post('/auth/login', credentials),
  getMe: () => client.get('/auth/me'),
};
```

### 8. src/api/companies.js
```javascript
import client from './client';

export const companiesAPI = {
  getCompany: (id) => client.get(`/companies/${id}`),
  getMyCompany: () => client.get('/companies/my/profile'),
  updateCompany: (id, data) => client.put(`/companies/${id}`, data),
  searchCompanies: (query) => client.get(`/companies/search?q=${encodeURIComponent(query)}`),
};
```

### 9. src/api/products.js
```javascript
import client from './client';

export const productsAPI = {
  getMyProducts: () => client.get('/products/my'),
  createProduct: (data) => client.post('/products', data),
  updateProduct: (id, data) => client.put(`/products/${id}`, data),
  deleteProduct: (id) => client.delete(`/products/${id}`),
};
```

### 10. src/api/search.js
```javascript
import client from './client';

export const searchAPI = {
  aiSearch: (query) => client.post('/search/ai', { query }),
  checkAIHealth: () => client.get('/search/ai/health'),
};
```

### 11. src/components/Layout.jsx (простой)
```jsx
import { Outlet, Link, useNavigate } from 'react-router-dom';

function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Простая навигация */}
      <nav style={{ 
        padding: '1rem', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/">Поиск</Link>
          <Link to="/profile">Мой профиль</Link>
        </div>
        <button onClick={handleLogout}>Выйти</button>
      </nav>

      {/* Контент страницы */}
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
```

### 12. src/index.css (минимальный)
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

input, textarea, button {
  font: inherit;
}

button {
  cursor: pointer;
}

/* Простые утилиты */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066cc;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #0066cc;
  color: white;
  cursor: pointer;
}

.btn:hover {
  background-color: #0052a3;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
```

### 13. .env.example
```env
VITE_API_URL=http://localhost:3000/api
```

### 14. Временные заглушки для страниц

`src/pages/Login.jsx`:
```jsx
function Login({ setAuth }) {
  return <div>Login Page - будет реализовано в следующей задаче</div>;
}

export default Login;
```

`src/pages/Register.jsx`:
```jsx
function Register({ setAuth }) {
  return <div>Register Page - будет реализовано в следующей задаче</div>;
}

export default Register;
```

`src/pages/CompanyProfile.jsx`:
```jsx
function CompanyProfile() {
  return <div>Company Profile - будет реализовано в следующей задаче</div>;
}

export default CompanyProfile;
```

`src/pages/Search.jsx`:
```jsx
function Search() {
  return <div>Search Page - будет реализовано в следующей задаче</div>;
}

export default Search;
```

## Критерии приёмки
- [ ] React + Vite проект инициализирован
- [ ] Сервер разработки запускается (npm run dev)
- [ ] React Router настроен
- [ ] Базовая структура компонентов создана
- [ ] API client настроен с interceptors
- [ ] Маршруты аутентификации работают
- [ ] Layout с навигацией создан
- [ ] Proxy для API настроен

## Зависимости
- Задача 01-basic-project-setup

## Приоритет
Критический (P0)

## Оценка времени
1-2 часа

## Инструкции по запуску

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Открыть в браузере: http://localhost:5173


