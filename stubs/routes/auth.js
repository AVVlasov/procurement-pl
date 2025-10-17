const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const { generateToken } = require('../middleware/auth');

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
    const company = await Company.create({
      fullName,
      inn,
      ogrn,
      legalForm,
      industry,
      companySize,
      website
    });

    // Создать пользователя
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      position,
      phone,
      companyId: company._id
    });

    // Генерировать токен
    const token = generateToken(user._id, user.email);

    res.status(201).json({
      tokens: {
        accessToken: token,
        refreshToken: token
      },
      user: user.toJSON(),
      company: company.toObject()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Логин
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Найти пользователя
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Проверить пароль
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Загрузить компанию
    const company = await Company.findById(user.companyId);

    // Генерировать токен
    const token = generateToken(user._id, user.email);

    res.json({
      tokens: {
        accessToken: token,
        refreshToken: token
      },
      user: user.toJSON(),
      company: company?.toObject() || null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
