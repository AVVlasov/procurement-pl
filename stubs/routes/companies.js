const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Company = require('../models/Company');

// Инициализация данных при запуске
const initializeCompanies = async () => {
  try {
    // Уже не нужна инициализация, она производится через authAPI
  } catch (error) {
    console.error('Error initializing companies:', error);
  }
};

initializeCompanies();

// GET /my/info - получить мою компанию (требует авторизации) - ДОЛЖНО быть ПЕРЕД /:id
router.get('/my/info', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await require('../models/User').findById(userId);
    
    if (!user || !user.companyId) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = await Company.findById(user.companyId);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({
      ...company.toObject(),
      id: company._id
    });
  } catch (error) {
    console.error('Get my company error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /my/stats - получить статистику компании - ДОЛЖНО быть ПЕРЕД /:id
router.get('/my/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await require('../models/User').findById(userId);
    
    if (!user || !user.companyId) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const stats = {
      profileViews: Math.floor(Math.random() * 1000),
      profileViewsChange: Math.floor(Math.random() * 20 - 10),
      sentRequests: Math.floor(Math.random() * 50),
      sentRequestsChange: Math.floor(Math.random() * 10 - 5),
      receivedRequests: Math.floor(Math.random() * 30),
      receivedRequestsChange: Math.floor(Math.random() * 5 - 2),
      newMessages: Math.floor(Math.random() * 10),
      rating: Math.random() * 5
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Experience endpoints ДОЛЖНЫ быть ДО получения компании по ID
let companyExperience = [];

// GET /:id/experience - получить опыт компании
router.get('/:id/experience', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const experience = companyExperience.filter(e => e.companyId === id);
    res.json(experience);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/experience - добавить опыт компании
router.post('/:id/experience', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed, customer, subject, volume, contact, comment } = req.body;
    
    const expId = Math.random().toString(36).substr(2, 9);
    const newExp = {
      id: expId,
      _id: expId,
      companyId: id,
      confirmed: confirmed || false,
      customer: customer || '',
      subject: subject || '',
      volume: volume || '',
      contact: contact || '',
      comment: comment || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    companyExperience.push(newExp);
    res.status(201).json(newExp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id/experience/:expId - обновить опыт
router.put('/:id/experience/:expId', verifyToken, async (req, res) => {
  try {
    const { id, expId } = req.params;
    const index = companyExperience.findIndex(e => (e.id === expId || e._id === expId) && e.companyId === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    companyExperience[index] = {
      ...companyExperience[index],
      ...req.body,
      updatedAt: new Date()
    };
    
    res.json(companyExperience[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id/experience/:expId - удалить опыт
router.delete('/:id/experience/:expId', verifyToken, async (req, res) => {
  try {
    const { id, expId } = req.params;
    const index = companyExperience.findIndex(e => (e.id === expId || e._id === expId) && e.companyId === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    companyExperience.splice(index, 1);
    res.json({ message: 'Experience deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить компанию по ID (ДОЛЖНО быть ПОСЛЕ специфичных маршрутов)
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({
      ...company.toObject(),
      id: company._id
    });
  } catch (error) {
    console.error('Get company error:', error);
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
    
    res.json({
      ...company.toObject(),
      id: company._id
    });
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
    
    const q = query.toLowerCase();
    const result = await Company.find({
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { shortName: { $regex: q, $options: 'i' } },
        { industry: { $regex: q, $options: 'i' } }
      ]
    });
    
    res.json({
      companies: result.map(c => ({
        ...c.toObject(),
        id: c._id
      })),
      total: result.length,
      aiSuggestion: `Found ${result.length} companies matching "${query}"`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
