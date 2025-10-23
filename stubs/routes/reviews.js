const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// In-memory storage for reviews
let reviews = [];

// Reference to companies from search routes
let companies = [];

// Синхронизация с companies из других routes
const syncCompanies = () => {
  // После создания review обновляем рейтинг компании
};

// GET /reviews/company/:companyId - получить отзывы компании
router.get('/company/:companyId', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.params;

    const companyReviews = reviews
      .filter(r => r.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('[Reviews] Returned', companyReviews.length, 'reviews for company', companyId);

    res.json(companyReviews);
  } catch (error) {
    console.error('[Reviews] Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /reviews - создать новый отзыв
router.post('/', verifyToken, async (req, res) => {
  try {
    const { companyId, rating, comment } = req.body;

    if (!companyId || !rating || !comment) {
      return res.status(400).json({
        error: 'companyId, rating, and comment are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5',
      });
    }

    if (comment.length < 10 || comment.length > 1000) {
      return res.status(400).json({
        error: 'Comment must be between 10 and 1000 characters',
      });
    }

    // Создать новый отзыв
    const newReview = {
      _id: 'review-' + Date.now(),
      companyId,
      authorCompanyId: req.user.companyId,
      authorName: req.user.firstName + ' ' + req.user.lastName,
      authorCompany: req.user.companyName || 'Company',
      rating: parseInt(rating),
      comment: comment.trim(),
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    reviews.push(newReview);

    console.log('[Reviews] New review created:', newReview._id);

    res.status(201).json(newReview);
  } catch (error) {
    console.error('[Reviews] Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
