# Задача 03: Многошаговая регистрация компании

## Статус: ✅ Выполнено

## Описание
Реализация полной многошаговой формы регистрации компании с 4 этапами, валидацией на каждом шаге и автозаполнением по ИНН.

## Выполненные подзадачи

### 3.1 Мастер-компонент регистрации ✅

**Файл:** `src/pages/auth/register/register.tsx`

**Функционал:**
- Управление 4 шагами регистрации
- Progress bar с визуальной индикацией текущего шага
- Валидация полей каждого шага перед переходом
- Сохранение данных между шагами
- Финальная отправка всех данных на сервер

**Шаги:**
1. **Информация о компании** - ИНН, ОГРН, название, форма, отрасль
2. **Контактное лицо** - ФИО, должность, контакты, пароль
3. **Детализация потребностей** - Цели, продукты/услуги
4. **Завершение** - Источник, согласия

**Валидация по шагам:**
```typescript
const STEP_FIELDS = {
  1: ['inn', 'ogrn', 'fullName', 'legalForm', 'industry', 'companySize', 'website'],
  2: ['firstName', 'lastName', 'position', 'phone', 'email', 'password', 'confirmPassword'],
  3: ['platformGoals', 'productsOffered', 'productsNeeded'],
  4: ['agreeToTerms'],
};

// Валидация перед переходом к следующему шагу
const isValid = await trigger(STEP_FIELDS[currentStep]);
```

### 3.2 Шаг 1: Информация о компании ✅

**Файл:** `src/pages/auth/register/Step1CompanyInfo.tsx`

**Поля:**
- **ИНН*** - 10 цифр (обязательно)
- **ОГРН/ОГРНИП*** - 13 или 15 цифр (обязательно)
- **Полное наименование*** - ООО "Название" (обязательно)
- **Сокращенное наименование** - опционально
- **Организационно-правовая форма*** - select (обязательно)
- **Сфера деятельности*** - select из INDUSTRIES (обязательно)
- **Размер компании*** - select из COMPANY_SIZES (обязательно)
- **Сайт компании*** - URL (обязательно)

**Автозаполнение по ИНН:**
```typescript
const handleAutoFill = async () => {
  const result = await checkINN(inn).unwrap();
  if (result.data) {
    setValue('fullName', result.data.name);
    setValue('ogrn', result.data.ogrn);
    setValue('legalForm', result.data.legal_form);
    toast.success('Данные успешно загружены');
  }
};
```

**Валидация:**
- ИНН: 10 цифр, regex проверка
- ОГРН: 13 или 15 цифр, regex проверка
- URL: полный URL с протоколом
- Все обязательные поля проверяются

### 3.3 Шаг 2: Контактное лицо ✅

**Файл:** `src/pages/auth/register/Step2ContactPerson.tsx`

**Поля:**
- **Фамилия*** - минимум 2 символа
- **Имя*** - минимум 2 символа
- **Отчество** - опционально
- **Должность*** - select из POSITIONS
- **Контактный телефон*** - маска +7 (999) 123-45-67
- **Рабочий e-mail*** - корпоративный email
- **Пароль*** - минимум 8 символов, требования к сложности
- **Подтверждение пароля*** - совпадение с паролем

**Валидация пароля:**
```typescript
const passwordValidator = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
  .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
  .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру');
```

**Подсказка:**
> **Важно:** Email должен быть корпоративным и совпадать с доменом сайта компании.

### 3.4 Шаг 3: Детализация потребностей ✅

**Файл:** `src/pages/auth/register/Step3Needs.tsx`

**Поля:**
- **Цель использования платформы*** - множественный выбор:
  - Поиск новых поставщиков
  - Поиск новых клиентов
  - Расширение сети деловых контактов
  - Размещение коммерческих предложений/тендеров
  - Изучение рынка
  - Другое

- **Продукты/услуги, которые вы предлагаете*** - textarea (минимум 10 символов)
- **Продукты/услуги, которые вы ищете*** - textarea (минимум 10 символов)
- **Отрасли ваших потенциальных партнеров** - множественный выбор из INDUSTRIES
- **География поиска партнеров** - множественный выбор:
  - По всей России
  - Конкретные регионы (ФО)
  - СНГ
  - Международные

**State Management:**
```typescript
const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

const handleGoalChange = (goal: string) => {
  const updated = selectedGoals.includes(goal)
    ? selectedGoals.filter((g) => g !== goal)
    : [...selectedGoals, goal];
  
  setSelectedGoals(updated);
  setValue('platformGoals', updated); // Сохранить в react-hook-form
};
```

### 3.5 Шаг 4: Завершение ✅

**Файл:** `src/pages/auth/register/Step4Marketing.tsx`

**Поля:**
- **Как вы узнали о нас?** - select из SOURCE_OPTIONS:
  - Поиск в интернете
  - Рекомендация коллеги
  - Статья/новость
  - Социальные сети
  - Конференция/выставка
  - Реклама
  - Другое

- **Согласие с условиями*** - checkbox (обязательно):
  > Я согласен с [Пользовательским соглашением](#) и [Политикой конфиденциальности](#)

- **Согласие на рассылки** - checkbox (опционально):
  > Я согласен на получение коммерческих рассылок

**Информация:**
> После регистрации на ваш email будет отправлено письмо для подтверждения. Данные компании будут автоматически проверены через API ФНС.

### 3.6 Валидационные схемы ✅

**Файл:** `src/utils/validators/registrationSchema.ts`

**Zod схемы:**
```typescript
// Для каждого шага
export const step1Schema = z.object({ ... });
export const step2Schema = z.object({ ... });
export const step3Schema = z.object({ ... });
export const step4Schema = z.object({ ... });

// Полная схема
export const registrationSchema = z.object({ ... })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });
```

**Кастомные валидаторы:**
- `innValidator` - ИНН (10 или 12 цифр)
- `ogrnValidator` - ОГРН (13 или 15 цифр)
- `phoneValidator` - Телефон (российский формат)
- `emailValidator` - Email
- `urlValidator` - URL с протоколом
- `passwordValidator` - Пароль (8+, uppercase, lowercase, digit)

**TypeScript типы:**
```typescript
export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type Step4FormData = z.infer<typeof step4Schema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
```

### 3.7 Общие UI компоненты форм ✅

**Созданные компоненты:**

#### FormInput
**Файл:** `src/components/forms/FormInput.tsx`
- Input с label, error, helperText
- Chakra UI Field integration
- forwardRef для react-hook-form
- isRequired prop

#### FormSelect
**Файл:** `src/components/forms/FormSelect.tsx`
- Select с Chakra UI SelectRoot/Trigger/Content
- Options array: `{ value, label }[]`
- Controlled component с onChange callback
- Error handling

#### FormCheckbox
**Файл:** `src/components/forms/FormCheckbox.tsx`
- Checkbox с label (может быть ReactNode)
- Error state
- forwardRef для react-hook-form

#### FormTextarea
**Файл:** `src/components/forms/FormTextarea.tsx`
- Textarea с label, error, helperText
- rows prop для высоты
- forwardRef для react-hook-form

**Общий паттерн:**
```tsx
<FormInput
  label="Название поля *"
  placeholder="Введите значение"
  {...register('fieldName')}
  error={errors.fieldName?.message}
  isRequired
/>
```

## UI/UX решения

### Progress Bar
```tsx
<HStack gap={0} justify="space-between">
  {STEPS.map((step, index) => (
    <Fragment key={step.id}>
      <VStack>
        <Circle
          bg={currentStep >= step.id ? 'brand.600' : 'gray.200'}
          color={currentStep >= step.id ? 'white' : 'gray.600'}
        >
          {step.id}
        </Circle>
        <Text fontSize="xs">{t(`register.steps.${step.key}`)}</Text>
      </VStack>
      {index < STEPS.length - 1 && (
        <Box h="1" bg={currentStep > step.id ? 'brand.600' : 'gray.200'} />
      )}
    </Fragment>
  ))}
</HStack>
```

### Навигация между шагами
- **Кнопка "Назад"** - disabled на первом шаге
- **Кнопка "Далее"** - валидация перед переходом
- **Кнопка "Зарегистрироваться"** - только на последнем шаге
- Loading state на кнопке при отправке

### Error Handling
- Toast при ошибке валидации
- Inline ошибки под полями
- Перевод всех сообщений через i18next
- API ошибки показываются через toast

### Автозаполнение
- Кнопка "Заполнить автоматически" рядом с ИНН
- Disabled если ИНН некорректный
- Loading state при запросе к API
- Success/Error toast после попытки

## Интеграция

### React Hook Form
```typescript
const { register, handleSubmit, formState: { errors }, setValue, watch, trigger } = 
  useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
  });
```

### RTK Query
```typescript
const [registerMutation, { isLoading }] = useRegisterMutation();

const onSubmit = async (data: RegistrationFormData) => {
  const result = await registerMutation(data).unwrap();
  login(result);
  navigate('/dashboard');
};
```

### i18n
```typescript
const { t } = useTranslation('auth');

t('register.step1.title') // "Основная информация о компании"
t('register.step1.inn') // "ИНН"
```

## Критерии приёмки

- [x] 4 шага регистрации работают
- [x] Progress bar отображает прогресс
- [x] Валидация на каждом шаге
- [x] Автозаполнение по ИНН
- [x] Все поля с правильными типами
- [x] Обязательные поля помечены *
- [x] Пароли проверяются на совпадение
- [x] Множественный выбор работает
- [x] Form components переиспользуемые
- [x] TypeScript типизация полная
- [x] i18n для всех текстов
- [x] Responsive layout
- [x] Нет ошибок линтера

## Следующие шаги

⏳ Переход к созданию Dashboard и профиля компании

