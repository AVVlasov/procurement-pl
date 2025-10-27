const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Product = require('../models/Product');

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

// Helper to transform _id to id
const transformProduct = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    ...obj,
    id: obj._id,
    _id: undefined
  };
};

// GET /products - Получить список продуктов/услуг компании (текущего пользователя)
router.get('/', verifyToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    log('[Products] GET Fetching products for companyId:', companyId);
    
    const products = await Product.find({ companyId })
      .sort({ createdAt: -1 })
      .exec();

    log('[Products] Found', products.length, 'products');
    res.json(products.map(transformProduct));
  } catch (error) {
    console.error('[Products] Get error:', error.message);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /products - Создать продукт/услугу
router.post('/', verifyToken, async (req, res) => {
  // try {
    const { name, category, description, type, productUrl, price, unit, minOrder } = req.body;
    const companyId = req.user.companyId;

    log('[Products] POST Creating product:', { name, category, type });

    // // Валидация
    // if (!name || !category || !description || !type) {
    //   return res.status(400).json({ error: 'name, category, description, and type are required' });
    // }

    // if (description.length < 20) {
    //   return res.status(400).json({ error: 'Description must be at least 20 characters' });
    // }

    const newProduct = new Product({
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      type,
      productUrl: productUrl || '',
      companyId,
      price: price || '',
      unit: unit || '',
      minOrder: minOrder || ''
    });

    const savedProduct = await newProduct.save();
    log('[Products] Product created with ID:', savedProduct._id);

    res.status(201).json(transformProduct(savedProduct));
  // } catch (error) {
  //   console.error('[Products] Create error:', error.message);
  //   res.status(500).json({ error: 'Internal server error', message: error.message });
  // }
});

// PUT /products/:id - Обновить продукт/услугу
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const companyId = req.user.companyId;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Проверить, что продукт принадлежит текущей компании
    if (product.companyId !== companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    log('[Products] Product updated:', id);
    res.json(transformProduct(updatedProduct));
  } catch (error) {
    console.error('[Products] Update error:', error.message);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// PATCH /products/:id - Частичное обновление продукта/услуги
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const companyId = req.user.companyId;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.companyId !== companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    log('[Products] Product patched:', id);
    res.json(transformProduct(updatedProduct));
  } catch (error) {
    console.error('[Products] Patch error:', error.message);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// DELETE /products/:id - Удалить продукт/услугу
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.companyId !== companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Product.findByIdAndDelete(id);

    log('[Products] Product deleted:', id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('[Products] Delete error:', error.message);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
