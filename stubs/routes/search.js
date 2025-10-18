const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { mockCompanies } = require('../mocks/companies.json');

// Маппинг отраслей для фильтрации
const industryMapping = {
  'it': 'IT',
  'finance': 'Финансы',
  'manufacturing': 'Производство',
  'construction': 'Строительство',
  'retail': 'Торговля',
  'wholesale': 'Торговля',
  'logistics': 'Логистика',
  'healthcare': 'Медицина'
};

// GET /search/companies - Поиск компаний
router.get('/companies', verifyToken, (req, res) => {
  try {
    const {
      query = '',
      industries = '',
      companySizes = '',
      geographies = '',
      minRating = 0,
      hasReviews,
      hasAccepts
    } = req.query;

    let result = [...mockCompanies];

    // Фильтр по текстовому запросу
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.slogan.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      );
    }

    // Фильтр по отраслям
    if (industries) {
      const selectedIndustries = industries.split(',');
      result = result.filter(c => {
        const mappedIndustries = selectedIndustries.map(i => industryMapping[i] || i);
        return mappedIndustries.some(ind =>
          c.industry.toLowerCase().includes(ind.toLowerCase())
        );
      });
    }

    // Фильтр по размеру компании
    if (companySizes) {
      const sizes = companySizes.split(',');
      result = result.filter(c => {
        if (!c.companySize) return false;
        return sizes.some(size => {
          if (size === '1-10') return c.companySize === '1-10';
          if (size === '11-50') return c.companySize === '10-50';
          if (size === '51-250') return c.companySize.includes('50') || c.companySize.includes('100') || c.companySize.includes('250');
          if (size === '251-500') return c.companySize.includes('250') || c.companySize.includes('500');
          if (size === '500+') return c.companySize === '500+';
          return false;
        });
      });
    }

    // Фильтр по рейтингу
    const rating = parseFloat(minRating);
    if (rating > 0) {
      result = result.filter(c => c.rating >= rating);
    }

    // Фильтр по наличию отзывов
    if (hasReviews === 'true') {
      result = result.filter(c => c.verified === true);
    }

    // Фильтр по акцептам документов
    if (hasAccepts === 'true') {
      result = result.filter(c => c.verified === true);
    }

    res.json({
      companies: result,
      total: result.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

