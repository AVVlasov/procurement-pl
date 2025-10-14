# Задача 02: Система аутентификации

## Статус: ✅ Выполнено

## Описание
Реализация полной системы аутентификации с Redux state management, защищенными маршрутами и страницей входа.

## Выполненные подзадачи

### 2.1 Redux слой аутентификации ✅

**Файл:** `src/__data__/slices/authSlice.ts`

**State:**
```typescript
interface AuthState {
  user: User | null;
  company: Company | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
```

**Actions:**
- `setCredentials(AuthResponse)` - Сохранить пользователя и токены
- `setTokens({ accessToken, refreshToken })` - Обновить только токены
- `logout()` - Выйти из системы
- `setLoading(boolean)` - Установить состояние загрузки
- `setError(string | null)` - Установить ошибку
- `clearError()` - Очистить ошибку

**Особенности:**
- Автоматическое сохранение в localStorage (user, company, tokens)
- Восстановление состояния из localStorage при инициализации
- SSR-safe проверка window

### 2.2 API методы аутентификации ✅

**Файл:** `src/__data__/api/authApi.ts`

**Endpoints:**
- `login(credentials)` - Вход в систему
- `register(data)` - Регистрация компании
- `logout()` - Выход из системы
- `verifyEmail(token)` - Подтверждение email
- `requestPasswordReset(email)` - Запрос сброса пароля
- `resetPassword(token, newPassword)` - Сброс пароля
- `refreshToken(refreshToken)` - Обновление токена

**TypeScript интерфейсы:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  // Step 1: Company Info
  inn, ogrn, fullName, shortName?, legalForm, industry, companySize, website
  
  // Step 2: Contact Person
  firstName, lastName, middleName?, position, phone, email, password
  
  // Step 3: Needs
  platformGoals[], productsOffered, productsNeeded, 
  partnerIndustries?, partnerGeography?
  
  // Step 4: Marketing
  source?, agreeToTerms, agreeToMarketing?
}

interface AuthResponse {
  user: { id, email, firstName, lastName, position }
  company: { id, name, inn }
  tokens: { accessToken, refreshToken }
}
```

**Особенности:**
- Использование RTK Query для автоматического кэширования
- Tag invalidation для обновления данных
- Typed hooks (useLoginMutation, useRegisterMutation, etc.)

### 2.3 Страница входа ✅

**Файл:** `src/pages/auth/login/login.tsx`

**Функционал:**
- Форма с email и password
- React Hook Form + Zod валидация
- i18n интеграция для всех текстов
- Toast уведомления при успехе/ошибке
- Remember me checkbox
- Ссылка на восстановление пароля
- Ссылка на регистрацию
- Редирект на страницу, с которой пришел (или /dashboard)

**Валидация:**
```typescript
const loginSchema = z.object({
  email: z.string().min(1, 'Email обязателен').email('Неверный формат email'),
  password: z.string().min(1, 'Введите пароль'),
});
```

**UI компоненты:**
- Container с max-width для центрирования
- VStack для вертикального layout
- FormInput компоненты с error handling
- FormCheckbox для "Remember me"
- Button с loading state
- Link компоненты для навигации

### 2.4 Protected Route компонент ✅

**Файл:** `src/components/ProtectedRoute.tsx`

**Функционал:**
- Проверка `isAuthenticated` из Redux state
- Показ Spinner во время загрузки auth state
- Редирект на `/auth/login` если не авторизован
- Сохранение location для возврата после входа
- HOC pattern для оборачивания защищенных страниц

**Использование:**
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## Технические детали

### localStorage Persistence
```typescript
// Сохраняются:
- accessToken
- refreshToken
- user (JSON)
- company (JSON)

// Восстановление при инициализации store
const initialState = {
  ...loadTokensFromStorage(),
  loading: false,
  error: null,
};
```

### Token Refresh Flow
```typescript
// В baseQueryWithReauth (client.ts):
1. Запрос с accessToken
2. Если 401 -> попытка refresh
3. Если refresh успешен -> повтор запроса
4. Если refresh неудачен -> logout
```

### Form Validation Flow
```typescript
1. useForm с zodResolver
2. Валидация onBlur
3. Показ ошибок через error?.message
4. Submit только при валидных данных
5. API call через RTK Query mutation
6. Обработка success/error через toast
```

## UI/UX решения

### Дизайн страницы входа
- Центрированный Container (maxW="md")
- Белая карточка с border и shadow
- Spacing через VStack gap={...}
- Brand цвета для кнопок и ссылок
- Responsive layout

### Error Handling
- Toast уведомления для ошибок API
- Inline ошибки валидации под полями
- Перевод всех сообщений через i18next
- Fallback на английский при отсутствии перевода

### Loading States
- Button loading state при submit
- Spinner на всю страницу в ProtectedRoute
- Disabled state для кнопки при загрузке

## Интеграция с другими модулями

### Redux Integration
```typescript
// В компонентах:
const { login } = useAuth(); // custom hook
const [loginMutation, { isLoading }] = useLoginMutation(); // RTK Query

// При успешном входе:
const result = await loginMutation(data).unwrap();
login(result); // Сохранить в Redux + localStorage
navigate('/dashboard');
```

### i18n Integration
```typescript
const { t } = useTranslation('auth');

// Использование:
t('login.title') // "Вход в систему"
t('login.button') // "Войти"
t('common:buttons.back') // Из другого namespace
```

### Router Integration
```typescript
// Сохранение location для redirect после входа:
const location = useLocation();
const from = (location.state as any)?.from?.pathname || '/dashboard';
navigate(from, { replace: true });
```

## Критерии приёмки

- [x] Auth Redux slice создан с actions
- [x] localStorage persistence работает
- [x] RTK Query auth endpoints реализованы
- [x] Страница входа работает с валидацией
- [x] Protected routes защищают страницы
- [x] Token refresh автоматический
- [x] i18n интегрирован во все тексты
- [x] Toast уведомления работают
- [x] TypeScript типизация полная
- [x] Нет ошибок линтера

## Следующие шаги

✅ Переход к многошаговой регистрации

