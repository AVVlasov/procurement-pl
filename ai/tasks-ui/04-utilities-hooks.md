# Задача 04: Утилиты, константы и custom hooks

## Статус: ✅ Выполнено

## Описание
Создание переиспользуемых утилит, констант и custom hooks для всего приложения.

## Выполненные подзадачи

### 7.1 Константы приложения ✅

**Файл:** `src/utils/constants.ts`

#### Отрасли (INDUSTRIES)
20 отраслей для выбора:
- IT и Технологии
- Финансы и Банки
- Производство
- Строительство
- Розничная/Оптовая торговля
- Логистика и Транспорт
- Здравоохранение
- Образование
- Консалтинг
- Маркетинг и Реклама
- Недвижимость
- Продукты питания
- Сельское хозяйство
- Энергетика
- Телекоммуникации
- СМИ и Медиа
- Туризм и Гостеприимство
- Юридические услуги
- Другое

#### Размеры компаний (COMPANY_SIZES)
```typescript
[
  { value: '1-10', label: '1-10 сотрудников' },
  { value: '11-50', label: '11-50 сотрудников' },
  { value: '51-250', label: '51-250 сотрудников' },
  { value: '251-500', label: '251-500 сотрудников' },
  { value: '500+', label: 'Более 500 сотрудников' },
]
```

#### Организационно-правовые формы (LEGAL_FORMS)
- ООО (Общество с ограниченной ответственностью)
- АО (Акционерное общество)
- ПАО (Публичное акционерное общество)
- ИП (Индивидуальный предприниматель)
- ЗАО (Закрытое акционерное общество)
- НКО (Некоммерческая организация)
- ГУП (Государственное унитарное предприятие)
- МУП (Муниципальное унитарное предприятие)
- Другое

#### Цели использования платформы (PLATFORM_GOALS)
```typescript
[
  { value: 'find_suppliers', label: 'Поиск новых поставщиков' },
  { value: 'find_clients', label: 'Поиск новых клиентов' },
  { value: 'expand_network', label: 'Расширение сети деловых контактов' },
  { value: 'post_offers', label: 'Размещение коммерческих предложений/тендеров' },
  { value: 'market_research', label: 'Изучение рынка' },
  { value: 'other', label: 'Другое' },
]
```

#### География (GEOGRAPHY_OPTIONS)
- По всей России
- Москва и МО
- Санкт-Петербург и ЛО
- Все федеральные округа (8)
- СНГ
- Международные

#### Должности (POSITIONS)
- Владелец/Учредитель
- Генеральный директор
- Директор
- Заместитель директора
- Руководитель отдела
- Менеджер по закупкам
- Менеджер по продажам
- Менеджер
- Специалист
- Другое

#### Источники информации (SOURCE_OPTIONS)
- Поиск в интернете
- Рекомендация коллеги
- Статья/новость
- Социальные сети
- Конференция/выставка
- Реклама
- Другое

#### Диапазоны выручки (REVENUE_RANGES)
```typescript
[
  { value: 'up_to_60m', label: 'До 60 млн ₽' },
  { value: 'up_to_120m', label: 'До 120 млн ₽' },
  { value: 'up_to_2b', label: 'До 2 млрд ₽' },
  { value: '2b_plus', label: 'Более 2 млрд ₽' },
]
```

#### Количество сотрудников (EMPLOYEE_COUNTS)
- 1-10, 11-50, 51-200, 201-500, 500+

#### Категории товаров/услуг (PRODUCT_CATEGORIES)
- Товары
- Услуги
- Программное обеспечение
- Оборудование
- Материалы
- Расходные материалы
- Консалтинг
- Другое

#### Типы файлов для продуктов (FILE_TYPES)
- Коммерческое предложение
- Техническое задание
- Проект договора
- Анкета
- Другое

#### Параметры сортировки (SORT_OPTIONS)
- По релевантности
- По рейтингу (убыв./возр.)
- По названию (А-Я/Я-А)

#### Паттерны валидации (VALIDATION_PATTERNS)
```typescript
{
  INN: /^\d{10}$|^\d{12}$/,
  OGRN: /^\d{13}$|^\d{15}$/,
  PHONE: /^(\+7|8)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
}
```

### 7.2 Хелперы форматирования ✅

**Файл:** `src/utils/formatters.ts`

#### Форматирование номеров

**formatPhone(phone: string)**
```typescript
// "+71234567890" -> "+7 (123) 456-78-90"
// "9991234567" -> "+7 (999) 123-45-67"
```

**formatINN(inn: string)**
```typescript
// "1234567890" -> "12 34 567890" (10 цифр)
// "123456789012" -> "12 34 567890 12" (12 цифр)
```

**formatOGRN(ogrn: string)**
```typescript
// "1234567890123" -> "1 23 45 67890 123" (13 цифр)
// "123456789012345" -> "1 23 45 67890 12345" (15 цифр)
```

#### Форматирование дат

**formatDate(date, formatString?, locale?)**
```typescript
// Использует date-fns
formatDate(new Date(), 'dd.MM.yyyy', 'ru') // "13.10.2025"
formatDate(new Date(), 'dd MMMM yyyy', 'ru') // "13 октября 2025"
```

**formatRelativeTime(date, locale?)**
```typescript
// "2 часа назад"
// "вчера"
// "3 дня назад"
```

#### Форматирование чисел

**formatCurrency(amount: number)**
```typescript
formatCurrency(1000000) // "1 000 000 ₽"
formatCurrency(1500.50) // "1 500,50 ₽"
```

**formatCompactNumber(num: number)**
```typescript
formatCompactNumber(1500) // "1.5K"
formatCompactNumber(1500000) // "1.5M"
formatCompactNumber(1500000000) // "1.5B"
```

#### Утилиты текста

**truncateText(text, maxLength, suffix?)**
```typescript
truncateText("Очень длинный текст...", 10) // "Очень длин..."
```

**getInitials(firstName, lastName)**
```typescript
getInitials("Иван", "Иванов") // "ИИ"
```

**formatFileSize(bytes: number)**
```typescript
formatFileSize(1024) // "1 KB"
formatFileSize(1048576) // "1 MB"
```

#### Валидация с форматированием

**validateINN(inn: string)**
```typescript
// Возвращает: { isValid: boolean, formatted: string }
validateINN("1234567890") // { isValid: true, formatted: "12 34 567890" }
```

**validateOGRN(ogrn: string)**
```typescript
// Возвращает: { isValid: boolean, formatted: string }
validateOGRN("1234567890123") // { isValid: true, formatted: "1 23 45 67890 123" }
```

### 7.3 Custom hooks ✅

#### useAuth Hook
**Файл:** `src/hooks/useAuth.ts`

```typescript
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, company, isAuthenticated, loading, error, accessToken, refreshToken } = 
    useSelector((state: RootState) => state.auth);
  
  const handleLogin = useCallback((authData: AuthResponse) => {
    dispatch(setCredentials(authData));
  }, [dispatch]);
  
  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);
  
  return {
    user,
    company,
    isAuthenticated,
    loading,
    error,
    accessToken,
    refreshToken,
    login: handleLogin,
    logout: handleLogout,
  };
};
```

**Использование:**
```typescript
const { user, company, isAuthenticated, login, logout } = useAuth();

// Проверка авторизации
if (!isAuthenticated) {
  return <Navigate to="/login" />;
}

// Отображение данных пользователя
<Text>{user?.firstName} {user?.lastName}</Text>
<Text>{company?.name}</Text>

// Logout
<Button onClick={logout}>Выйти</Button>
```

#### useDebounce Hook
**Файл:** `src/hooks/useDebounce.ts`

```typescript
export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

**Использование:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  // API call only after 500ms of no typing
  if (debouncedSearchTerm) {
    searchCompanies(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);

<Input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="Поиск..."
/>
```

#### useToast Hook
**Файл:** `src/hooks/useToast.ts`

```typescript
export const useToast = () => {
  const showToast = useCallback((status: ToastStatus, options: ToastOptions) => {
    toaster.create({
      title: options.title,
      description: options.description,
      type: status,
      duration: options.duration ?? 3000,
    });
  }, []);

  return {
    success: (title, description?) => showToast('success', { title, description }),
    error: (title, description?) => showToast('error', { title, description }),
    warning: (title, description?) => showToast('warning', { title, description }),
    info: (title, description?) => showToast('info', { title, description }),
    toast: showToast,
  };
};
```

**Использование:**
```typescript
const toast = useToast();

// Success
toast.success('Успешно сохранено');

// Error with description
toast.error('Ошибка', 'Не удалось сохранить данные');

// Custom
toast.toast('warning', { 
  title: 'Внимание', 
  description: 'Проверьте данные',
  duration: 5000 
});
```

## Интеграция в проекте

### Использование в формах
```typescript
import { INDUSTRIES, COMPANY_SIZES } from '@/utils/constants';

<FormSelect
  label="Отрасль"
  options={INDUSTRIES}
  {...register('industry')}
/>
```

### Использование форматтеров
```typescript
import { formatPhone, formatCurrency, formatDate } from '@/utils/formatters';

<Text>{formatPhone(user.phone)}</Text>
<Text>{formatCurrency(company.revenue)}</Text>
<Text>{formatDate(order.createdAt, 'dd.MM.yyyy')}</Text>
```

### Использование hooks
```typescript
import { useAuth, useDebounce, useToast } from '@/hooks';

const { user, isAuthenticated, logout } = useAuth();
const debouncedQuery = useDebounce(searchQuery, 300);
const toast = useToast();
```

## Преимущества

### Централизация
- Все константы в одном месте
- Легко обновлять списки опций
- Консистентность во всем приложении

### Типобезопасность
- TypeScript типы для всех констант
- Автодополнение в IDE
- Compile-time проверки

### Переиспользуемость
- DRY принцип
- Меньше дублирования кода
- Легкое тестирование

### Локализация
- Константы готовы к переводу
- Разделение данных и представления
- i18n-friendly структура

## Критерии приёмки

- [x] Все константы созданы и типизированы
- [x] Форматтеры работают корректно
- [x] Custom hooks реализованы
- [x] TypeScript типы экспортированы
- [x] Документация в коде (JSDoc)
- [x] Regex паттерны валидируют правильно
- [x] date-fns интегрирован
- [x] Нет ошибок линтера

## Следующие шаги

⏳ Использование утилит в Dashboard и профиле компании

