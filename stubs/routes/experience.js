const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// In-memory хранилище для опыта работы (mock)
let experiences = [];

// GET /experience - Получить список опыта работы компании
router.get('/', verifyToken, (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const companyExperiences = experiences.filter(exp => exp.companyId === companyId);
    res.json(companyExperiences);
  } catch (error) {
    console.error('Get experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /experience - Создать запись опыта работы
router.post('/', verifyToken, (req, res) => {
  try {
    const { companyId, data } = req.body;

    if (!companyId || !data) {
      return res.status(400).json({ error: 'companyId and data are required' });
    }

    const { confirmed, customer, subject, volume, contact, comment } = data;

    if (!customer || !subject) {
      return res.status(400).json({ error: 'customer and subject are required' });
    }

    const newExperience = {
      id: `exp-${Date.now()}`,
      companyId,
      confirmed: confirmed || false,
      customer,
      subject,
      volume: volume || '',
      contact: contact || '',
      comment: comment || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    experiences.push(newExperience);

    res.status(201).json(newExperience);
  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /experience/:id - Обновить запись опыта работы
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }

    const index = experiences.findIndex(exp => exp.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    const updatedExperience = {
      ...experiences[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    experiences[index] = updatedExperience;

    res.json(updatedExperience);
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /experience/:id - Удалить запись опыта работы
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const index = experiences.findIndex(exp => exp.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    experiences.splice(index, 1);

    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

