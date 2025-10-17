const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { verifyToken } = require('../middleware/auth');

// Получить все потоки для компании
router.get('/threads', verifyToken, async (req, res) => {
  try {
    // Получить уникальные потоки где компания является отправителем или получателем
    const threads = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderCompanyId: req.user.companyId },
            { recipientCompanyId: req.user.companyId }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$threadId',
          lastMessage: { $first: '$text' },
          lastMessageAt: { $first: '$timestamp' }
        }
      }
    ]);

    res.json(threads || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить сообщения потока
router.get('/threads/:threadId', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ threadId: req.params.threadId })
      .sort({ timestamp: 1 })
      .populate('senderCompanyId', 'shortName fullName')
      .populate('recipientCompanyId', 'shortName fullName');

    res.json(messages || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Отправить сообщение
router.post('/', verifyToken, async (req, res) => {
  try {
    const { threadId, text, recipientCompanyId } = req.body;

    if (!text || !threadId) {
      return res.status(400).json({ error: 'Text and threadId required' });
    }

    const message = await Message.create({
      threadId,
      senderCompanyId: req.user.companyId,
      recipientCompanyId,
      text,
      timestamp: new Date()
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
