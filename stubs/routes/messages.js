const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { verifyToken } = require('../middleware/auth');

// Mock данные для тредов
const mockThreads = [
  {
    id: 'thread-1',
    lastMessage: 'Добрый день! Интересует поставка металлопроката.',
    lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
    participants: ['company-123', 'company-1']
  },
  {
    id: 'thread-2',
    lastMessage: 'Можем предложить скидку 15% на оптовую партию.',
    lastMessageAt: new Date(Date.now() - 7200000).toISOString(),
    participants: ['company-123', 'company-2']
  },
  {
    id: 'thread-3',
    lastMessage: 'Спасибо за предложение, рассмотрим.',
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
    participants: ['company-123', 'company-4']
  }
];

// Mock данные для сообщений
const mockMessages = {
  'thread-1': [
    { id: 'msg-1', senderCompanyId: 'company-1', text: 'Добрый день! Интересует поставка металлопроката.', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'msg-2', senderCompanyId: 'company-123', text: 'Здравствуйте! Какой объем вас интересует?', timestamp: new Date(Date.now() - 3500000).toISOString() }
  ],
  'thread-2': [
    { id: 'msg-3', senderCompanyId: 'company-2', text: 'Можем предложить скидку 15% на оптовую партию.', timestamp: new Date(Date.now() - 7200000).toISOString() }
  ],
  'thread-3': [
    { id: 'msg-4', senderCompanyId: 'company-4', text: 'Спасибо за предложение, рассмотрим.', timestamp: new Date(Date.now() - 86400000).toISOString() }
  ]
};

// Получить все потоки для компании
router.get('/threads', verifyToken, async (req, res) => {
  try {
    // Попытка получить из MongoDB
    try {
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

      if (threads && threads.length > 0) {
        return res.json(threads);
      }
    } catch (dbError) {
      console.log('MongoDB unavailable, using mock data');
    }

    // Fallback на mock данные
    res.json(mockThreads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить сообщения потока
router.get('/threads/:threadId', verifyToken, async (req, res) => {
  try {
    // Попытка получить из MongoDB
    try {
      const messages = await Message.find({ threadId: req.params.threadId })
        .sort({ timestamp: 1 })
        .populate('senderCompanyId', 'shortName fullName')
        .populate('recipientCompanyId', 'shortName fullName');

      if (messages && messages.length > 0) {
        return res.json(messages);
      }
    } catch (dbError) {
      console.log('MongoDB unavailable, using mock data');
    }

    // Fallback на mock данные
    const threadMessages = mockMessages[req.params.threadId] || [];
    res.json(threadMessages);
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
