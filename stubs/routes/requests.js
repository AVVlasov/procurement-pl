const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Request = require('../models/Request');

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

// GET /requests/sent - получить отправленные запросы
router.get('/sent', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const requests = await Request.find({ senderCompanyId: companyId })
      .sort({ createdAt: -1 })
      .exec();

    log('[Requests] Returned', requests.length, 'sent requests for company', companyId);

    res.json(requests);
  } catch (error) {
    console.error('[Requests] Error fetching sent requests:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /requests/received - получить полученные запросы
router.get('/received', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const requests = await Request.find({ recipientCompanyId: companyId })
      .sort({ createdAt: -1 })
      .exec();

    log('[Requests] Returned', requests.length, 'received requests for company', companyId);

    res.json(requests);
  } catch (error) {
    console.error('[Requests] Error fetching received requests:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /requests - создать запрос
router.post('/', verifyToken, async (req, res) => {
  try {
    const { text, recipientCompanyIds, productId, files } = req.body;
    const senderCompanyId = req.user.companyId;

    if (!text || !recipientCompanyIds || !Array.isArray(recipientCompanyIds) || recipientCompanyIds.length === 0) {
      return res.status(400).json({ error: 'text and recipientCompanyIds array required' });
    }

    // Отправить запрос каждой компании
    const results = [];
    for (const recipientCompanyId of recipientCompanyIds) {
      try {
        const request = new Request({
          senderCompanyId,
          recipientCompanyId,
          text,
          productId,
          files: files || [],
          status: 'pending'
        });

        await request.save();
        results.push({
          companyId: recipientCompanyId,
          success: true,
          message: 'Request sent successfully'
        });

        log('[Requests] Request sent to company:', recipientCompanyId);
      } catch (err) {
        results.push({
          companyId: recipientCompanyId,
          success: false,
          message: err.message
        });
      }
    }

    // Сохранить отчет
    const report = {
      text,
      result: results,
      createdAt: new Date()
    };

    res.status(201).json({
      id: 'bulk-' + Date.now(),
      ...report,
      files: files || []
    });
  } catch (error) {
    console.error('[Requests] Error creating request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /requests/:id - ответить на запрос
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, status } = req.body;

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Только получатель может ответить на запрос
    if (request.recipientCompanyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    request.response = response;
    request.status = status || 'accepted';
    request.respondedAt = new Date();
    request.updatedAt = new Date();

    await request.save();

    log('[Requests] Request responded:', id);

    res.json(request);
  } catch (error) {
    console.error('[Requests] Error responding to request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /requests/:id - удалить запрос
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Может удалить отправитель или получатель
    if (request.senderCompanyId !== req.user.companyId && request.recipientCompanyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Request.findByIdAndDelete(id);

    log('[Requests] Request deleted:', id);

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('[Requests] Error deleting request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
