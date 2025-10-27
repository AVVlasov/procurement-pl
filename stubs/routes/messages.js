const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Message = require('../models/Message');

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

// GET /messages/threads - получить все потоки для компании
router.get('/threads', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { ObjectId } = require('mongoose').Types;

    log('[Messages] Fetching threads for companyId:', companyId, 'type:', typeof companyId);

    // Преобразовать в ObjectId если это строка
    let companyObjectId = companyId;
    let companyIdString = companyId.toString ? companyId.toString() : companyId;
    
    try {
      if (typeof companyId === 'string' && ObjectId.isValid(companyId)) {
        companyObjectId = new ObjectId(companyId);
      }
    } catch (e) {
      log('[Messages] Could not convert to ObjectId:', e.message);
    }

    log('[Messages] Using companyObjectId:', companyObjectId, 'companyIdString:', companyIdString);

    // Получить все сообщения где текущая компания отправитель или получатель
    // Поддерживаем оба формата - ObjectId и строки
    const allMessages = await Message.find({
      $or: [
        { senderCompanyId: companyObjectId },
        { senderCompanyId: companyIdString },
        { recipientCompanyId: companyObjectId },
        { recipientCompanyId: companyIdString },
        // Также ищем по threadId который может содержать ID компании
        { threadId: { $regex: companyIdString } }
      ]
    })
      .sort({ timestamp: -1 })
      .limit(500);

    log('[Messages] Found', allMessages.length, 'messages for company');

    if (allMessages.length === 0) {
      log('[Messages] No messages found');
      res.json([]);
      return;
    }

    // Группируем по потокам и берем последнее сообщение каждого потока
    const threadsMap = new Map();
    allMessages.forEach(msg => {
      const threadId = msg.threadId;
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, {
          threadId,
          lastMessage: msg.text,
          lastMessageAt: msg.timestamp,
          senderCompanyId: msg.senderCompanyId,
          recipientCompanyId: msg.recipientCompanyId
        });
      }
    });

    const threads = Array.from(threadsMap.values()).sort((a, b) =>
      new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );

    log('[Messages] Returned', threads.length, 'unique threads');

    res.json(threads);
  } catch (error) {
    console.error('[Messages] Error fetching threads:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// GET /messages/:threadId - получить сообщения потока
router.get('/:threadId', verifyToken, async (req, res) => {
  try {
    const { threadId } = req.params;
    const companyId = req.user.companyId;

    // Получить все сообщения потока
    const threadMessages = await Message.find({ threadId })
      .sort({ timestamp: 1 })
      .exec();

    // Отметить сообщения как прочитанные для текущей компании
    await Message.updateMany(
      { threadId, recipientCompanyId: companyId, read: false },
      { read: true }
    );

    log('[Messages] Returned', threadMessages.length, 'messages for thread', threadId);

    res.json(threadMessages);
  } catch (error) {
    console.error('[Messages] Error fetching messages:', error.message);
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
    // threadId формат: "thread-id1-id2"
    const threadParts = threadId.replace('thread-', '').split('-');
    let recipientCompanyId = null;

    const currentSender = senderCompanyId || req.user.companyId;
    const currentSenderString = currentSender.toString ? currentSender.toString() : currentSender;

    if (threadParts.length >= 2) {
      const companyId1 = threadParts[0];
      const companyId2 = threadParts[1];
      // Получатель - это другая сторона
      recipientCompanyId = currentSenderString === companyId1 ? companyId2 : companyId1;
    }

    log('[Messages] POST /messages/:threadId');
    log('[Messages] threadId:', threadId);
    log('[Messages] Sender:', currentSender);
    log('[Messages] SenderString:', currentSenderString);
    log('[Messages] Recipient:', recipientCompanyId);

    // Найти recipientCompanyId по ObjectId если нужно
    let recipientObjectId = recipientCompanyId;
    const { ObjectId } = require('mongoose').Types;
    try {
      if (typeof recipientCompanyId === 'string' && ObjectId.isValid(recipientCompanyId)) {
        recipientObjectId = new ObjectId(recipientCompanyId);
      }
    } catch (e) {
      log('[Messages] Could not convert recipientId to ObjectId');
    }

    const message = new Message({
      threadId,
      senderCompanyId: currentSender,
      recipientCompanyId: recipientObjectId,
      text: text.trim(),
      read: false,
      timestamp: new Date()
    });

    const savedMessage = await message.save();

    log('[Messages] New message created:', savedMessage._id);
    log('[Messages] Message data:', {
      threadId: savedMessage.threadId,
      senderCompanyId: savedMessage.senderCompanyId,
      recipientCompanyId: savedMessage.recipientCompanyId
    });

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('[Messages] Error creating message:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// MIGRATION ENDPOINT - Fix recipientCompanyId for all messages
router.post('/admin/migrate-fix-recipients', async (req, res) => {
  try {
    const allMessages = await Message.find().exec();
    log('[Messages] Migrating', allMessages.length, 'messages...');

    let fixedCount = 0;
    let errorCount = 0;

    for (const message of allMessages) {
      try {
        const threadId = message.threadId;
        if (!threadId) continue;

        // Parse threadId формат "thread-id1-id2" или "id1-id2"
        const ids = threadId.replace('thread-', '').split('-');
        if (ids.length < 2) {
          errorCount++;
          continue;
        }

        const companyId1 = ids[0];
        const companyId2 = ids[1];

        // Compare with senderCompanyId
        const senderIdString = message.senderCompanyId.toString ? message.senderCompanyId.toString() : message.senderCompanyId;
        const expectedRecipient = senderIdString === companyId1 ? companyId2 : companyId1;

        // If recipientCompanyId is not set or wrong - fix it
        if (!message.recipientCompanyId || message.recipientCompanyId.toString() !== expectedRecipient) {
          const { ObjectId } = require('mongoose').Types;
          let recipientObjectId = expectedRecipient;
          try {
            if (typeof expectedRecipient === 'string' && ObjectId.isValid(expectedRecipient)) {
              recipientObjectId = new ObjectId(expectedRecipient);
            }
          } catch (e) {
            // continue
          }

          await Message.updateOne(
            { _id: message._id },
            { recipientCompanyId: recipientObjectId }
          );

          fixedCount++;
        }
      } catch (err) {
        console.error('[Messages] Migration error:', err.message);
        errorCount++;
      }
    }

    log('[Messages] Migration completed! Fixed:', fixedCount, 'Errors:', errorCount);
    res.json({ success: true, fixed: fixedCount, errors: errorCount, total: allMessages.length });
  } catch (error) {
    console.error('[Messages] Migration error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG ENDPOINT
router.get('/debug/all-messages', async (req, res) => {
  try {
    const allMessages = await Message.find().limit(10).exec();
    log('[Debug] Total messages in DB:', allMessages.length);
    
    const info = allMessages.map(m => ({
      _id: m._id,
      threadId: m.threadId,
      senderCompanyId: m.senderCompanyId?.toString ? m.senderCompanyId.toString() : m.senderCompanyId,
      recipientCompanyId: m.recipientCompanyId?.toString ? m.recipientCompanyId.toString() : m.recipientCompanyId,
      text: m.text.substring(0, 30)
    }));
    
    res.json({ totalCount: allMessages.length, messages: info });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
