# 🐛 Баг BUG-001: Отсутствует функциональность "Запомнить меня" на странице логина

## Информация о баге

**Bug ID**: BUG-2025-10-17-001  
**Дата обнаружения**: 17.10.2025  
**Модуль**: Authentication  
**Тип**: Функциональный  
**Приоритет**: P1 (Высокий)  
**Серьезность**: Major  

---

## Классификация

**Тип ошибки**: Отсутствие реализации функции (Missing Feature Implementation)

**Описание ошибки требования**: 
В требованиях (TC-AUTH-005) указано, что должна быть функция "Запомнить меня", которая сохраняет сессию пользователя и автоматически логинит его при повторном открытии сайта.

---

## Описание проблемы

### Краткое резюме
Компонент `FormCheckbox` для "Запомнить меня" не имеет функциональности. Чекбокс отображается в форме логина, но не сохраняет никакие данные и не влияет на поведение аутентификации.

### Детальное описание

**Файл**: `src/pages/auth/login/login.tsx` (строка 73)

```tsx
<FormCheckbox label={t('login.remember_me')} />
```

**Проблемы**:
1. ✗ Чекбокс не привязан к state компонента
2. ✗ Нет обработчика `register` в `react-hook-form`
3. ✗ В функции `onSubmit` не проверяется значение чекбокса
4. ✗ Токены не сохраняются отдельно с флагом "persistent" в localStorage
5. ✗ При перезагрузке страницы пользователь не восстанавливается в сессии

### Ожидаемое поведение

**Требование TC-AUTH-005:**
```
**Ожидаемый результат**:
- ✅ После повторного открытия пользователь остается залогиненным
- ✅ Токен сохранен в localStorage
- ✅ Автоматический редирект на dashboard
```

---

## Шаги воспроизведения

### Предусловия
- Сервер запущен (http://localhost:3000)
- Mock API запущен (http://localhost:3001)
- Браузер очищен (localStorage, cookies)

### Шаги
1. Открыть http://localhost:3000/auth/login
2. Ввести валидные учетные данные:
   - Email: `admin@test-company.ru`
   - Пароль: `SecurePass123!`
3. **Установить чекбокс "Запомнить меня"** ✅
4. Нажать "Войти"
5. Проверить успешный логин и редирект на dashboard
6. **Закрыть браузер полностью** (или открыть в новой сессии)
7. Открыть http://localhost:3000/ снова

### Ожидаемый результат
- ✅ Автоматический редирект на `/dashboard`
- ✅ Пользователь остается залогиненным
- ✅ Токены восстановлены из localStorage

### Фактический результат
- ❌ Редирект на `/auth/login`
- ❌ Пользователь разлогинен
- ❌ Токены очищены из localStorage (даже если были сохранены)

---

## Анализ кода

### Текущая реализация (НЕПРАВИЛЬНАЯ)

**Файл**: `src/pages/auth/login/login.tsx` (строки 14-42)

```tsx
export const Login: React.FC = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToast()
  const [loginMutation, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginMutation(data).unwrap()
      login(result)  // ❌ Не проверяет флаг "remember me"
      toast.success(t('login.success'))
      
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (error: any) {
      toast.error(t('login.error'), error?.data?.message)
    }
  }
  
  // ...
}
```

**Проблема**: Функция `onSubmit` не получает значение чекбокса и не может сохранить токены с флагом persistence.

### Валидация схемы (НЕПОЛНАЯ)

**Файл**: `src/utils/validators/registrationSchema.ts`

Нужно добавить поле `rememberMe` в `LoginFormData`:
```typescript
// ❌ ОТСУТСТВУЕТ
export interface LoginFormData {
  email: string
  password: string
  // rememberMe?: boolean  // ← ОТСУТСТВУЕТ
}
```

### Хранение токенов (НЕПРАВИЛЬНОЕ)

**Файл**: `src/__data__/slices/authSlice.ts` (строки 58-64)

```tsx
// Save to localStorage
if (typeof window !== 'undefined') {
  localStorage.setItem('accessToken', action.payload.tokens.accessToken)
  localStorage.setItem('refreshToken', action.payload.tokens.refreshToken)
  // ❌ Нет флага для различия persistent vs session-only токенов
}
```

---

## Требуемые изменения

### 1. Обновить type `LoginFormData`

**Файл**: `src/utils/validators/registrationSchema.ts`

```typescript
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean  // ← ДОБАВИТЬ
}

export const loginSchema = z.object({
  email: z.string().email(t('common:errors.invalid_email')),
  password: z.string().min(1, t('common:errors.password_required')),
  rememberMe: z.boolean().optional().default(false),  // ← ДОБАВИТЬ
})
```

### 2. Обновить компонент Login

**Файл**: `src/pages/auth/login/login.tsx` (строки 22-42)

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  watch,  // ← ДОБАВИТЬ
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: {
    rememberMe: false,  // ← ДОБАВИТЬ
  },
})

const rememberMe = watch('rememberMe')  // ← ДОБАВИТЬ

const onSubmit = async (data: LoginFormData) => {
  try {
    const result = await loginMutation(data).unwrap()
    login(result, data.rememberMe)  // ← ПЕРЕДАТЬ ФЛАГ
    toast.success(t('login.success'))
    
    const from = (location.state as any)?.from?.pathname || '/dashboard'
    navigate(from, { replace: true })
  } catch (error: any) {
    toast.error(t('login.error'), error?.data?.message)
  }
}
```

```tsx
// В form JSX:
<FormCheckbox 
  label={t('login.remember_me')} 
  {...register('rememberMe')}  // ← ДОБАВИТЬ
/>
```

### 3. Обновить useAuth hook

**Файл**: `src/hooks/useAuth.ts`

```typescript
const handleLogin = useCallback((authData: AuthResponse, rememberMe = false) => {
  dispatch(setCredentials({ ...authData, rememberMe }))  // ← ПЕРЕДАТЬ ФЛАГ
}, [dispatch])
```

### 4. Обновить authSlice

**Файл**: `src/__data__/slices/authSlice.ts`

```typescript
interface AuthState {
  user: AuthResponse['user'] | null
  company: AuthResponse['company'] | null
  accessToken: string | null
  refreshToken: string | null
  rememberMe: boolean  // ← ДОБАВИТЬ
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const setCredentials: (state, action) => {
  state.user = action.payload.user
  state.company = action.payload.company
  state.accessToken = action.payload.tokens.accessToken
  state.refreshToken = action.payload.tokens.refreshToken
  state.rememberMe = action.payload.rememberMe ?? false  // ← ДОБАВИТЬ
  state.isAuthenticated = true
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', action.payload.tokens.accessToken)
    localStorage.setItem('refreshToken', action.payload.tokens.refreshToken)
    localStorage.setItem('rememberMe', JSON.stringify(state.rememberMe))  // ← ДОБАВИТЬ
    // ...
  }
}
```

---

## Окружение

- **Браузер**: Chrome (Latest)
- **ОС**: Windows 10/11
- **URL**: http://localhost:3000/auth/login

---

## Затронутые тест-кейсы

- ✓ TC-AUTH-005: "Remember Me" функциональность (ПРОВАЛЕН)

---

## Связанные файлы

- `src/pages/auth/login/login.tsx`
- `src/utils/validators/registrationSchema.ts`
- `src/hooks/useAuth.ts`
- `src/__data__/slices/authSlice.ts`
- `locales/ru/auth.json` (перевод для "Запомнить меня")
- `locales/en/auth.json` (перевод для "Remember Me")

---

## Дополнительная информация

### Частота воспроизведения
- [ ] Всегда (100%) ✓ ВЫБРАНО

### Workaround
- Отсутствует

### Влияние на функционал
- Критично для улучшения UX
- Важно для мобильных пользователей
- Поведение не соответствует стандартам B2B платформ

---

## Комментарии

**QA Engineer** (17.10.2025):
> Функция "Запомнить меня" не работает. Чекбокс есть в UI, но функции нет. Пользователь должен заново логиниться при каждом открытии браузера.

---

**Статус**: New  
**Автор**: QA Testing Team  
**Дата создания**: 17.10.2025

