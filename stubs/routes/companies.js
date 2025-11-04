const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Company = require('../models/Company');
const Experience = require('../models/Experience');
const Request = require('../models/Request');
const Message = require('../models/Message');
const { Types } = require('mongoose');

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
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let companyId = user.companyId;

    if (!companyId) {
      const fallbackCompany = await Company.create({
        fullName: 'Компания пользователя',
        shortName: 'Компания пользователя',
        verified: false,
        partnerGeography: [],
      });

      user.companyId = fallbackCompany._id;
      user.updatedAt = new Date();
      await user.save();
      companyId = fallbackCompany._id;
    }

    let company = await Company.findById(companyId);

    if (!company) {
      company = await Company.create({
        _id: companyId,
        fullName: 'Компания пользователя',
        verified: false,
        partnerGeography: [],
      });
    }

    const companyIdString = company._id.toString();
    const companyObjectId = Types.ObjectId.isValid(companyIdString)
      ? new Types.ObjectId(companyIdString)
      : null;

    const [sentRequests, receivedRequests, unreadMessages] = await Promise.all([
      Request.countDocuments({ senderCompanyId: companyIdString }),
      Request.countDocuments({ recipientCompanyId: companyIdString }),
      companyObjectId
        ? Message.countDocuments({ recipientCompanyId: companyObjectId, read: false })
        : Promise.resolve(0),
    ]);

    // Подсчитываем просмотры профиля из запросов к профилю компании
    const profileViews = company?.metrics?.profileViews || 0;
    
    // Получаем статистику за последнюю неделю для изменений
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const sentRequestsLastWeek = await Request.countDocuments({
      senderCompanyId: companyIdString,
      createdAt: { $gte: weekAgo }
    });
    
    const receivedRequestsLastWeek = await Request.countDocuments({
      recipientCompanyId: companyIdString,
      createdAt: { $gte: weekAgo }
    });

    const stats = {
      profileViews: profileViews,
      profileViewsChange: 0, // Можно добавить отслеживание просмотров, если нужно
      sentRequests,
      sentRequestsChange: sentRequestsLastWeek,
      receivedRequests,
      receivedRequestsChange: receivedRequestsLastWeek,
      newMessages: unreadMessages,
      rating: Number.isFinite(company?.rating) ? Number(company.rating) : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /:id/experience - получить опыт компании
router.get('/:id/experience', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    const experience = await Experience.find({ companyId: new Types.ObjectId(id) })
      .sort({ createdAt: -1 });
    
    res.json(experience.map(exp => ({
      ...exp.toObject(),
      id: exp._id
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/experience - добавить опыт компании
router.post('/:id/experience', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed, customer, subject, volume, contact, comment } = req.body;
    
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    const newExp = await Experience.create({
      companyId: new Types.ObjectId(id),
      confirmed: confirmed || false,
      customer: customer || '',
      subject: subject || '',
      volume: volume || '',
      contact: contact || '',
      comment: comment || ''
    });
    
    res.status(201).json({
      ...newExp.toObject(),
      id: newExp._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id/experience/:expId - обновить опыт
router.put('/:id/experience/:expId', verifyToken, async (req, res) => {
  try {
    const { id, expId } = req.params;
    
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(expId)) {
      return res.status(400).json({ error: 'Invalid IDs' });
    }

    const experience = await Experience.findByIdAndUpdate(
      new Types.ObjectId(expId),
      {
        ...req.body,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!experience || experience.companyId.toString() !== id) {
      return res.status(404).json({ error: 'Experience not found' });
    }
    
    res.json({
      ...experience.toObject(),
      id: experience._id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id/experience/:expId - удалить опыт
router.delete('/:id/experience/:expId', verifyToken, async (req, res) => {
  try {
    const { id, expId } = req.params;
    
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(expId)) {
      return res.status(400).json({ error: 'Invalid IDs' });
    }

    const experience = await Experience.findById(new Types.ObjectId(expId));
    
    if (!experience || experience.companyId.toString() !== id) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    await Experience.findByIdAndDelete(new Types.ObjectId(expId));
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
      if (!Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const placeholder = await Company.create({
        _id: new Types.ObjectId(req.params.id),
        fullName: 'Новая компания',
        shortName: 'Новая компания',
        verified: false,
        partnerGeography: [],
        industry: '',
        companySize: '',
      });

      return res.json({
        ...placeholder.toObject(),
        id: placeholder._id,
      });
    }
    
    // Отслеживаем просмотр профиля (если это не владелец компании)
    const userId = req.userId;
    if (userId) {
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user && user.companyId && user.companyId.toString() !== company._id.toString()) {
        // Инкрементируем просмотры профиля
        if (!company.metrics) {
          company.metrics = {};
        }
        if (!company.metrics.profileViews) {
          company.metrics.profileViews = 0;
        }
        company.metrics.profileViews = (company.metrics.profileViews || 0) + 1;
        await company.save();
      }
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
