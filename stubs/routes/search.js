const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Company = require('../models/Company');

// GET /search - Поиск компаний (с использованием MongoDB)
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

    console.log('[Search] Query:', { query, page, limit });

    // Построение query для MongoDB
    let mongoQuery = {};

    // Текстовый поиск
    if (query && query.trim()) {
      mongoQuery.$or = [
        { fullName: { $regex: query, $options: 'i' } },
        { shortName: { $regex: query, $options: 'i' } },
        { slogan: { $regex: query, $options: 'i' } },
        { industry: { $regex: query, $options: 'i' } }
      ];
    }

    // Фильтр по рейтингу
    if (minRating) {
      const rating = parseFloat(minRating);
      if (rating > 0) {
        mongoQuery.rating = { $gte: rating };
      }
    }

    // Фильтр по отзывам
    if (hasReviews === 'true') {
      mongoQuery.verified = true;
    }

    // Фильтр по акцептам
    if (hasAcceptedDocs === 'true') {
      mongoQuery.verified = true;
    }

    // Пагинация
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Сортировка
    let sortObj = { rating: -1 };
    if (sortBy === 'name') {
      sortObj = { fullName: 1 };
    }
    if (sortOrder === 'asc') {
      Object.keys(sortObj).forEach(key => {
        sortObj[key] = sortObj[key] === -1 ? 1 : -1;
      });
    }

    // Запрос к MongoDB
    const companies = await Company.find(mongoQuery)
      .limit(limitNum)
      .skip(skip)
      .sort(sortObj)
      .lean();

    const total = await Company.countDocuments(mongoQuery);

    console.log('[Search] Returned', companies.length, 'companies');

    res.json({
      companies,
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

