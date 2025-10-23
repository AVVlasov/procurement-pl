const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// In-memory storage
let messages = [];

// GET /messages/threads - получить все потоки для компании
router.get('/threads', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Группировка сообщений по threadId
    const threads = {};
    
    messages.forEach(msg => {
      if (msg.senderCompanyId === companyId || msg.recipientCompanyId === companyId) {
        if (!threads[msg.threadId]) {
          threads[msg.threadId] = msg;
        }
      }
    });

    // Преобразование в массив и сортировка по времени
    const threadsArray = Object.values(threads)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log('[Messages] Returned', threadsArray.length, 'threads for company', companyId);

    res.json(threadsArray);
  } catch (error) {
    console.error('[Messages] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /messages/:threadId - получить сообщения потока
router.get('/:threadId', verifyToken, async (req, res) => {
  try {
    const { threadId } = req.params;

    const threadMessages = messages
      .filter(msg => msg.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log('[Messages] Returned', threadMessages.length, 'messages for thread', threadId);

    res.json(threadMessages);
  } catch (error) {
    console.error('[Messages] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /messages/:threadId - добавить сообщение в поток
router.post('/:threadId', verifyToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { text, senderCompanyId } = req.body;

    if (!text || !threadId) {
      return res.status(400).json({ error: 'Text and threadId required' });
    }

    // Определить получателя на основе threadId
    const threadParts = threadId.split('-');
    let recipientCompanyId = null;

    if (threadParts.length >= 3) {
      const companyId1 = threadParts[1];
      const companyId2 = threadParts[2];
      const currentSender = senderCompanyId || req.user.companyId;
      recipientCompanyId = currentSender === companyId1 ? companyId2 : companyId1;
    }

    const message = {
      _id: 'msg-' + Date.now(),
      threadId,
      senderCompanyId: senderCompanyId || req.user.companyId,
      recipientCompanyId,
      text: text.trim(),
      timestamp: new Date()
    };

    messages.push(message);

    console.log('[Messages] New message created:', message._id);

    res.status(201).json(message);
  } catch (error) {
    console.error('[Messages] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /messages - создать сообщение (старый endpoint для совместимости)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { threadId, text, recipientCompanyId } = req.body;

    if (!text || !threadId) {
      return res.status(400).json({ error: 'Text and threadId required' });
    }

    const message = {
      _id: 'msg-' + Date.now(),
      threadId,
      senderCompanyId: req.user.companyId,
      recipientCompanyId,
      text: text.trim(),
      timestamp: new Date()
    };

    messages.push(message);

    console.log('[Messages] New message created:', message._id);

    res.status(201).json(message);
  } catch (error) {
    console.error('[Messages] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
