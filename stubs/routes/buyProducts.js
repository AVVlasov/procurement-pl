const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const BuyProduct = require('../models/BuyProduct');

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

// GET /buy-products/company/:companyId - получить товары компании
router.get('/company/:companyId', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.params;

    log('[BuyProducts] Fetching products for company:', companyId);
    const products = await BuyProduct.find({ companyId })
      .sort({ createdAt: -1 })
      .exec();

    log('[BuyProducts] Found', products.length, 'products for company', companyId);
    log('[BuyProducts] Products:', products);

    res.json(products);
  } catch (error) {
    console.error('[BuyProducts] Error fetching products:', error.message);
    console.error('[BuyProducts] Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /buy-products - создать новый товар
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, quantity, unit, status } = req.body;

    log('[BuyProducts] Creating new product:', { name, description, quantity, companyId: req.user.companyId });

    if (!name || !description || !quantity) {
      return res.status(400).json({
        error: 'name, description, and quantity are required',
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        error: 'Description must be at least 10 characters',
      });
    }

    const newProduct = new BuyProduct({
      companyId: req.user.companyId,
      name: name.trim(),
      description: description.trim(),
      quantity: quantity.trim(),
      unit: unit || 'шт',
      status: status || 'published',
      files: [],
    });

    log('[BuyProducts] Attempting to save product to DB...');
    const savedProduct = await newProduct.save();

    log('[BuyProducts] New product created successfully:', savedProduct._id);
    log('[BuyProducts] Product data:', savedProduct);

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('[BuyProducts] Error creating product:', error.message);
    console.error('[BuyProducts] Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// PUT /buy-products/:id - обновить товар
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, unit, status } = req.body;

    const product = await BuyProduct.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Проверить, что товар принадлежит текущей компании
    if (product.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Обновить поля
    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (quantity) product.quantity = quantity.trim();
    if (unit) product.unit = unit;
    if (status) product.status = status;
    product.updatedAt = new Date();

    const updatedProduct = await product.save();

    log('[BuyProducts] Product updated:', id);

    res.json(updatedProduct);
  } catch (error) {
    console.error('[BuyProducts] Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /buy-products/:id - удалить товар
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await BuyProduct.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await BuyProduct.findByIdAndDelete(id);

    log('[BuyProducts] Product deleted:', id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('[BuyProducts] Error:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /buy-products/:id/files - добавить файл к товару
router.post('/:id/files', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, fileUrl, fileType, fileSize } = req.body;

    const product = await BuyProduct.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Только владелец товара может добавить файл
    if (product.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const file = {
      id: 'file-' + Date.now(),
      name: fileName,
      url: fileUrl,
      type: fileType,
      size: fileSize,
      uploadedAt: new Date()
    };

    product.files.push(file);
    await product.save();

    log('[BuyProducts] File added to product:', id);

    res.json(product);
  } catch (error) {
    console.error('[BuyProducts] Error adding file:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// DELETE /buy-products/:id/files/:fileId - удалить файл
router.delete('/:id/files/:fileId', verifyToken, async (req, res) => {
  try {
    const { id, fileId } = req.params;

    const product = await BuyProduct.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.companyId.toString() !== req.user.companyId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    product.files = product.files.filter(f => f.id !== fileId);
    await product.save();

    log('[BuyProducts] File deleted from product:', id);

    res.json(product);
  } catch (error) {
    console.error('[BuyProducts] Error deleting file:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// POST /buy-products/:id/accept - акцептировать товар
router.post('/:id/accept', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const product = await BuyProduct.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Не можем акцептировать собственный товар
    if (product.companyId.toString() === companyId.toString()) {
      return res.status(403).json({ error: 'Cannot accept own product' });
    }

    // Проверить, не акцептировал ли уже
    const alreadyAccepted = product.acceptedBy.some(
      a => a.companyId.toString() === companyId.toString()
    );

    if (alreadyAccepted) {
      return res.status(400).json({ error: 'Already accepted' });
    }

    product.acceptedBy.push({
      companyId,
      acceptedAt: new Date()
    });

    await product.save();

    log('[BuyProducts] Product accepted by company:', companyId);

    res.json(product);
  } catch (error) {
    console.error('[BuyProducts] Error accepting product:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

// GET /buy-products/:id/acceptances - получить компании которые акцептовали
router.get('/:id/acceptances', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await BuyProduct.findById(id).populate('acceptedBy.companyId', 'shortName fullName');

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    log('[BuyProducts] Returned acceptances for product:', id);

    res.json(product.acceptedBy);
  } catch (error) {
    console.error('[BuyProducts] Error fetching acceptances:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
