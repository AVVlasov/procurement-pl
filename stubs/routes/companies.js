const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { verifyToken } = require('../middleware/auth');

// Получить все компании
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', industry = '' } = req.query;
    
    let query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (industry) {
      query.industry = industry;
    }
    
    const skip = (page - 1) * limit;
    
    const companies = await Company.find(query)
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ rating: -1 });
    
    const total = await Company.countDocuments(query);
    
    res.json({
      companies,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить компанию по ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('ownerId', 'firstName lastName email');
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить компанию (требует авторизации)
const updateCompanyHandler = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

router.put('/:id', verifyToken, updateCompanyHandler);
router.patch('/:id', verifyToken, updateCompanyHandler);

// Поиск с AI анализом
router.post('/ai-search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    // Простой поиск по текстовым полям
    const companies = await Company.find({
      $text: { $search: query }
    }).limit(10);
    
    res.json({
      companies,
      total: companies.length,
      aiSuggestion: `Found ${companies.length} companies matching "${query}"`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
