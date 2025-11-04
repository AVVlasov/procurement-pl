const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Activity = require('../models/Activity');
const User = require('../models/User');

// Получить последние активности компании
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || !user.companyId) {
      return res.json({ activities: [] });
    }

    const companyId = user.companyId.toString();
    const limit = parseInt(req.query.limit) || 10;

    const activities = await Activity.find({ companyId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ activities });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Отметить активность как прочитанную
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || !user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const companyId = user.companyId.toString();
    const activityId = req.params.id;

    const activity = await Activity.findOne({
      _id: activityId,
      companyId
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    activity.read = true;
    await activity.save();

    res.json({ success: true, activity });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Отметить все активности как прочитанные
router.post('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user || !user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const companyId = user.companyId.toString();

    await Activity.updateMany(
      { companyId, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Создать активность (вспомогательная функция)
router.createActivity = async (data) => {
  try {
    const activity = new Activity(data);
    await activity.save();
    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

module.exports = router;

