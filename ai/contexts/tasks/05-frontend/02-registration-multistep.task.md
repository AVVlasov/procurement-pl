# Задача: Многошаговая форма регистрации

## Описание
Реализация многошаговой формы регистрации с 4 блоками, валидацией и автозаполнением через API ФНС.

## Цель
Обеспечить удобную регистрацию компаний с пошаговым заполнением информации.

## Технические требования

### 1. src/pages/auth/Register.jsx
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { register as registerAction } from '@store/authSlice';

// Steps
import Step1CompanyInfo from './register/Step1CompanyInfo';
import Step2ContactPerson from './register/Step2ContactPerson';
import Step3Needs from './register/Step3Needs';
import Step4Marketing from './register/Step4Marketing';

// Schema validation
import { registrationSchema } from '@utils/validators';

const STEPS = [
  { id: 1, title: 'Информация о компании', component: Step1CompanyInfo },
  { id: 2, title: 'Контактное лицо', component: Step2ContactPerson },
  { id: 3, title: 'Детализация потребностей', component: Step3Needs },
  { id: 4, title: 'Завершение', component: Step4Marketing },
];

function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
  });

  const handleNext = async () => {
    // Валидация текущего шага
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);
    
    if (!isValid) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    // Сохранение данных текущего шага
    const currentData = watch();
    setFormData((prev) => ({ ...prev, ...currentData }));
    
    // Переход к следующему шагу
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      
      const allData = { ...formData, ...data };
      
      await dispatch(registerAction(allData)).unwrap();
      
      toast.success('Регистрация успешна! Проверьте email для подтверждения.');
      navigate('/dashboard');
      
    } catch (error) {
      toast.error(error || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="text-center text-3xl font-bold text-gray-900">
          Регистрация компании
        </h2>
        
        {/* Progress bar */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${
                        currentStep >= step.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {step.id}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                        flex-1 h-1 mx-2
                        ${currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>
                <p className="mt-2 text-xs text-center text-gray-600">
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CurrentStepComponent
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
            />

            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Назад
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700"
                >
                  Далее
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getFieldsForStep(step) {
  switch (step) {
    case 1:
      return ['inn', 'ogrn', 'fullName', 'legalForm', 'industry', 'companySize', 'website'];
    case 2:
      return ['firstName', 'lastName', 'position', 'phone', 'email', 'password'];
    case 3:
      return ['platformGoals'];
    case 4:
      return ['agreeToTerms'];
    default:
      return [];
  }
}

export default Register;
```

### 2. src/pages/auth/register/Step1CompanyInfo.jsx
```jsx
import { useState } from 'react';
import { toast } from 'react-toastify';
import { checkINN } from '@api/companies';
import Input from '@components/common/Input';
import Select from '@components/common/Select';
import Button from '@components/common/Button';
import { INDUSTRIES, COMPANY_SIZES, LEGAL_FORMS } from '@utils/constants';

function Step1CompanyInfo({ register, errors, setValue, watch }) {
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const inn = watch('inn');

  const handleAutoFill = async () => {
    if (!inn || inn.length !== 10) {
      toast.error('Введите корректный ИНН (10 цифр)');
      return;
    }

    try {
      setIsAutoFilling(true);
      const response = await checkINN(inn);
      
      if (response.data) {
        // Автозаполнение полей
        setValue('fullName', response.data.name || '');
        setValue('ogrn', response.data.ogrn || '');
        setValue('legalForm', response.data.legal_form || '');
        
        toast.success('Данные успешно загружены');
      }
    } catch (error) {
      toast.error('Не удалось получить данные по ИНН');
    } finally {
      setIsAutoFilling(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Основная информация о компании
      </h3>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="ИНН *"
                {...register('inn')}
                error={errors.inn?.message}
                placeholder="1234567890"
                maxLength={10}
              />
            </div>
            <Button
              type="button"
              onClick={handleAutoFill}
              disabled={isAutoFilling || !inn || inn.length !== 10}
              className="mt-6"
            >
              {isAutoFilling ? 'Загрузка...' : 'Заполнить автоматически'}
            </Button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Введите ИНН для автоматического заполнения данных компании
          </p>
        </div>

        <Input
          label="ОГРН/ОГРНИП *"
          {...register('ogrn')}
          error={errors.ogrn?.message}
          placeholder="1234567890123"
        />

        <Input
          label="Полное наименование *"
          {...register('fullName')}
          error={errors.fullName?.message}
          placeholder="ООО 'Название компании'"
        />

        <Input
          label="Сокращенное наименование"
          {...register('shortName')}
          error={errors.shortName?.message}
          placeholder="Название"
        />

        <Select
          label="Организационно-правовая форма *"
          {...register('legalForm')}
          error={errors.legalForm?.message}
          options={LEGAL_FORMS}
        />

        <Select
          label="Сфера деятельности *"
          {...register('industry')}
          error={errors.industry?.message}
          options={INDUSTRIES}
        />

        <Select
          label="Размер компании *"
          {...register('companySize')}
          error={errors.companySize?.message}
          options={COMPANY_SIZES}
        />

        <Input
          label="Сайт компании *"
          {...register('website')}
          error={errors.website?.message}
          type="url"
          placeholder="https://example.com"
        />
      </div>
    </div>
  );
}

export default Step1CompanyInfo;
```

### 3. src/pages/auth/register/Step2ContactPerson.jsx
```jsx
import Input from '@components/common/Input';
import Select from '@components/common/Select';
import { POSITIONS } from '@utils/constants';

function Step2ContactPerson({ register, errors }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Контактное лицо
      </h3>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Фамилия *"
          {...register('lastName')}
          error={errors.lastName?.message}
        />

        <Input
          label="Имя *"
          {...register('firstName')}
          error={errors.firstName?.message}
        />

        <Input
          label="Отчество"
          {...register('middleName')}
          error={errors.middleName?.message}
        />

        <Select
          label="Должность *"
          {...register('position')}
          error={errors.position?.message}
          options={POSITIONS}
        />

        <Input
          label="Контактный телефон *"
          {...register('phone')}
          error={errors.phone?.message}
          type="tel"
          placeholder="+7 (999) 123-45-67"
        />

        <Input
          label="Рабочий e-mail *"
          {...register('email')}
          error={errors.email?.message}
          type="email"
          placeholder="name@company.com"
        />

        <Input
          label="Пароль *"
          {...register('password')}
          error={errors.password?.message}
          type="password"
          placeholder="Минимум 8 символов"
        />

        <Input
          label="Подтверждение пароля *"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          type="password"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Важно:</strong> Email должен быть корпоративным и совпадать с доменом сайта компании.
        </p>
      </div>
    </div>
  );
}

export default Step2ContactPerson;
```

### 4. src/pages/auth/register/Step3Needs.jsx
```jsx
import { useState } from 'react';
import Checkbox from '@components/common/Checkbox';
import Input from '@components/common/Input';
import { PLATFORM_GOALS, INDUSTRIES, GEOGRAPHY_OPTIONS } from '@utils/constants';

function Step3Needs({ register, errors, setValue, watch }) {
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [selectedIndustries, setSelectedIndustries] = useState([]);
  const [selectedGeography, setSelectedGeography] = useState([]);

  const handleGoalChange = (goal) => {
    const updated = selectedGoals.includes(goal)
      ? selectedGoals.filter((g) => g !== goal)
      : [...selectedGoals, goal];
    
    setSelectedGoals(updated);
    setValue('platformGoals', updated);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Детализация потребностей
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Цель использования платформы *
        </label>
        <div className="space-y-2">
          {PLATFORM_GOALS.map((goal) => (
            <Checkbox
              key={goal.value}
              label={goal.label}
              checked={selectedGoals.includes(goal.value)}
              onChange={() => handleGoalChange(goal.value)}
            />
          ))}
        </div>
        {errors.platformGoals && (
          <p className="mt-1 text-sm text-red-600">{errors.platformGoals.message}</p>
        )}
      </div>

      <Input
        label="Какие продукты/услуги вы предлагаете? *"
        {...register('productsOffered')}
        error={errors.productsOffered?.message}
        multiline
        rows={3}
        placeholder="Опишите кратко основные продукты или услуги"
      />

      <Input
        label="Какие продукты/услуги вы ищете? *"
        {...register('productsNeeded')}
        error={errors.productsNeeded?.message}
        multiline
        rows={3}
        placeholder="Опишите, что вы хотите приобрести"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Отрасли ваших потенциальных партнеров
        </label>
        <div className="grid grid-cols-2 gap-2">
          {INDUSTRIES.map((industry) => (
            <Checkbox
              key={industry.value}
              label={industry.label}
              checked={selectedIndustries.includes(industry.value)}
              onChange={() => {
                const updated = selectedIndustries.includes(industry.value)
                  ? selectedIndustries.filter((i) => i !== industry.value)
                  : [...selectedIndustries, industry.value];
                setSelectedIndustries(updated);
                setValue('partnerIndustries', updated);
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          География поиска партнеров
        </label>
        <div className="space-y-2">
          {GEOGRAPHY_OPTIONS.map((geo) => (
            <Checkbox
              key={geo.value}
              label={geo.label}
              checked={selectedGeography.includes(geo.value)}
              onChange={() => {
                const updated = selectedGeography.includes(geo.value)
                  ? selectedGeography.filter((g) => g !== geo.value)
                  : [...selectedGeography, geo.value];
                setSelectedGeography(updated);
                setValue('partnerGeography', updated);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Step3Needs;
```

### 5. src/pages/auth/register/Step4Marketing.jsx
```jsx
import Checkbox from '@components/common/Checkbox';
import Select from '@components/common/Select';
import { SOURCE_OPTIONS } from '@utils/constants';

function Step4Marketing({ register, errors }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Завершение регистрации
      </h3>

      <Select
        label="Как вы узнали о нас?"
        {...register('source')}
        error={errors.source?.message}
        options={SOURCE_OPTIONS}
      />

      <div className="border-t pt-6">
        <Checkbox
          label={
            <span>
              Я согласен с{' '}
              <a href="/terms" className="text-primary-600 hover:underline" target="_blank">
                Пользовательским соглашением
              </a>{' '}
              и{' '}
              <a href="/privacy" className="text-primary-600 hover:underline" target="_blank">
                Политикой конфиденциальности
              </a>{' '}
              *
            </span>
          }
          {...register('agreeToTerms')}
          error={errors.agreeToTerms?.message}
        />

        <div className="mt-4">
          <Checkbox
            label="Я согласен на получение коммерческих рассылок"
            {...register('agreeToMarketing')}
          />
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-md">
        <p className="text-sm text-green-800">
          После регистрации на ваш email будет отправлено письмо для подтверждения.
          Данные компании будут автоматически проверены через API ФНС.
        </p>
      </div>
    </div>
  );
}

export default Step4Marketing;
```

## Критерии приёмки
- [ ] Многошаговая форма с 4 шагами работает
- [ ] Progress bar отображает текущий шаг
- [ ] Валидация на каждом шаге работает
- [ ] Автозаполнение по ИНН работает
- [ ] Навигация между шагами корректна
- [ ] Данные сохраняются между шагами
- [ ] Регистрация отправляет данные в API
- [ ] Responsive дизайн работает

## Зависимости
- Задача 01-frontend-setup
- Задача 02-auth-api (backend)

## Приоритет
Высокий (P1)

## Оценка времени
8-10 часов

