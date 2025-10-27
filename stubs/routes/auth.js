const express = require('express');
const router = express.Router();
const { generateToken } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');

// Функция для логирования с проверкой DEV переменной
const log = (message, data = '') => {
  if (process.env.DEV === 'true') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// In-memory storage для логирования
let users = [];

// Инициализация тестового пользователя
const initializeTestUser = async () => {
  try {
    const existingUser = await User.findOne({ email: 'admin@test-company.ru' });
    if (!existingUser) {
      // Создать компанию
      const company = await Company.create({
        fullName: 'ООО "Тестовая Компания"',
        shortName: 'ООО "Тест"',
        inn: '7707083893',
        ogrn: '1027700132195',
        legalForm: 'ООО',
        industry: 'Производство',
        companySize: '50-100',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://test-company.ru',
        verified: true,
        rating: 4.5,
        description: 'Ведущая компания в области производства',
        slogan: 'Качество и инновация'
      });

      // Создать пользователя
      const user = await User.create({
        email: 'admin@test-company.ru',
        password: 'SecurePass123!',
        firstName: 'Иван',
        lastName: 'Петров',
        position: 'Генеральный директор',
        companyId: company._id
      });

      log('✅ Test user initialized');
    }

    // Инициализация других тестовых компаний
    const mockCompanies = [
      {
        fullName: 'ООО "СтройКомплект"',
        shortName: 'ООО "СтройКомплект"',
        inn: '7707083894',
        ogrn: '1027700132196',
        legalForm: 'ООО',
        industry: 'Строительство',
        companySize: '51-250',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://stroykomplekt.ru',
        verified: true,
        rating: 4.8,
        description: 'Компания строит будущее вместе',
        slogan: 'Строим будущее вместе'
      },
      {
        fullName: 'АО "Московский Строй"',
        shortName: 'АО "Московский Строй"',
        inn: '7707083895',
        ogrn: '1027700132197',
        legalForm: 'АО',
        industry: 'Строительство',
        companySize: '500+',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://moscow-stroy.ru',
        verified: true,
        rating: 4.9,
        description: 'Качество и надежность с 1995 года',
        slogan: 'Качество и надежность'
      },
      {
        fullName: 'ООО "ТеxПроект"',
        shortName: 'ООО "ТеxПроект"',
        inn: '7707083896',
        ogrn: '1027700132198',
        legalForm: 'ООО',
        industry: 'IT',
        companySize: '11-50',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://techproject.ru',
        verified: true,
        rating: 4.6,
        description: 'Решения в области информационных технологий',
        slogan: 'Технологии для бизнеса'
      },
      {
        fullName: 'ООО "ТоргПартнер"',
        shortName: 'ООО "ТоргПартнер"',
        inn: '7707083897',
        ogrn: '1027700132199',
        legalForm: 'ООО',
        industry: 'Оптовая торговля',
        companySize: '51-250',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://torgpartner.ru',
        verified: true,
        rating: 4.3,
        description: 'Оптовые поставки и логистика',
        slogan: 'Надежный партнер в торговле'
      },
      {
        fullName: 'ООО "ЭнергоПлюс"',
        shortName: 'ООО "ЭнергоПлюс"',
        inn: '7707083898',
        ogrn: '1027700132200',
        legalForm: 'ООО',
        industry: 'Энергетика',
        companySize: '251-500',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://energoplus.ru',
        verified: true,
        rating: 4.7,
        description: 'Энергетические решения и консалтинг',
        slogan: 'Энергия для развития'
      }
    ];

    for (const mockCompanyData of mockCompanies) {
      const existingCompany = await Company.findOne({ inn: mockCompanyData.inn });
      if (!existingCompany) {
        await Company.create(mockCompanyData);
        log(`✅ Mock company created: ${mockCompanyData.fullName}`);
      }
    }
  } catch (error) {
    console.error('Error initializing test data:', error.message);
  }
};

initializeTestUser();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, position, phone, fullName, inn, ogrn, legalForm, industry, companySize, website } = req.body;

    // Проверка обязательных полей
    if (!email || !password || !firstName || !lastName || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Создать компанию
    let company;
    try {
      company = new Company({
        fullName,
        shortName: fullName.substring(0, 20),
        inn,
        ogrn,
        legalForm,
        industry,
        companySize,
        website,
        verified: false,
        rating: 0,
        description: '',
        slogan: '',
        partnerGeography: ['moscow', 'russia_all']
      });
      const savedCompany = await company.save();
      company = savedCompany;
      log('✅ Company saved:', company._id, 'Result:', savedCompany ? 'Success' : 'Failed');
    } catch (err) {
      console.error('Company save error:', err);
      return res.status(400).json({ error: 'Failed to create company: ' + err.message });
    }

    // Создать пользователя
    try {
      const newUser = await User.create({
        email,
        password,
        firstName,
        lastName,
        position: position || '',
        phone: phone || '',
        companyId: company._id
      });

      log('✅ User created:', newUser._id);

      const token = generateToken(newUser._id.toString(), newUser.companyId.toString(), newUser.firstName, newUser.lastName, company.fullName);
      return res.status(201).json({
        tokens: {
          accessToken: token,
          refreshToken: token
        },
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          position: newUser.position,
          companyId: newUser.companyId.toString()
        },
        company: {
          id: company._id.toString(),
          name: company.fullName,
          inn: company.inn
        }
      });
    } catch (err) {
      console.error('User creation error:', err);
      return res.status(400).json({ error: 'Failed to create user: ' + err.message });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Вход
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Инициализация других тестовых компаний
    const mockCompanies = [
      {
        fullName: 'ООО "СтройКомплект"',
        shortName: 'ООО "СтройКомплект"',
        inn: '7707083894',
        ogrn: '1027700132196',
        legalForm: 'ООО',
        industry: 'Строительство',
        companySize: '51-250',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://stroykomplekt.ru',
        verified: true,
        rating: 4.8,
        description: 'Компания строит будущее вместе',
        slogan: 'Строим будущее вместе'
      },
      {
        fullName: 'АО "Московский Строй"',
        shortName: 'АО "Московский Строй"',
        inn: '7707083895',
        ogrn: '1027700132197',
        legalForm: 'АО',
        industry: 'Строительство',
        companySize: '500+',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://moscow-stroy.ru',
        verified: true,
        rating: 4.9,
        description: 'Качество и надежность с 1995 года',
        slogan: 'Качество и надежность'
      },
      {
        fullName: 'ООО "ТеxПроект"',
        shortName: 'ООО "ТеxПроект"',
        inn: '7707083896',
        ogrn: '1027700132198',
        legalForm: 'ООО',
        industry: 'IT',
        companySize: '11-50',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://techproject.ru',
        verified: true,
        rating: 4.6,
        description: 'Решения в области информационных технологий',
        slogan: 'Технологии для бизнеса'
      },
      {
        fullName: 'ООО "ТоргПартнер"',
        shortName: 'ООО "ТоргПартнер"',
        inn: '7707083897',
        ogrn: '1027700132199',
        legalForm: 'ООО',
        industry: 'Оптовая торговля',
        companySize: '51-250',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://torgpartner.ru',
        verified: true,
        rating: 4.3,
        description: 'Оптовые поставки и логистика',
        slogan: 'Надежный партнер в торговле'
      },
      {
        fullName: 'ООО "ЭнергоПлюс"',
        shortName: 'ООО "ЭнергоПлюс"',
        inn: '7707083898',
        ogrn: '1027700132200',
        legalForm: 'ООО',
        industry: 'Энергетика',
        companySize: '251-500',
        partnerGeography: ['moscow', 'russia_all'],
        website: 'https://energoplus.ru',
        verified: true,
        rating: 4.7,
        description: 'Энергетические решения и консалтинг',
        slogan: 'Энергия для развития'
      }
    ];

    for (const mockCompanyData of mockCompanies) {
      try {
        const existingCompany = await Company.findOne({ inn: mockCompanyData.inn });
        if (!existingCompany) {
          await Company.create(mockCompanyData);
        }
      } catch (err) {
        // Ignore errors for mock company creation
      }
    }

    // Получить компанию до использования в generateToken
    let companyData = null;
    try {
      companyData = await Company.findById(user.companyId);
    } catch (err) {
      console.error('Failed to fetch company:', err.message);
    }

    const token = generateToken(user._id.toString(), user.companyId.toString(), user.firstName, user.lastName, companyData?.fullName || 'Company');
    log('✅ Token generated for user:', user._id);
    
    res.json({
      tokens: {
        accessToken: token,
        refreshToken: token
      },
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        companyId: user.companyId.toString()
      },
      company: companyData ? {
        id: companyData._id.toString(),
        name: companyData.fullName,
        inn: companyData.inn
      } : null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновить профиль
router.patch('/profile', (req, res) => {
  // требует авторизации, добавить middleware
  res.json({ message: 'Update profile endpoint' });
});

module.exports = router;
