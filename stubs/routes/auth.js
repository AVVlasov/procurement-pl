const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const Request = require('../models/Request');
const BuyProduct = require('../models/BuyProduct');
const Message = require('../models/Message');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const { Types } = mongoose;
const connectDB = require('../config/db');

const PRESET_COMPANY_ID = new Types.ObjectId('68fe2ccda3526c303ca06796');
const PRESET_USER_EMAIL = 'admin@test-company.ru';

const changePasswordFlow = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    return { status: 400, body: { error: 'Current password and new password are required' } };
  }

  if (typeof newPassword !== 'string' || newPassword.trim().length < 8) {
    return { status: 400, body: { error: 'New password must be at least 8 characters long' } };
  }

  const user = await User.findById(userId);

  if (!user) {
    return { status: 404, body: { error: 'User not found' } };
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return { status: 400, body: { error: 'Current password is incorrect' } };
  }

  user.password = newPassword;
  user.updatedAt = new Date();
  await user.save();

  return { status: 200, body: { message: 'Password updated successfully' } };
};

const deleteAccountFlow = async (userId, password) => {
  if (!password) {
    return { status: 400, body: { error: 'Password is required to delete account' } };
  }

  const user = await User.findById(userId);

  if (!user) {
    return { status: 404, body: { error: 'User not found' } };
  }

  const validPassword = await user.comparePassword(password);

  if (!validPassword) {
    return { status: 400, body: { error: 'Password is incorrect' } };
  }

  const companyId = user.companyId ? user.companyId.toString() : null;
  const companyObjectId = companyId && Types.ObjectId.isValid(companyId) ? new Types.ObjectId(companyId) : null;

  const cleanupTasks = [];

  if (companyId) {
    cleanupTasks.push(Request.deleteMany({
      $or: [{ senderCompanyId: companyId }, { recipientCompanyId: companyId }],
    }));

    cleanupTasks.push(BuyProduct.deleteMany({ companyId }));

    if (companyObjectId) {
      cleanupTasks.push(Message.deleteMany({
        $or: [
          { senderCompanyId: companyObjectId },
          { recipientCompanyId: companyObjectId },
        ],
      }));

      cleanupTasks.push(Review.deleteMany({
        $or: [
          { companyId: companyObjectId },
          { authorCompanyId: companyObjectId },
        ],
      }));
    }

    cleanupTasks.push(Company.findByIdAndDelete(companyId));
  }

  cleanupTasks.push(User.findByIdAndDelete(user._id));

  await Promise.all(cleanupTasks);

  return { status: 200, body: { message: 'Account deleted successfully' } };
};

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

const waitForDatabaseConnection = async () => {
  const isAuthFailure = (error) => {
    if (!error) return false;
    if (error.code === 13 || error.code === 18) return true;
    return /auth/i.test(String(error.message || ''));
  };

  const verifyAuth = async () => {
    try {
      await mongoose.connection.db.admin().command({ listDatabases: 1 });
      return true;
    } catch (error) {
      if (isAuthFailure(error)) {
        return false;
      }
      throw error;
    }
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    if (mongoose.connection.readyState === 1) {
      const authed = await verifyAuth();
      if (authed) {
        return;
      }
      await mongoose.connection.close().catch(() => {});
    }

    try {
      const connection = await connectDB();
      if (!connection) {
        break;
      }

      const authed = await verifyAuth();
      if (authed) {
        return;
      }

      await mongoose.connection.close().catch(() => {});
    } catch (error) {
      if (!isAuthFailure(error)) {
        throw error;
      }
    }
  }

  throw new Error('Unable to authenticate with MongoDB');
};

// Инициализация тестового пользователя
const initializeTestUser = async () => {
  try {
    await waitForDatabaseConnection();

    let company = await Company.findById(PRESET_COMPANY_ID);
    if (!company) {
      company = await Company.create({
        _id: PRESET_COMPANY_ID,
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
      log('✅ Test company initialized');
    } else {
      await Company.updateOne(
        { _id: PRESET_COMPANY_ID },
        {
          $set: {
            fullName: 'ООО "Тестовая Компания"',
            shortName: 'ООО "Тест"',
            industry: 'Производство',
            companySize: '50-100',
            partnerGeography: ['moscow', 'russia_all'],
            website: 'https://test-company.ru',
          },
        }
      );
    }

    let existingUser = await User.findOne({ email: PRESET_USER_EMAIL });
    if (!existingUser) {
      existingUser = await User.create({
        email: PRESET_USER_EMAIL,
        password: 'SecurePass123!',
        firstName: 'Иван',
        lastName: 'Петров',
        position: 'Генеральный директор',
        companyId: PRESET_COMPANY_ID
      });
      log('✅ Test user initialized');
    } else if (!existingUser.companyId || existingUser.companyId.toString() !== PRESET_COMPANY_ID.toString()) {
      existingUser.companyId = PRESET_COMPANY_ID;
      existingUser.updatedAt = new Date();
      await existingUser.save();
      log('ℹ️ Test user company reference was fixed');
    }
  } catch (error) {
    console.error('Error initializing test data:', error.message);
    if (error?.code === 13 || /auth/i.test(error?.message || '')) {
      try {
        await connectDB();
      } catch (connectError) {
        if (process.env.DEV === 'true') {
          console.error('Failed to re-connect after auth error:', connectError.message);
        }
      }
    }
  }
};

initializeTestUser();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    await waitForDatabaseConnection();

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
    if (process.env.DEV === 'true') {
      console.log('[Auth] /login called');
    }
    await waitForDatabaseConnection();
    if (process.env.DEV === 'true') {
      console.log('[Auth] DB ready, running login query');
    }

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

    if (
      user.email === PRESET_USER_EMAIL &&
      (!user.companyId || user.companyId.toString() !== PRESET_COMPANY_ID.toString())
    ) {
      await User.updateOne(
        { _id: user._id },
        { $set: { companyId: PRESET_COMPANY_ID, updatedAt: new Date() } }
      );
      user.companyId = PRESET_COMPANY_ID;
    }

    // Получить компанию до использования в generateToken
    let companyData = null;
    try {
      companyData = user.companyId ? await Company.findById(user.companyId) : null;
    } catch (err) {
      console.error('Failed to fetch company:', err.message);
    }

    if (user.email === PRESET_USER_EMAIL) {
      try {
        companyData = await Company.findByIdAndUpdate(
          PRESET_COMPANY_ID,
          {
            $set: {
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
              slogan: 'Качество и инновация',
              updatedAt: new Date(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.error('Failed to ensure preset company:', err.message);
      }
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
    res.status(500).json({ error: `LOGIN_ERROR: ${error.message}` });
  }
});

// Смена пароля
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const result = await changePasswordFlow(req.userId, currentPassword, newPassword);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удаление аккаунта
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const { password } = req.body || {};
    const result = await deleteAccountFlow(req.userId, password);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Обновить профиль / универсальные действия
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const rawAction = req.body?.action || req.query?.action || req.body?.type;
    const payload = req.body?.payload || req.body || {};
    const action = typeof rawAction === 'string' ? rawAction : '';

    if (action === 'changePassword') {
      const result = await changePasswordFlow(req.userId, payload.currentPassword, payload.newPassword);
      return res.status(result.status).json(result.body);
    }

    if (action === 'deleteAccount') {
      const result = await deleteAccountFlow(req.userId, payload.password);
      return res.status(result.status).json(result.body);
    }

    res.json({ message: 'Profile endpoint' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
