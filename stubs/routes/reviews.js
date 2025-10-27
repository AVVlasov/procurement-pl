const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Review = require('../models/Review');

// Функция для логирования с проверкой DEV переменной
const log = (message, data = '') => {
  if (process.env.DEV === 'true') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// GET /reviews/company/:companyId - получить отзывы компании
router.get('/company/:companyId', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.params;

    const companyReviews = await Review.find({ companyId })
      .sort({ createdAt: -1 })
      .exec();

    log('[Reviews] Returned', companyReviews.length, 'reviews for company', companyId);

    res.json(companyReviews);
  } catch (error) {
    console.error('[Reviews] Error fetching reviews:', error.message);
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

    if (comment.trim().length < 10 || comment.trim().length > 1000) {
      return res.status(400).json({
        error: 'Comment must be between 10 and 1000 characters',
      });
    }

    // Создать новый отзыв
    const newReview = new Review({
      companyId,
      authorCompanyId: req.user.companyId,
      authorName: req.user.firstName + ' ' + req.user.lastName,
      authorCompany: req.user.companyName || 'Company',
      rating: parseInt(rating),
      comment: comment.trim(),
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedReview = await newReview.save();

    log('[Reviews] New review created:', savedReview._id);

    res.status(201).json(savedReview);
  } catch (error) {
    console.error('[Reviews] Error creating review:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
