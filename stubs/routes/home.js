const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Получить агрегированные данные для главной страницы
router.get('/aggregates', verifyToken, async (req, res) => {
  try {
    res.json({
      docsCount: 0,
      acceptsCount: 0,
      requestsCount: 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить статистику компании
router.get('/stats', verifyToken, async (req, res) => {
  try {
    res.json({
      profileViews: 12,
      profileViewsChange: 5,
      sentRequests: 3,
      sentRequestsChange: 1,
      receivedRequests: 7,
      receivedRequestsChange: 2,
      newMessages: 4,
      rating: 4.5
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить рекомендации партнеров (AI)
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    res.json({
      recommendations: [],
      message: 'No recommendations available yet'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
