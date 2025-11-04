import { z } from 'zod'
import { VALIDATION_PATTERNS } from '../constants'

// Custom validators
const innValidator = z
  .string()
  .min(1, 'ИНН обязателен для заполнения')
  .regex(VALIDATION_PATTERNS.INN, 'ИНН должен содержать 10 цифр для юр.лиц или 12 цифр для ИП. Проверьте правильность ввода')

const ogrnValidator = z
  .string()
  .min(1, 'ОГРН обязателен для заполнения')
  .regex(VALIDATION_PATTERNS.OGRN, 'ОГРН должен содержать 13 цифр для юр.лиц или 15 цифр (ОГРНИП) для ИП. Проверьте правильность ввода')

const phoneValidator = z
  .string()
  .min(1, 'Телефон обязателен для заполнения')
  .regex(VALIDATION_PATTERNS.PHONE, 'Неверный формат телефона. Используйте формат: +7 (XXX) XXX-XX-XX или 8XXXXXXXXXX')

const emailValidator = z
  .string()
  .min(1, 'Email обязателен для заполнения')
  .email('Неверный формат email. Пример правильного формата: example@company.ru')

const urlValidator = z
  .string()
  .min(1, 'Адрес сайта обязателен для заполнения')
  .regex(VALIDATION_PATTERNS.URL, 'Неверный формат URL. Укажите полный адрес с протоколом: https://example.com')

const passwordValidator = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов для обеспечения безопасности')
  .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву (A-Z)')
  .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву (a-z)')
  .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру (0-9)')

// Helper для селектов - преобразует пустую строку в undefined и выдает русское сообщение
const selectValidator = (errorMessage: string) =>
  z
    .string({ 
      required_error: errorMessage,
      invalid_type_error: errorMessage 
    })
    .min(1, errorMessage)
    .refine((val) => val !== '', { message: errorMessage })

// Step 1: Company Info Schema
export const step1Schema = z.object({
  inn: innValidator,
  ogrn: ogrnValidator,
  fullName: z.string({ required_error: 'Полное наименование обязательно' }).min(1, 'Полное наименование обязательно').min(3, 'Полное наименование должно содержать минимум 3 символа'),
  shortName: z.string().optional(),
  legalForm: selectValidator('Выберите организационно-правовую форму из списка (например: ООО, ОАО, ИП)'),
  industry: selectValidator('Выберите сферу деятельности вашей компании из предложенных вариантов'),
  companySize: selectValidator('Выберите размер компании по количеству сотрудников'),
  website: urlValidator,
})

// Step 2: Contact Person Schema
export const step2Schema = z.object({
  firstName: z.string({ required_error: 'Имя обязательно' }).min(1, 'Имя обязательно').min(2, 'Имя должно содержать минимум 2 символа'),
  lastName: z.string({ required_error: 'Фамилия обязательна' }).min(1, 'Фамилия обязательна').min(2, 'Фамилия должна содержать минимум 2 символа'),
  middleName: z.string().optional(),
  position: selectValidator('Выберите вашу должность в компании из списка'),
  phone: phoneValidator,
  email: emailValidator,
  password: passwordValidator,
  confirmPassword: z.string({ required_error: 'Подтвердите пароль' }).min(1, 'Повторите пароль для подтверждения'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают. Убедитесь, что оба поля содержат одинаковый пароль',
  path: ['confirmPassword'],
})

// Step 3: Needs Schema
export const step3Schema = z.object({
  platformGoals: z.array(z.string()).min(1, 'Выберите хотя бы одну цель использования платформы'),
  productsOffered: z.string({ required_error: 'Опишите предлагаемые продукты/услуги' }).min(1, 'Опишите предлагаемые продукты/услуги').min(10, 'Описание должно содержать минимум 10 символов для лучшего понимания вашего предложения'),
  productsNeeded: z.string({ required_error: 'Опишите требуемые продукты/услуги' }).min(1, 'Опишите требуемые продукты/услуги').min(10, 'Описание должно содержать минимум 10 символов для точного поиска партнеров'),
  partnerIndustries: z.array(z.string()).optional(),
  partnerGeography: z.array(z.string()).optional(),
})

// Step 4: Marketing Schema
export const step4Schema = z.object({
  source: z.string().optional(),
  agreeToTerms: z.coerce.boolean().refine((val) => val === true, {
    message: 'Необходимо согласиться с условиями использования и политикой конфиденциальности для продолжения регистрации',
  }),
  agreeToMarketing: z.coerce.boolean().optional(),
})

// Full registration schema (all steps combined)
export const registrationSchema = z.object({
  // Step 1
  inn: innValidator,
  ogrn: ogrnValidator,
  fullName: z.string({ required_error: 'Полное наименование обязательно' }).min(1, 'Полное наименование обязательно'),
  shortName: z.string().optional(),
  legalForm: selectValidator('Выберите организационно-правовую форму'),
  industry: selectValidator('Выберите сферу деятельности'),
  companySize: selectValidator('Выберите размер компании'),
  website: urlValidator,
  
  // Step 2
  firstName: z.string({ required_error: 'Имя обязательно' }).min(1, 'Имя обязательно'),
  lastName: z.string({ required_error: 'Фамилия обязательна' }).min(1, 'Фамилия обязательна'),
  middleName: z.string().optional(),
  position: selectValidator('Выберите должность'),
  phone: phoneValidator,
  email: emailValidator,
  password: passwordValidator,
  confirmPassword: z.string({ required_error: 'Подтвердите пароль' }),
  
  // Step 3
  platformGoals: z.array(z.string()).min(1, 'Выберите хотя бы одну цель'),
  productsOffered: z.string({ required_error: 'Опишите предлагаемые продукты/услуги' }).min(1, 'Опишите предлагаемые продукты/услуги'),
  productsNeeded: z.string({ required_error: 'Опишите требуемые продукты/услуги' }).min(1, 'Опишите требуемые продукты/услуги'),
  partnerIndustries: z.array(z.string()).default([]),
  partnerGeography: z.array(z.string()).default([]),
  
  // Step 4
  source: z.string().optional(),
  agreeToTerms: z.coerce.boolean(),
  agreeToMarketing: z.coerce.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

// Export types
export type Step1FormData = z.infer<typeof step1Schema>;
export type Step2FormData = z.infer<typeof step2Schema>;
export type Step3FormData = z.infer<typeof step3Schema>;
export type Step4FormData = z.infer<typeof step4Schema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Login schema
export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, 'Введите пароль'),
})

export type LoginFormData = z.infer<typeof loginSchema>;

// Company update schema
export const companyUpdateSchema = z.object({
  fullName: z.string().min(1, 'Полное наименование обязательно').optional(),
  shortName: z.string().optional(),
  slogan: z.string().max(200, 'Максимум 200 символов').optional(),
  foundedYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  website: urlValidator.optional(),
  phone: phoneValidator.optional(),
  email: emailValidator.optional(),
  employeeCount: z.string().optional(),
  revenue: z.string().optional(),
  legalAddress: z.string().optional(),
  actualAddress: z.string().optional(),
  bankDetails: z.string().optional(),
})

export type CompanyUpdateFormData = z.infer<typeof companyUpdateSchema>;

// Product/Service schema
export const productSchema = z.object({
  name: z.string().min(1, 'Название товара/услуги обязательно').min(3, 'Название должно содержать минимум 3 символа'),
  category: z.string().min(1, 'Выберите категорию товара/услуги из списка'),
  description: z.string().min(1, 'Описание товара/услуги обязательно').min(20, 'Описание должно содержать минимум 20 символов для полноты информации').max(500, 'Описание не должно превышать 500 символов'),
  type: z.enum(['sell', 'buy']),
  productUrl: urlValidator.optional(),
})

export type ProductFormData = z.infer<typeof productSchema>;

