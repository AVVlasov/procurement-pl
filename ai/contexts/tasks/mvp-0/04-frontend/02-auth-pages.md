# Задача: Страницы аутентификации (MVP 0)

## Описание
Простые страницы входа и регистрации без сложных форм.

## Цель
Позволить пользователям регистрироваться и входить в систему.

## Технические требования

### 1. src/pages/Login.jsx
```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/auth';

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
      
      // Сохранить токен
      localStorage.setItem('token', response.token);
      
      // Обновить состояние аутентификации
      setAuth(true);
      
      // Перейти на главную
      navigate('/');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Вход</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Минимум 6 символов"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
```

### 2. src/pages/Register.jsx
```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/auth';

function Register({ setAuth }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    inn: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      
      // Сохранить токен
      localStorage.setItem('token', response.token);
      
      // Обновить состояние аутентификации
      setAuth(true);
      
      // Перейти на профиль
      navigate('/profile');
      
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '2rem 0',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          Регистрация
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="user@company.com"
            />
            <small style={{ color: '#666' }}>
              Используйте корпоративный email
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="Минимум 6 символов"
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyName">Название компании *</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="ООО Моя Компания"
            />
          </div>

          <div className="form-group">
            <label htmlFor="inn">ИНН *</label>
            <input
              type="text"
              id="inn"
              name="inn"
              value={formData.inn}
              onChange={handleChange}
              required
              pattern="\d{10}"
              maxLength={10}
              placeholder="1234567890"
            />
            <small style={{ color: '#666' }}>
              10 цифр
            </small>
          </div>

          {error && <div className="error">{error}</div>}

          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center' }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
```

### 3. Валидация на клиенте (опционально)

`src/utils/validation.js`:
```javascript
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateINN = (inn) => {
  return inn && /^\d{10}$/.test(inn);
};

export const validateForm = (formData) => {
  const errors = {};

  if (!validateEmail(formData.email)) {
    errors.email = 'Неверный формат email';
  }

  if (!validatePassword(formData.password)) {
    errors.password = 'Пароль должен содержать минимум 6 символов';
  }

  if (formData.companyName && formData.companyName.length < 3) {
    errors.companyName = 'Название компании слишком короткое';
  }

  if (!validateINN(formData.inn)) {
    errors.inn = 'ИНН должен содержать 10 цифр';
  }

  return errors;
};
```

Использование в Register.jsx:
```jsx
import { validateForm } from '../utils/validation';

// В handleSubmit перед отправкой:
const validationErrors = validateForm(formData);
if (Object.keys(validationErrors).length > 0) {
  setError(Object.values(validationErrors).join('. '));
  setLoading(false);
  return;
}
```

### 4. Тестирование UI

Создать тестовые данные:
- Email: demo@example.com
- Пароль: demo123
- Компания: ООО Демо Компания
- ИНН: 1234567890

## Критерии приёмки
- [ ] Страница входа работает
- [ ] Страница регистрации работает
- [ ] Токен сохраняется в localStorage
- [ ] После входа/регистрации редирект на нужную страницу
- [ ] Ошибки валидации отображаются
- [ ] Кнопки disabled при загрузке
- [ ] Ссылки между страницами работают
- [ ] UI responsive (адаптивный)

## Зависимости
- Задача 01-react-vite-setup
- Задача 02-auth-simple (backend)

## Приоритет
Критический (P0)

## Оценка времени
2-3 часа

## Скриншоты для проверки

### Страница входа
- Форма с email и паролем
- Кнопка "Войти"
- Ссылка на регистрацию

### Страница регистрации
- Форма с email, паролем, названием компании и ИНН
- Подсказки для пользователя
- Кнопка "Зарегистрироваться"
- Ссылка на вход

### Обработка ошибок
- Сообщение об ошибке при неверных данных
- Disabled состояние кнопки при загрузке
- Очистка ошибок при новой попытке


