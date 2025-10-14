import { z } from 'zod'
import { VALIDATION_PATTERNS } from '../constants'

// Custom validators
const innValidator = z
  .string()
  .min(1, 'ИНН обязателен')
  .regex(VALIDATION_PATTERNS.INN, 'ИНН должен содержать 10 или 12 цифр')

const ogrnValidator = z
  .string()
  .min(1, 'ОГРН обязателен')
  .regex(VALIDATION_PATTERNS.OGRN, 'ОГРН должен содержать 13 или 15 цифр')

const phoneValidator = z
  .string()
  .min(1, 'Телефон обязателен')
  .regex(VALIDATION_PATTERNS.PHONE, 'Неверный формат телефона')

const emailValidator = z
  .string()
  .min(1, 'Email обязателен')
  .email('Неверный формат email')

const urlValidator = z
  .string()
  .min(1, 'Сайт обязателен')
  .regex(VALIDATION_PATTERNS.URL, 'Неверный формат URL')

const passwordValidator = z
  .string()
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
  .regex(/[a-z]/, 'Пароль должен содержать хотя бы одну строчную букву')
  .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру')

// Step 1: Company Info Schema
export const step1Schema = z.object({
  inn: innValidator,
  ogrn: ogrnValidator,
  fullName: z.string().min(1, 'Полное наименование обязательно').min(3, 'Минимум 3 символа'),
  shortName: z.string().optional(),
  legalForm: z.string().min(1, 'Выберите организационно-правовую форму'),
  industry: z.string().min(1, 'Выберите сферу деятельности'),
  companySize: z.string().min(1, 'Выберите размер компании'),
  website: urlValidator,
})

// Step 2: Contact Person Schema
export const step2Schema = z.object({
  firstName: z.string().min(1, 'Имя обязательно').min(2, 'Минимум 2 символа'),
  lastName: z.string().min(1, 'Фамилия обязательна').min(2, 'Минимум 2 символа'),
  middleName: z.string().optional(),
  position: z.string().min(1, 'Выберите должность'),
  phone: phoneValidator,
  email: emailValidator,
  password: passwordValidator,
  confirmPassword: z.string().min(1, 'Подтвердите пароль'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

// Step 3: Needs Schema
export const step3Schema = z.object({
  platformGoals: z.array(z.string()).min(1, 'Выберите хотя бы одну цель'),
  productsOffered: z.string().min(1, 'Опишите предлагаемые продукты/услуги').min(10, 'Минимум 10 символов'),
  productsNeeded: z.string().min(1, 'Опишите требуемые продукты/услуги').min(10, 'Минимум 10 символов'),
  partnerIndustries: z.array(z.string()).optional(),
  partnerGeography: z.array(z.string()).optional(),
})

// Step 4: Marketing Schema
export const step4Schema = z.object({
  source: z.string().optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'Необходимо согласиться с условиями',
  }),
  agreeToMarketing: z.boolean().optional(),
})

// Full registration schema (all steps combined)
export const registrationSchema = z.object({
  // Step 1
  inn: innValidator,
  ogrn: ogrnValidator,
  fullName: z.string().min(1, 'Полное наименование обязательно'),
  shortName: z.string().optional(),
  legalForm: z.string().min(1, 'Выберите организационно-правовую форму'),
  industry: z.string().min(1, 'Выберите сферу деятельности'),
  companySize: z.string().min(1, 'Выберите размер компании'),
  website: urlValidator,
  
  // Step 2
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  middleName: z.string().optional(),
  position: z.string().min(1, 'Выберите должность'),
  phone: phoneValidator,
  email: emailValidator,
  password: passwordValidator,
  confirmPassword: z.string(),
  
  // Step 3
  platformGoals: z.array(z.string()).min(1, 'Выберите хотя бы одну цель'),
  productsOffered: z.string().min(1, 'Опишите предлагаемые продукты/услуги'),
  productsNeeded: z.string().min(1, 'Опишите требуемые продукты/услуги'),
  partnerIndustries: z.array(z.string()).optional(),
  partnerGeography: z.array(z.string()).optional(),
  
  // Step 4
  source: z.string().optional(),
  agreeToTerms: z.boolean(),
  agreeToMarketing: z.boolean().optional(),
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
  name: z.string().min(1, 'Название обязательно').min(3, 'Минимум 3 символа'),
  category: z.string().min(1, 'Выберите категорию'),
  description: z.string().min(1, 'Описание обязательно').min(20, 'Минимум 20 символов').max(500, 'Максимум 500 символов'),
  type: z.enum(['sell', 'buy']),
  productUrl: urlValidator.optional(),
})

export type ProductFormData = z.infer<typeof productSchema>;

