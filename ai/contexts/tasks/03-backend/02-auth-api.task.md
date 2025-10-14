# Задача: Authentication & Authorization API

## Описание
Реализация системы аутентификации и авторизации с JWT токенами.

## Цель
Обеспечить безопасную регистрацию, вход и управление сессиями пользователей.

## Технические требования

### 1. src/controllers/authController.js
```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { publishToQueue, QUEUES } from '../config/rabbitmq.js';
import { ValidationError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
}

export const authController = {
  async register(req, res, next) {
    const trx = await db.transaction();
    
    try {
      const {
        // Блок 1: Основная информация о компании
        inn, ogrn, fullName, shortName, legalForm, industry, companySize, website,
        
        // Блок 2: Контактное лицо
        firstName, lastName, middleName, position, phone, email, password,
        
        // Блок 3: Детализация потребностей
        platformGoals, productsOffered, productsNeeded, partnerIndustries, partnerGeography,
        
        // Блок 4: Маркетинговый
        source, agreeToTerms, agreeToMarketing,
      } = req.body;
      
      // Валидация обязательных полей
      if (!inn || !ogrn || !fullName || !legalForm || !industry || !companySize || !website) {
        throw new ValidationError('Missing required company fields');
      }
      if (!firstName || !lastName || !position || !phone || !email || !password) {
        throw new ValidationError('Missing required contact fields');
      }
      if (!agreeToTerms) {
        throw new ValidationError('You must agree to terms and conditions');
      }
      
      // Проверка существующего пользователя
      const existingUser = await trx('users').where({ email }).first();
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }
      
      // Проверка существующей компании (ИНН)
      const existingCompany = await trx('companies').where({ inn }).first();
      if (existingCompany) {
        throw new ConflictError('Company with this INN already exists');
      }
      
      // Валидация домена email (должен совпадать с доменом сайта)
      const emailDomain = email.split('@')[1];
      const websiteDomain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      
      if (emailDomain !== websiteDomain) {
        throw new ValidationError('Email domain must match company website domain');
      }
      
      // Хеширование пароля
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Генерация токена верификации email
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
      
      // Создание пользователя
      const [user] = await trx('users').insert({
        email,
        password_hash: passwordHash,
        role: 'user',
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires,
      }).returning('*');
      
      // Создание компании
      const [company] = await trx('companies').insert({
        user_id: user.id,
        inn,
        ogrn,
        full_name: fullName,
        short_name: shortName,
        legal_form: legalForm,
        industry,
        company_size: companySize,
        website,
        phone,
        email: email,
        verified: false,
      }).returning('*');
      
      // Создание контактного лица
      await trx('contact_persons').insert({
        company_id: company.id,
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        position,
        phone,
        email,
        is_primary: true,
      });
      
      // Сохранение целей использования платформы
      if (platformGoals && Array.isArray(platformGoals)) {
        await trx('platform_goals').insert(
          platformGoals.map(goal => ({
            company_id: company.id,
            goal_type: goal.type,
            other_description: goal.description,
          }))
        );
      }
      
      // Сохранение отраслей партнеров
      if (partnerIndustries && Array.isArray(partnerIndustries)) {
        await trx('partner_industries').insert(
          partnerIndustries.map(industry => ({
            company_id: company.id,
            industry,
          }))
        );
      }
      
      // Сохранение географии поиска
      if (partnerGeography && Array.isArray(partnerGeography)) {
        await trx('partner_geography').insert(
          partnerGeography.map(geo => ({
            company_id: company.id,
            geography_type: geo.type,
            region: geo.region,
            country: geo.country,
          }))
        );
      }
      
      await trx.commit();
      
      // Отправка задачи на верификацию компании через API ФНС
      await publishToQueue(QUEUES.COMPANY_VERIFICATION, {
        companyId: company.id,
        inn,
        ogrn,
      });
      
      // Отправка email верификации
      await sendVerificationEmail(email, verificationToken);
      
      // Генерация токенов
      const tokens = generateTokens(user.id);
      
      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user: {
          id: user.id,
          email: user.email,
        },
        company: {
          id: company.id,
          name: company.full_name,
        },
        tokens,
      });
      
    } catch (error) {
      await trx.rollback();
      next(error);
    }
  },
  
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }
      
      // Поиск пользователя
      const user = await db('users').where({ email }).first();
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }
      
      // Проверка пароля
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }
      
      // Обновление времени последнего входа
      await db('users').where({ id: user.id }).update({
        last_login: db.fn.now(),
      });
      
      // Получение компании пользователя
      const company = await db('companies').where({ user_id: user.id }).first();
      
      // Генерация токенов
      const tokens = generateTokens(user.id);
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified,
        },
        company: company ? {
          id: company.id,
          name: company.full_name,
          verified: company.verified,
        } : null,
        tokens,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      
      const user = await db('users')
        .where({ verification_token: token })
        .where('verification_token_expires', '>', db.fn.now())
        .first();
      
      if (!user) {
        throw new ValidationError('Invalid or expired verification token');
      }
      
      await db('users').where({ id: user.id }).update({
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      });
      
      res.json({
        message: 'Email verified successfully',
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      
      const user = await db('users').where({ email }).first();
      if (!user) {
        // Не раскрываем, существует ли пользователь
        return res.json({
          message: 'If the email exists, a password reset link has been sent',
        });
      }
      
      // Генерация токена сброса пароля
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 час
      
      await db('users').where({ id: user.id }).update({
        reset_password_token: resetToken,
        reset_password_expires: resetTokenExpires,
      });
      
      await sendPasswordResetEmail(email, resetToken);
      
      res.json({
        message: 'If the email exists, a password reset link has been sent',
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      
      const user = await db('users')
        .where({ reset_password_token: token })
        .where('reset_password_expires', '>', db.fn.now())
        .first();
      
      if (!user) {
        throw new ValidationError('Invalid or expired reset token');
      }
      
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      await db('users').where({ id: user.id }).update({
        password_hash: passwordHash,
        reset_password_token: null,
        reset_password_expires: null,
      });
      
      res.json({
        message: 'Password reset successful',
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required');
      }
      
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid token type');
      }
      
      const tokens = generateTokens(decoded.userId);
      
      res.json({ tokens });
      
    } catch (error) {
      next(new UnauthorizedError('Invalid refresh token'));
    }
  },
  
  async logout(req, res, next) {
    try {
      // В stateless JWT системе logout обычно обрабатывается на клиенте
      // Можно добавить blacklist токенов в Redis при необходимости
      
      res.json({
        message: 'Logout successful',
      });
      
    } catch (error) {
      next(error);
    }
  },
};
```

### 2. src/middlewares/auth.js
```javascript
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { db } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET;

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Получение пользователя
    const user = await db('users').where({ id: decoded.userId }).first();
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    
    // Добавление пользователя в req
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    
    // Получение компании пользователя
    const company = await db('companies').where({ user_id: user.id }).first();
    if (company) {
      req.company = {
        id: company.id,
        name: company.full_name,
      };
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
}

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    
    next();
  };
}
```

### 3. src/routes/authRoutes.js
```javascript
import express from 'express';
import { authController } from '../controllers/authController.js';
import { authRateLimiter } from '../middlewares/rateLimit.js';
import { validateRegistration, validateLogin } from '../middlewares/validation.js';

const router = express.Router();

router.post('/register', authRateLimiter, validateRegistration, authController.register);
router.post('/login', authRateLimiter, validateLogin, authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/request-password-reset', authRateLimiter, authController.requestPasswordReset);
router.post('/reset-password', authRateLimiter, authController.resetPassword);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
```

### 4. src/middlewares/validation.js
```javascript
import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';

const registrationSchema = Joi.object({
  // Блок 1
  inn: Joi.string().length(10).pattern(/^\d+$/).required()
    .messages({ 'string.length': 'INN must be exactly 10 digits' }),
  ogrn: Joi.string().min(13).max(15).pattern(/^\d+$/).required(),
  fullName: Joi.string().min(3).max(500).required(),
  shortName: Joi.string().max(255).optional(),
  legalForm: Joi.string().required(),
  industry: Joi.string().required(),
  companySize: Joi.string().valid('1-10', '11-50', '51-250', '251-500', '500+').required(),
  website: Joi.string().uri().required(),
  
  // Блок 2
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  middleName: Joi.string().max(100).optional(),
  position: Joi.string().min(2).max(200).required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase and one digit'
    }),
  
  // Блок 3
  platformGoals: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    description: Joi.string().optional(),
  })).optional(),
  productsOffered: Joi.string().optional(),
  productsNeeded: Joi.string().optional(),
  partnerIndustries: Joi.array().items(Joi.string()).optional(),
  partnerGeography: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    region: Joi.string().optional(),
    country: Joi.string().optional(),
  })).optional(),
  
  // Блок 4
  source: Joi.string().optional(),
  agreeToTerms: Joi.boolean().valid(true).required(),
  agreeToMarketing: Joi.boolean().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export function validateRegistration(req, res, next) {
  const { error } = registrationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map(detail => detail.message);
    return next(new ValidationError(messages.join('; ')));
  }
  next();
}

export function validateLogin(req, res, next) {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return next(new ValidationError(error.details[0].message));
  }
  next();
}
```

### 5. src/services/emailService.js
```javascript
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Подтверждение email - B2B Платформа',
      html: `
        <h1>Добро пожаловать!</h1>
        <p>Пожалуйста, подтвердите ваш email, перейдя по ссылке:</p>
        <a href="${verificationUrl}">Подтвердить email</a>
        <p>Ссылка действительна в течение 24 часов.</p>
      `,
    });
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }
}

export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Сброс пароля - B2B Платформа',
      html: `
        <h1>Сброс пароля</h1>
        <p>Вы запросили сброс пароля. Перейдите по ссылке:</p>
        <a href="${resetUrl}">Сбросить пароль</a>
        <p>Ссылка действительна в течение 1 часа.</p>
        <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
      `,
    });
    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
  }
}
```

## Критерии приёмки
- [ ] Регистрация работает с валидацией всех 4 блоков
- [ ] JWT токены генерируются корректно
- [ ] Refresh token механизм работает
- [ ] Email верификация реализована
- [ ] Сброс пароля работает
- [ ] Middleware аутентификации защищает endpoints
- [ ] Rate limiting для auth endpoints активен
- [ ] Валидация домена email с сайтом работает
- [ ] Задача верификации через ФНС отправляется в очередь

## Зависимости
- Задача 01-backend-core
- Задача 01-database-schema

## Приоритет
Критический (P0)

## Оценка времени
8-10 часов

