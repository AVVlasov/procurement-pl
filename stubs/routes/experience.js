const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Experience = require('../models/Experience');
const { Types } = require('mongoose');

// GET /experience - Получить список опыта работы компании
router.get('/', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    if (!Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    const companyExperiences = await Experience.find({ 
      companyId: new Types.ObjectId(companyId) 
    }).sort({ createdAt: -1 });

    res.json(companyExperiences.map(exp => ({
      ...exp.toObject(),
      id: exp._id
    })));
  } catch (error) {
    console.error('Get experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /experience - Создать запись опыта работы
router.post('/', verifyToken, async (req, res) => {
  try {
    const { companyId, data } = req.body;

    if (!companyId || !data) {
      return res.status(400).json({ error: 'companyId and data are required' });
    }

    if (!Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    const { confirmed, customer, subject, volume, contact, comment } = data;

    if (!customer || !subject) {
      return res.status(400).json({ error: 'customer and subject are required' });
    }

    const newExperience = await Experience.create({
      companyId: new Types.ObjectId(companyId),
      confirmed: confirmed || false,
      customer,
      subject,
      volume: volume || '',
      contact: contact || '',
      comment: comment || ''
    });

    res.status(201).json({
      ...newExperience.toObject(),
      id: newExperience._id
    });
  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /experience/:id - Обновить запись опыта работы
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid experience ID' });
    }

    const updatedExperience = await Experience.findByIdAndUpdate(
      new Types.ObjectId(id),
      {
        ...data,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedExperience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    res.json({
      ...updatedExperience.toObject(),
      id: updatedExperience._id
    });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /experience/:id - Удалить запись опыта работы
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid experience ID' });
    }

    const deletedExperience = await Experience.findByIdAndDelete(new Types.ObjectId(id));

    if (!deletedExperience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    res.json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

