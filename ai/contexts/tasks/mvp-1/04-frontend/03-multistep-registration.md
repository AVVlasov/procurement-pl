# Задача: Многошаговая регистрация (MVP 1)

## Описание
Замена простой формы регистрации на многошаговую с 4 блоками для детального сбора информации о компании.

## Цель
Улучшить UX регистрации и собрать более полную информацию о компаниях для лучшей релевантности поиска.

## Технические требования

### 1. Установка зависимостей

```bash
cd frontend
npm install react-hook-form zod @hookform/resolvers
```

### 2. Структура шагов регистрации

**Шаг 1: Основная информация**
- Email (обязательно)
- Пароль (обязательно)
- Название компании (обязательно)
- ИНН (обязательно, 10 цифр)
- Кнопка "Проверить ИНН" (автозаполнение через API ФНС)

**Шаг 2: Контактное лицо**
- ФИО представителя (обязательно)
- Должность (обязательно)
- Телефон (обязательно)
- Дополнительный email (опционально)

**Шаг 3: Специализация**
- Сфера деятельности (выбор из списка)
- Описание компании (текст)
- Что вы продаете? (список продуктов/услуг)
- Что вам нужно? (список потребностей)

**Шаг 4: Маркетинг и соглашения**
- Согласие на обработку персональных данных (обязательно)
- Согласие на рассылку (опционально)
- Откуда узнали о платформе? (опционально)

### 3. Схемы валидации Zod

**src/utils/validation/registrationSchemas.js**
```javascript
import { z } from 'zod';

// Шаг 1: Основная информация
export const step1Schema = z.object({
  email: z
    .string()
    .email('Неверный формат email')
    .min(1, 'Email обязателен'),
  password: z
    .string()
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z
    .string()
    .min(1, 'Подтвердите пароль'),
  companyName: z
    .string()
    .min(3, 'Название компании должно содержать минимум 3 символа'),
  inn: z
    .string()
    .regex(/^\d{10}$/, 'ИНН должен содержать 10 цифр'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

// Шаг 2: Контактное лицо
export const step2Schema = z.object({
  contactName: z
    .string()
    .min(3, 'ФИО должно содержать минимум 3 символа'),
  contactPosition: z
    .string()
    .min(2, 'Должность обязательна'),
  contactPhone: z
    .string()
    .regex(/^\+?[78][-\(]?\d{3}\)?-?\d{3}-?\d{2}-?\d{2}$/, 'Неверный формат телефона'),
  contactEmail: z
    .string()
    .email('Неверный формат email')
    .optional()
    .or(z.literal('')),
});

// Шаг 3: Специализация
export const step3Schema = z.object({
  industry: z
    .string()
    .min(1, 'Выберите сферу деятельности'),
  description: z
    .string()
    .min(20, 'Описание должно содержать минимум 20 символов')
    .max(1000, 'Описание не должно превышать 1000 символов'),
  offeredProducts: z
    .array(z.object({
      name: z.string().min(1, 'Название обязательно'),
      description: z.string().optional(),
    }))
    .min(1, 'Добавьте хотя бы один продукт/услугу'),
  neededProducts: z
    .array(z.object({
      name: z.string().min(1, 'Название обязательно'),
      description: z.string().optional(),
    }))
    .optional(),
});

// Шаг 4: Маркетинг и соглашения
export const step4Schema = z.object({
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, 'Необходимо согласие на обработку данных'),
  agreeToMarketing: z
    .boolean()
    .optional(),
  howFound: z
    .string()
    .optional(),
});

// Полная схема регистрации
export const fullRegistrationSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape,
});
```

### 4. Компонент многошаговой регистрации

**src/pages/Register.jsx**
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';
import RegistrationStep1 from '../components/registration/RegistrationStep1';
import RegistrationStep2 from '../components/registration/RegistrationStep2';
import RegistrationStep3 from '../components/registration/RegistrationStep3';
import RegistrationStep4 from '../components/registration/RegistrationStep4';
import ProgressBar from '../components/registration/ProgressBar';

const TOTAL_STEPS = 4;

function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Шаг 1
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    inn: '',
    // Шаг 2
    contactName: '',
    contactPosition: '',
    contactPhone: '',
    contactEmail: '',
    // Шаг 3
    industry: '',
    description: '',
    offeredProducts: [],
    neededProducts: [],
    // Шаг 4
    agreeToTerms: false,
    agreeToMarketing: false,
    howFound: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleNext = (stepData) => {
    setFormData({ ...formData, ...stepData });
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (stepData) => {
    const finalData = { ...formData, ...stepData };
    
    // Подготовка данных для API
    const registrationData = {
      email: finalData.email,
      password: finalData.password,
      companyName: finalData.companyName,
      inn: finalData.inn,
      contactName: finalData.contactName,
      contactPosition: finalData.contactPosition,
      contactPhone: finalData.contactPhone,
      contactEmail: finalData.contactEmail,
      industry: finalData.industry,
      description: finalData.description,
      offeredProducts: finalData.offeredProducts,
      neededProducts: finalData.neededProducts,
      agreeToMarketing: finalData.agreeToMarketing,
      howFound: finalData.howFound,
    };

    const result = await dispatch(register(registrationData));
    if (register.fulfilled.match(result)) {
      navigate('/profile');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RegistrationStep1
            data={formData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <RegistrationStep2
            data={formData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <RegistrationStep3
            data={formData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <RegistrationStep4
            data={formData}
            onSubmit={handleSubmit}
            onBack={handleBack}
            loading={loading}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Регистрация компании
          </h1>
          <p className="text-secondary-600">
            Заполните информацию о вашей компании
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-card-hover p-8 mt-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

export default Register;
```

### 5. Компонент прогресс-бара

**src/components/registration/ProgressBar.jsx**
```jsx
function ProgressBar({ currentStep, totalSteps }) {
  const steps = [
    { number: 1, title: 'Основная информация' },
    { number: 2, title: 'Контактное лицо' },
    { number: 3, title: 'Специализация' },
    { number: 4, title: 'Соглашения' },
  ];

  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1">
              <div className="flex items-center">
                {/* Circle */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    transition-colors duration-200
                    ${
                      currentStep > step.number
                        ? 'bg-primary-600 text-white'
                        : currentStep === step.number
                        ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                        : 'bg-secondary-200 text-secondary-600'
                    }
                  `}
                >
                  {currentStep > step.number ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>

                {/* Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-1 mx-4
                      transition-colors duration-200
                      ${currentStep > step.number ? 'bg-primary-600' : 'bg-secondary-200'}
                    `}
                  />
                )}
              </div>

              {/* Title */}
              <div className="mt-2">
                <p
                  className={`
                    text-sm font-medium
                    ${currentStep >= step.number ? 'text-primary-700' : 'text-secondary-500'}
                  `}
                >
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-secondary-700">
            Шаг {currentStep} из {totalSteps}
          </span>
          <span className="text-sm text-secondary-500">
            {steps[currentStep - 1].title}
          </span>
        </div>
        <div className="w-full bg-secondary-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
```

### 6. Шаг 1: Основная информация

**src/components/registration/RegistrationStep1.jsx**
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step1Schema } from '../../utils/validation/registrationSchemas';
import { Button, Input } from '../ui';
import { useState } from 'react';
import { fnsAPI } from '../../api/fns'; // Будет в задаче интеграции ФНС

function RegistrationStep1({ data, onNext }) {
  const [checkingInn, setCheckingInn] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: data,
  });

  const inn = watch('inn');

  const handleCheckInn = async () => {
    if (!/^\d{10}$/.test(inn)) {
      alert('Введите корректный ИНН (10 цифр)');
      return;
    }

    setCheckingInn(true);
    try {
      const companyData = await fnsAPI.checkCompany(inn);
      if (companyData) {
        setValue('companyName', companyData.name);
        alert('Данные компании загружены из ФНС');
      }
    } catch (error) {
      alert('Не удалось найти компанию по ИНН');
    } finally {
      setCheckingInn(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Основная информация
        </h2>
        <p className="text-secondary-600">
          Введите данные для создания аккаунта
        </p>
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="user@company.com"
        error={errors.email?.message}
        hint="Используйте корпоративный email"
        {...register('email')}
      />

      <Input
        label="Пароль"
        type="password"
        placeholder="Минимум 6 символов"
        error={errors.password?.message}
        {...register('password')}
      />

      <Input
        label="Подтвердите пароль"
        type="password"
        placeholder="Повторите пароль"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <div>
        <Input
          label="ИНН компании"
          type="text"
          placeholder="1234567890"
          maxLength={10}
          error={errors.inn?.message}
          hint="10 цифр"
          {...register('inn')}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCheckInn}
          loading={checkingInn}
          className="mt-2"
        >
          Проверить ИНН и загрузить данные
        </Button>
      </div>

      <Input
        label="Название компании"
        type="text"
        placeholder="ООО Моя Компания"
        error={errors.companyName?.message}
        {...register('companyName')}
      />

      <div className="flex justify-end pt-4">
        <Button type="submit">
          Далее
        </Button>
      </div>
    </form>
  );
}

export default RegistrationStep1;
```

### 7. Шаг 2: Контактное лицо

**src/components/registration/RegistrationStep2.jsx**
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step2Schema } from '../../utils/validation/registrationSchemas';
import { Button, Input } from '../ui';

function RegistrationStep2({ data, onNext, onBack }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: data,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Контактное лицо
        </h2>
        <p className="text-secondary-600">
          Укажите представителя компании
        </p>
      </div>

      <Input
        label="ФИО представителя"
        type="text"
        placeholder="Иванов Иван Иванович"
        error={errors.contactName?.message}
        {...register('contactName')}
      />

      <Input
        label="Должность"
        type="text"
        placeholder="Генеральный директор"
        error={errors.contactPosition?.message}
        {...register('contactPosition')}
      />

      <Input
        label="Телефон"
        type="tel"
        placeholder="+7 (999) 123-45-67"
        error={errors.contactPhone?.message}
        {...register('contactPhone')}
      />

      <Input
        label="Дополнительный email (опционально)"
        type="email"
        placeholder="contact@company.com"
        error={errors.contactEmail?.message}
        hint="Для связи с партнерами"
        {...register('contactEmail')}
      />

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Назад
        </Button>
        <Button type="submit">
          Далее
        </Button>
      </div>
    </form>
  );
}

export default RegistrationStep2;
```

### 8. Шаг 3: Специализация (с динамическими полями)

**src/components/registration/RegistrationStep3.jsx**
```jsx
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step3Schema } from '../../utils/validation/registrationSchemas';
import { Button, Input } from '../ui';

const INDUSTRIES = [
  'IT и технологии',
  'Производство',
  'Торговля',
  'Строительство',
  'Услуги',
  'Сельское хозяйство',
  'Логистика и транспорт',
  'Финансы',
  'Образование',
  'Другое',
];

function RegistrationStep3({ data, onNext, onBack }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      ...data,
      offeredProducts: data.offeredProducts?.length > 0 ? data.offeredProducts : [{ name: '', description: '' }],
      neededProducts: data.neededProducts?.length > 0 ? data.neededProducts : [],
    },
  });

  const { fields: offeredFields, append: appendOffered, remove: removeOffered } = useFieldArray({
    control,
    name: 'offeredProducts',
  });

  const { fields: neededFields, append: appendNeeded, remove: removeNeeded } = useFieldArray({
    control,
    name: 'neededProducts',
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Специализация компании
        </h2>
        <p className="text-secondary-600">
          Расскажите о вашей деятельности
        </p>
      </div>

      {/* Сфера деятельности */}
      <div>
        <label className="label">Сфера деятельности</label>
        <select
          className="input"
          {...register('industry')}
        >
          <option value="">Выберите сферу</option>
          {INDUSTRIES.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>
        {errors.industry && (
          <p className="error-text">{errors.industry.message}</p>
        )}
      </div>

      {/* Описание */}
      <div>
        <label className="label">Описание компании</label>
        <textarea
          className="input"
          rows={4}
          placeholder="Расскажите о вашей компании, чем занимаетесь..."
          {...register('description')}
        />
        {errors.description && (
          <p className="error-text">{errors.description.message}</p>
        )}
      </div>

      {/* Продукты/услуги (Я ПРОДАЮ) */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-3">
          Что вы продаете?
        </h3>
        {offeredFields.map((field, index) => (
          <div key={field.id} className="mb-4 p-4 border border-secondary-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-secondary-700">
                Продукт/Услуга #{index + 1}
              </span>
              {offeredFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeOffered(index)}
                  className="text-error hover:text-error/80"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Input
              placeholder="Название"
              {...register(`offeredProducts.${index}.name`)}
              error={errors.offeredProducts?.[index]?.name?.message}
            />
            <textarea
              className="input mt-2"
              rows={2}
              placeholder="Описание (опционально)"
              {...register(`offeredProducts.${index}.description`)}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendOffered({ name: '', description: '' })}
        >
          + Добавить продукт/услугу
        </Button>
      </div>

      {/* Потребности (Я ПОКУПАЮ) */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 mb-3">
          Что вам нужно? (опционально)
        </h3>
        {neededFields.map((field, index) => (
          <div key={field.id} className="mb-4 p-4 border border-secondary-200 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm font-medium text-secondary-700">
                Потребность #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeNeeded(index)}
                className="text-error hover:text-error/80"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Input
              placeholder="Название"
              {...register(`neededProducts.${index}.name`)}
            />
            <textarea
              className="input mt-2"
              rows={2}
              placeholder="Описание (опционально)"
              {...register(`neededProducts.${index}.description`)}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendNeeded({ name: '', description: '' })}
        >
          + Добавить потребность
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Назад
        </Button>
        <Button type="submit">
          Далее
        </Button>
      </div>
    </form>
  );
}

export default RegistrationStep3;
```

### 9. Шаг 4: Соглашения

**src/components/registration/RegistrationStep4.jsx**
```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { step4Schema } from '../../utils/validation/registrationSchemas';
import { Button } from '../ui';

const HOW_FOUND_OPTIONS = [
  'Поисковая система',
  'Социальные сети',
  'Рекомендация партнера',
  'Реклама',
  'Статья/Блог',
  'Другое',
];

function RegistrationStep4({ data, onSubmit, onBack, loading, error }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step4Schema),
    defaultValues: data,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Завершение регистрации
        </h2>
        <p className="text-secondary-600">
          Последний шаг!
        </p>
      </div>

      {/* Согласие на обработку данных */}
      <div className="flex items-start">
        <input
          type="checkbox"
          id="agreeToTerms"
          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          {...register('agreeToTerms')}
        />
        <label htmlFor="agreeToTerms" className="ml-3 text-sm text-secondary-700">
          Я согласен на{' '}
          <a href="/terms" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
            обработку персональных данных
          </a>
          {' '}и принимаю{' '}
          <a href="/privacy" target="_blank" className="text-primary-600 hover:text-primary-700 underline">
            условия использования
          </a>
          <span className="text-error ml-1">*</span>
        </label>
      </div>
      {errors.agreeToTerms && (
        <p className="error-text">{errors.agreeToTerms.message}</p>
      )}

      {/* Согласие на рассылку */}
      <div className="flex items-start">
        <input
          type="checkbox"
          id="agreeToMarketing"
          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          {...register('agreeToMarketing')}
        />
        <label htmlFor="agreeToMarketing" className="ml-3 text-sm text-secondary-700">
          Хочу получать новости и обновления платформы
        </label>
      </div>

      {/* Откуда узнали */}
      <div>
        <label className="label">Откуда вы узнали о платформе?</label>
        <select
          className="input"
          {...register('howFound')}
        >
          <option value="">Выберите вариант</option>
          {HOW_FOUND_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error.error || 'Ошибка регистрации'}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Назад
        </Button>
        <Button type="submit" loading={loading}>
          Завершить регистрацию
        </Button>
      </div>
    </form>
  );
}

export default RegistrationStep4;
```

### 10. API интеграция ФНС (заглушка)

**src/api/fns.js**
```javascript
import client from './client';

export const fnsAPI = {
  checkCompany: async (inn) => {
    // В MVP 1 будет реальная интеграция с API ФНС
    // Пока заглушка
    try {
      const response = await client.get(`/fns/check/${inn}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
```

## Критерии приёмки
- [ ] 4 шага регистрации реализованы
- [ ] Progress bar показывает текущий шаг
- [ ] Валидация с Zod работает на каждом шаге
- [ ] React Hook Form используется для управления формами
- [ ] Данные сохраняются между шагами
- [ ] Кнопка "Назад" работает
- [ ] Динамические поля для продуктов/услуг работают
- [ ] Проверка ИНН интегрирована (заглушка)
- [ ] Checkbox для соглашений обязательный
- [ ] Responsive дизайн работает

## Зависимости
- Задача 01-tailwind-setup
- Задача 02-redux-setup
- Задача 02-fns-api-integration (backend)

## Приоритет
Высокий (P1)

## Оценка времени
4-5 дней

## Примечания
Многошаговая форма значительно улучшает UX и позволяет собрать больше данных без перегрузки пользователя.

