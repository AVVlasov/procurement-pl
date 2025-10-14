# Задача: Настройка TailwindCSS (MVP 1)

## Описание
Замена встроенных стилей на TailwindCSS для улучшенного UI/UX.

## Цель
Перейти на современный CSS фреймворк с utility-first подходом для быстрой разработки красивого интерфейса.

## Технические требования

### 1. Установка зависимостей

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

### 3. Установка дополнительных плагинов

```bash
npm install -D @tailwindcss/forms
npm install -D @tailwindcss/typography
```

### 4. Обновление src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Кастомные утилиты */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
  }
  
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-300 disabled:cursor-not-allowed;
  }
  
  .btn-secondary {
    @apply bg-secondary-200 text-secondary-800 hover:bg-secondary-300 active:bg-secondary-400;
  }
  
  .btn-outline {
    @apply border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100;
  }
  
  .input {
    @apply w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
  
  .input-error {
    @apply border-error focus:ring-error;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-card p-6;
  }
  
  .card-hover {
    @apply card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer;
  }
  
  .label {
    @apply block text-sm font-medium text-secondary-700 mb-1;
  }
  
  .error-text {
    @apply text-error text-sm mt-1;
  }
  
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  
  .badge-primary {
    @apply bg-primary-100 text-primary-800;
  }
  
  .badge-success {
    @apply bg-green-100 text-green-800;
  }
  
  .badge-warning {
    @apply bg-yellow-100 text-yellow-800;
  }
}

/* Кастомные анимации */
@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

/* Добавление шрифта Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

### 5. Создание UI компонентов

**src/components/ui/Button.jsx**
```jsx
function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
}) {
  const baseClasses = 'btn inline-flex items-center justify-center';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;
```

**src/components/ui/Input.jsx**
```jsx
import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  hint,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="label">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="error-text">{error}</p>}
      {hint && !error && <p className="text-secondary-500 text-sm mt-1">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
```

**src/components/ui/Card.jsx**
```jsx
function Card({ 
  children, 
  hoverable = false, 
  onClick,
  className = '' 
}) {
  return (
    <div 
      className={`${hoverable ? 'card-hover' : 'card'} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default Card;
```

**src/components/ui/Badge.jsx**
```jsx
function Badge({ children, variant = 'primary', className = '' }) {
  const variants = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
  };
  
  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
```

**src/components/ui/Spinner.jsx**
```jsx
function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  return (
    <div className="flex justify-center items-center">
      <svg 
        className={`animate-spin text-primary-600 ${sizeClasses[size]} ${className}`}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export default Spinner;
```

**src/components/ui/index.js**
```javascript
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Card } from './Card';
export { default as Badge } from './Badge';
export { default as Spinner } from './Spinner';
```

### 6. Обновление Layout.jsx с TailwindCSS

```jsx
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-secondary-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">
                B2B Platform
              </h1>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-secondary-700 hover:bg-secondary-100'
                }`}
              >
                Поиск
              </Link>
              <Link
                to="/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/profile') 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-secondary-700 hover:bg-secondary-100'
                }`}
              >
                Мой профиль
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-md transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-secondary-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-secondary-500 text-sm">
          © 2025 B2B Platform. MVP 1
        </div>
      </footer>
    </div>
  );
}

export default Layout;
```

### 7. Пример обновления Login.jsx

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { Button, Input } from '../components/ui';

function Login({ setAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.token);
      setAuth(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-card-hover p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Добро пожаловать
            </h1>
            <p className="text-secondary-600">
              Войдите в свой аккаунт
            </p>
          </div>

          {/* Form */}
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
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              Войти
            </Button>
          </form>

          {/* Footer */}
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

## Критерии приёмки
- [ ] TailwindCSS установлен и настроен
- [ ] Tailwind config с кастомными цветами
- [ ] UI компоненты созданы (Button, Input, Card, Badge, Spinner)
- [ ] Layout обновлен с Tailwind классами
- [ ] Login и Register обновлены с новым дизайном
- [ ] Все встроенные стили заменены на Tailwind
- [ ] Responsive дизайн работает
- [ ] Плагин @tailwindcss/forms установлен

## Зависимости
- MVP 0 завершен

## Приоритет
Высокий (P1)

## Оценка времени
2-3 дня

## Примечания
После настройки TailwindCSS все существующие страницы нужно будет постепенно обновить для использования новых UI компонентов.

