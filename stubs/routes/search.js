const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Company = require('../models/Company');

// GET /search/recommendations - получить рекомендации компаний (ДОЛЖЕН быть ПЕРЕД /*)
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    // Получить компанию пользователя, чтобы исключить её из результатов
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    let filter = {};
    if (user && user.companyId) {
      filter._id = { $ne: user.companyId };
    }

    const companies = await Company.find(filter)
      .sort({ rating: -1 })
      .limit(5);

    const recommendations = companies.map(company => ({
      id: company._id.toString(),
      name: company.fullName || company.shortName,
      industry: company.industry,
      logo: company.logo,
      matchScore: Math.floor(Math.random() * 30 + 70), // 70-100
      reason: 'Matches your search criteria'
    }));

    console.log('[Search] Returned recommendations:', recommendations.length);

    res.json(recommendations);
  } catch (error) {
    console.error('[Search] Recommendations error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /search - Поиск компаний
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      query = '', 
      page = 1, 
      limit = 10,
      minRating = 0,
      hasReviews,
      hasAcceptedDocs,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;

    // Получить компанию пользователя, чтобы исключить её из результатов
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    // Начальный фильтр: исключить собственную компанию
    let filters = [];
    
    if (user && user.companyId) {
      filters.push({ _id: { $ne: user.companyId } });
    }

    // Текстовый поиск
    if (query && query.trim()) {
      const q = query.toLowerCase();
      filters.push({
        $or: [
          { fullName: { $regex: q, $options: 'i' } },
          { shortName: { $regex: q, $options: 'i' } },
          { slogan: { $regex: q, $options: 'i' } },
          { industry: { $regex: q, $options: 'i' } }
        ]
      });
    }

    // Фильтр по рейтингу
    if (minRating) {
      const rating = parseFloat(minRating);
      if (rating > 0) {
        filters.push({ rating: { $gte: rating } });
      }
    }

    // Фильтр по отзывам
    if (hasReviews === 'true') {
      filters.push({ verified: true });
    }

    // Фильтр по акцептам
    if (hasAcceptedDocs === 'true') {
      filters.push({ verified: true });
    }

    // Комбинировать все фильтры
    let filter = filters.length > 0 ? { $and: filters } : {};

    // Пагинация
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Сортировка
    let sortOptions = {};
    if (sortBy === 'name') {
      sortOptions.fullName = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.rating = sortOrder === 'asc' ? 1 : -1;
    }

    const total = await Company.countDocuments(filter);
    const companies = await Company.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const paginatedResults = companies.map(c => ({
      ...c.toObject(),
      id: c._id
    }));

    console.log('[Search] Returned', paginatedResults.length, 'companies');

    res.json({
      companies: paginatedResults,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('[Search] Error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;

