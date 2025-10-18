const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// In-memory хранилище для продуктов/услуг (mock)
let products = [];

// GET /products - Получить список продуктов/услуг компании
router.get('/', verifyToken, (req, res) => {
  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    const companyProducts = products.filter(p => p.companyId === companyId);
    res.json(companyProducts);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /products - Создать продукт/услугу
router.post('/', verifyToken, (req, res) => {
  try {
    const { companyId, name, category, description, price, unit } = req.body;

    if (!companyId || !name) {
      return res.status(400).json({ error: 'companyId and name are required' });
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      companyId,
      name,
      category: category || 'other',
      description: description || '',
      price: price || '',
      unit: unit || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /products/:id - Обновить продукт/услугу
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /products/:id - Частичное обновление продукта/услуги
router.patch('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    products[index] = updatedProduct;

    res.json(updatedProduct);
  } catch (error) {
    console.error('Patch product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /products/:id - Удалить продукт/услугу
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products.splice(index, 1);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

