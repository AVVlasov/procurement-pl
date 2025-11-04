const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Review = require('../models/Review');
const Company = require('../models/Company');

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

// Функция для пересчета рейтинга компании
const updateCompanyRating = async (companyId) => {
  try {
    const reviews = await Review.find({ companyId });
    
    if (reviews.length === 0) {
      await Company.findByIdAndUpdate(companyId, {
        rating: 0,
        reviews: 0,
        updatedAt: new Date()
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Company.findByIdAndUpdate(companyId, {
      rating: averageRating,
      reviews: reviews.length,
      updatedAt: new Date()
    });

    log('[Reviews] Updated company rating:', companyId, 'New rating:', averageRating);
  } catch (error) {
    console.error('[Reviews] Error updating company rating:', error.message);
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
        error: 'Заполните все обязательные поля: компания, рейтинг и комментарий',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Рейтинг должен быть от 1 до 5',
      });
    }

    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10) {
      return res.status(400).json({
        error: 'Отзыв должен содержать минимум 10 символов',
      });
    }

    if (trimmedComment.length > 1000) {
      return res.status(400).json({
        error: 'Отзыв не должен превышать 1000 символов',
      });
    }

    // Получить данные пользователя из БД для актуальной информации
    const User = require('../models/User');
    const Company = require('../models/Company');
    
    const user = await User.findById(req.userId);
    const userCompany = user && user.companyId ? await Company.findById(user.companyId) : null;

    if (!user) {
      return res.status(404).json({
        error: 'Пользователь не найден',
      });
    }

    // Создать новый отзыв
    const newReview = new Review({
      companyId,
      authorCompanyId: user.companyId || req.companyId,
      authorName: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : req.user?.firstName && req.user?.lastName
          ? `${req.user.firstName} ${req.user.lastName}`
          : 'Аноним',
      authorCompany: userCompany?.fullName || userCompany?.shortName || req.user?.companyName || 'Компания',
      rating: parseInt(rating),
      comment: trimmedComment,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedReview = await newReview.save();

    log('[Reviews] New review created:', savedReview._id);

    // Пересчитываем рейтинг компании
    await updateCompanyRating(companyId);

    res.status(201).json(savedReview);
  } catch (error) {
    console.error('[Reviews] Error creating review:', error.message);
    res.status(500).json({
      error: 'Ошибка при сохранении отзыва',
      message: error.message,
    });
  }
});

module.exports = router;
