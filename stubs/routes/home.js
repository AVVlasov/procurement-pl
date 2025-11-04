const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const BuyProduct = require('../models/BuyProduct');
const Request = require('../models/Request');

// Получить агрегированные данные для главной страницы
router.get('/aggregates', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user || !user.companyId) {
      return res.json({
        docsCount: 0,
        acceptsCount: 0,
        requestsCount: 0
      });
    }

    const companyId = user.companyId.toString();

    // Получить все BuyProduct для подсчета файлов и акцептов
    const buyProducts = await BuyProduct.find({ companyId });

    // Подсчет документов - сумма всех файлов во всех BuyProduct
    const docsCount = buyProducts.reduce((total, product) => {
      return total + (product.files ? product.files.length : 0);
    }, 0);

    // Подсчет акцептов - сумма всех acceptedBy во всех BuyProduct
    const acceptsCount = buyProducts.reduce((total, product) => {
      return total + (product.acceptedBy ? product.acceptedBy.length : 0);
    }, 0);

    // Подсчет исходящих запросов (только отправленные этой компанией)
    const requestsCount = await Request.countDocuments({
      senderCompanyId: companyId
    });

    res.json({
      docsCount,
      acceptsCount,
      requestsCount
    });
  } catch (error) {
    console.error('Error getting aggregates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить статистику компании
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const User = require('../models/User');
    const Company = require('../models/Company');
    const user = await User.findById(userId);

    if (!user || !user.companyId) {
      return res.json({
        profileViews: 0,
        profileViewsChange: 0,
        sentRequests: 0,
        sentRequestsChange: 0,
        receivedRequests: 0,
        receivedRequestsChange: 0,
        newMessages: 0,
        rating: 0
      });
    }

    const companyId = user.companyId.toString();
    const company = await Company.findById(user.companyId);

    const sentRequests = await Request.countDocuments({ senderCompanyId: companyId });
    const receivedRequests = await Request.countDocuments({ recipientCompanyId: companyId });

    res.json({
      profileViews: company?.metrics?.profileViews || 0,
      profileViewsChange: 0,
      sentRequests,
      sentRequestsChange: 0,
      receivedRequests,
      receivedRequestsChange: 0,
      newMessages: 0,
      rating: company?.rating || 0
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получить рекомендации партнеров (AI)
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const User = require('../models/User');
    const Company = require('../models/Company');
    const user = await User.findById(userId);

    if (!user || !user.companyId) {
      return res.json({
        recommendations: [],
        message: 'No recommendations available'
      });
    }

    // Получить компании кроме текущей
    const companies = await Company.find({
      _id: { $ne: user.companyId }
    })
      .sort({ rating: -1 })
      .limit(5);

    const recommendations = companies.map(company => ({
      id: company._id.toString(),
      name: company.fullName || company.shortName,
      industry: company.industry,
      logo: company.logo,
      matchScore: company.rating ? Math.min(100, Math.round(company.rating * 20)) : 50,
      reason: 'Matches your industry'
    }));

    res.json({
      recommendations,
      message: recommendations.length > 0 ? 'Recommendations available' : 'No recommendations available'
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
