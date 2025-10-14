# Задача: Company Profile API

## Описание
CRUD операции для управления профилями компаний, включая основную информацию, адреса и банковские реквизиты.

## Технические требования

### 1. src/controllers/companyController.js
```javascript
import { db } from '../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { cache } from '../config/redis.js';
import { publishToQueue, QUEUES } from '../config/rabbitmq.js';

export const companyController = {
  async getCompany(req, res, next) {
    try {
      const { id } = req.params;
      
      // Проверка кэша
      const cached = await cache.get(`company:${id}`);
      if (cached) {
        return res.json(cached);
      }
      
      const company = await db('companies')
        .where({ id })
        .first();
      
      if (!company) {
        throw new NotFoundError('Company not found');
      }
      
      // Получение связанных данных
      const [contacts, addresses, bankDetails, products, needs] = await Promise.all([
        db('contact_persons').where({ company_id: id }),
        db('company_addresses').where({ company_id: id }),
        db('bank_details').where({ company_id: id }),
        db('products_services_offered').where({ company_id: id, is_active: true }),
        db('products_services_needed').where({ company_id: id, is_active: true }),
      ]);
      
      // Подсчет среднего рейтинга
      const rating = await db.raw(`
        SELECT calculate_company_rating(?) as avg_rating,
               COUNT(*) as review_count
        FROM reviews
        WHERE to_company_id = ? AND verified = true AND is_visible = true
      `, [id, id]);
      
      const result = {
        ...company,
        contacts,
        addresses,
        bankDetails: company.is_public_bank_details ? bankDetails : [],
        products,
        needs,
        rating: {
          average: parseFloat(rating.rows[0].avg_rating) || 0,
          count: parseInt(rating.rows[0].review_count) || 0,
        },
      };
      
      // Кэширование на 1 час
      await cache.set(`company:${id}`, result, 3600);
      
      // Логирование просмотра (если не владелец)
      if (!req.user || req.company?.id !== id) {
        await db('activity_log').insert({
          user_id: req.user?.id,
          company_id: req.company?.id,
          action: 'view_profile',
          entity_type: 'company',
          entity_id: id,
        });
        
        await db('companies').where({ id }).increment('view_count', 1);
      }
      
      res.json(result);
      
    } catch (error) {
      next(error);
    }
  },
  
  async updateCompany(req, res, next) {
    try {
      const { id } = req.params;
      
      // Проверка прав доступа
      if (req.company?.id !== id && req.user.role !== 'admin') {
        throw new ForbiddenError('You can only update your own company');
      }
      
      const {
        shortName, industry, companySize, revenueRange, website,
        phone, email, foundationYear, slogan, description, logoUrl,
      } = req.body;
      
      const updateData = {};
      if (shortName !== undefined) updateData.short_name = shortName;
      if (industry) updateData.industry = industry;
      if (companySize) updateData.company_size = companySize;
      if (revenueRange) updateData.revenue_range = revenueRange;
      if (website) updateData.website = website;
      if (phone) updateData.phone = phone;
      if (email) updateData.email = email;
      if (foundationYear) updateData.foundation_year = foundationYear;
      if (slogan !== undefined) updateData.slogan = slogan;
      if (description !== undefined) updateData.description = description;
      if (logoUrl) updateData.logo_url = logoUrl;
      
      const [updated] = await db('companies')
        .where({ id })
        .update(updateData)
        .returning('*');
      
      if (!updated) {
        throw new NotFoundError('Company not found');
      }
      
      // Очистка кэша
      await cache.del(`company:${id}`);
      
      res.json({
        message: 'Company updated successfully',
        company: updated,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async uploadLogo(req, res, next) {
    try {
      const { id } = req.params;
      
      if (req.company?.id !== id) {
        throw new ForbiddenError('You can only update your own company logo');
      }
      
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }
      
      const logoUrl = `/uploads/logos/${req.file.filename}`;
      
      await db('companies')
        .where({ id })
        .update({ logo_url: logoUrl });
      
      await cache.del(`company:${id}`);
      
      res.json({
        message: 'Logo uploaded successfully',
        logoUrl,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async getVerificationStatus(req, res, next) {
    try {
      const { id } = req.params;
      
      const company = await db('companies')
        .where({ id })
        .select('verified', 'verified_at', 'fns_data')
        .first();
      
      if (!company) {
        throw new NotFoundError('Company not found');
      }
      
      res.json({
        verified: company.verified,
        verifiedAt: company.verified_at,
        fnsData: company.fns_data,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async initiateVerification(req, res, next) {
    try {
      const { id } = req.params;
      
      if (req.company?.id !== id) {
        throw new ForbiddenError('You can only verify your own company');
      }
      
      const company = await db('companies').where({ id }).first();
      
      if (!company) {
        throw new NotFoundError('Company not found');
      }
      
      // Отправка задачи в AI service для проверки через API ФНС
      await publishToQueue(QUEUES.COMPANY_VERIFICATION, {
        companyId: company.id,
        inn: company.inn,
        ogrn: company.ogrn,
      });
      
      res.json({
        message: 'Verification initiated',
        status: 'pending',
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async addAddress(req, res, next) {
    try {
      const { id } = req.params;
      const { type, country, region, city, street, building, office, postalCode, fullAddress } = req.body;
      
      if (req.company?.id !== id) {
        throw new ForbiddenError('Access denied');
      }
      
      const [address] = await db('company_addresses')
        .insert({
          company_id: id,
          type,
          country,
          region,
          city,
          street,
          building,
          office,
          postal_code: postalCode,
          full_address: fullAddress,
        })
        .returning('*');
      
      await cache.del(`company:${id}`);
      
      res.status(201).json({
        message: 'Address added successfully',
        address,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async updateAddress(req, res, next) {
    try {
      const { id, addressId } = req.params;
      
      if (req.company?.id !== id) {
        throw new ForbiddenError('Access denied');
      }
      
      const [updated] = await db('company_addresses')
        .where({ id: addressId, company_id: id })
        .update(req.body)
        .returning('*');
      
      if (!updated) {
        throw new NotFoundError('Address not found');
      }
      
      await cache.del(`company:${id}`);
      
      res.json({
        message: 'Address updated successfully',
        address: updated,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async getBankDetails(req, res, next) {
    try {
      const { id } = req.params;
      
      // Только владелец или админ может видеть скрытые реквизиты
      const isOwner = req.company?.id === id || req.user.role === 'admin';
      
      const query = db('bank_details').where({ company_id: id });
      
      if (!isOwner) {
        query.where({ is_visible: true });
      }
      
      const details = await query;
      
      res.json(details);
      
    } catch (error) {
      next(error);
    }
  },
  
  async addBankDetails(req, res, next) {
    try {
      const { id } = req.params;
      const { bankName, bik, accountNumber, correspondentAccount, isVisible } = req.body;
      
      if (req.company?.id !== id) {
        throw new ForbiddenError('Access denied');
      }
      
      const [details] = await db('bank_details')
        .insert({
          company_id: id,
          bank_name: bankName,
          bik,
          account_number: accountNumber,
          correspondent_account: correspondentAccount,
          is_visible: isVisible || false,
        })
        .returning('*');
      
      await cache.del(`company:${id}`);
      
      res.status(201).json({
        message: 'Bank details added successfully',
        details,
      });
      
    } catch (error) {
      next(error);
    }
  },
  
  async updateBankDetailsVisibility(req, res, next) {
    try {
      const { id, detailId } = req.params;
      const { isVisible } = req.body;
      
      if (req.company?.id !== id) {
        throw new ForbiddenError('Access denied');
      }
      
      const [updated] = await db('bank_details')
        .where({ id: detailId, company_id: id })
        .update({ is_visible: isVisible })
        .returning('*');
      
      if (!updated) {
        throw new NotFoundError('Bank details not found');
      }
      
      await cache.del(`company:${id}`);
      
      res.json({
        message: 'Visibility updated successfully',
        details: updated,
      });
      
    } catch (error) {
      next(error);
    }
  },
};
```

### 2. src/routes/companyRoutes.js
```javascript
import express from 'express';
import { companyController } from '../controllers/companyController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Конфигурация multer для загрузки логотипов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// Публичные endpoints
router.get('/:id', companyController.getCompany);
router.get('/:id/verification-status', companyController.getVerificationStatus);

// Защищенные endpoints
router.put('/:id', authenticate, companyController.updateCompany);
router.patch('/:id/logo', authenticate, upload.single('logo'), companyController.uploadLogo);
router.post('/:id/verify', authenticate, companyController.initiateVerification);

// Адреса
router.get('/:id/addresses', authenticate, companyController.getAddresses);
router.post('/:id/addresses', authenticate, companyController.addAddress);
router.put('/:id/addresses/:addressId', authenticate, companyController.updateAddress);

// Банковские реквизиты
router.get('/:id/bank-details', companyController.getBankDetails);
router.post('/:id/bank-details', authenticate, companyController.addBankDetails);
router.patch('/:id/bank-details/:detailId/visibility', authenticate, companyController.updateBankDetailsVisibility);

export default router;
```

## Критерии приёмки
- [ ] CRUD операции для компании работают
- [ ] Кэширование профилей в Redis реализовано
- [ ] Загрузка логотипа работает
- [ ] Управление адресами работает
- [ ] Управление банковскими реквизитами с видимостью работает
- [ ] Верификация через ФНС инициируется
- [ ] Просмотры профиля логируются
- [ ] Права доступа проверяются корректно

## Зависимости
- Задача 02-auth-api
- Задача 01-database-schema

## Приоритет
Высокий (P1)

## Оценка времени
6-8 часов

