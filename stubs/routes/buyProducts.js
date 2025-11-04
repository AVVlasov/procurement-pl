const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const BuyProduct = require('../models/BuyProduct');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'remote-assets', 'uploads', 'buy-products');
const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirectory(UPLOADS_ROOT);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productId = req.params.id || 'common';
    const productDir = path.join(UPLOADS_ROOT, productId);
    ensureDirectory(productDir);
    cb(null, productDir);
  },
  filename: (req, file, cb) => {
    // Исправляем кодировку имени файла из Latin1 в UTF-8
    const fixedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const originalExtension = path.extname(fixedName) || '';
    const baseName = path
      .basename(fixedName, originalExtension)
      .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_'); // Убираем только недопустимые символы Windows, оставляем кириллицу
    cb(null, `${Date.now()}_${baseName}${originalExtension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    req.fileValidationError = 'UNSUPPORTED_FILE_TYPE';
    cb(null, false);
  },
});

const handleSingleFileUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('[BuyProducts] Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size is 15MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};


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

    log('[BuyProducts] Creating new product:', { name, description, quantity, companyId: req.companyId });

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
      companyId: req.companyId,
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
    if (product.companyId !== req.companyId) {
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

    if (product.companyId.toString() !== req.companyId.toString()) {
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
router.post('/:id/files', verifyToken, handleSingleFileUpload, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await BuyProduct.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Только владелец товара может добавить файл
    const productCompanyId = product.companyId?.toString() || product.companyId;
    const requestCompanyId = req.companyId?.toString() || req.companyId;
    
    console.log('[BuyProducts] Comparing company IDs:', {
      productCompanyId,
      requestCompanyId,
      match: productCompanyId === requestCompanyId
    });
    
    if (productCompanyId !== requestCompanyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (req.fileValidationError) {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOC, DOCX, XLS, XLSX or CSV.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Исправляем кодировку имени файла из Latin1 в UTF-8
    const fixedFileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    
    // Извлекаем timestamp из имени файла, созданного multer (формат: {timestamp}_{name}.ext)
    const fileTimestamp = req.file.filename.split('_')[0];
    
    // storagePath относительно UPLOADS_ROOT (который уже включает 'buy-products')
    const relativePath = path.join(id, req.file.filename).replace(/\\/g, '/');
    const file = {
      id: `file-${fileTimestamp}`, // Используем тот же timestamp, что и в имени файла
      name: fixedFileName,
      url: `/uploads/buy-products/${relativePath}`,
      type: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
      storagePath: relativePath,
    };

    console.log('[BuyProducts] Adding file to product:', {
      productId: id,
      fileName: file.name,
      fileSize: file.size,
      filePath: relativePath
    });
    
    console.log('[BuyProducts] File object:', JSON.stringify(file, null, 2));
    
    // Используем findByIdAndUpdate вместо save() для избежания проблем с валидацией
    let updatedProduct;
    try {
      console.log('[BuyProducts] Calling findByIdAndUpdate with id:', id);
      updatedProduct = await BuyProduct.findByIdAndUpdate(
        id,
        { 
          $push: { files: file },
          $set: { updatedAt: new Date() }
        },
        { new: true, runValidators: false }
      );
      console.log('[BuyProducts] findByIdAndUpdate completed');
    } catch (updateError) {
      console.error('[BuyProducts] findByIdAndUpdate error:', {
        message: updateError.message,
        name: updateError.name,
        code: updateError.code
      });
      throw updateError;
    }
    
    if (!updatedProduct) {
      throw new Error('Failed to update product with file');
    }
    
    console.log('[BuyProducts] File added successfully to product:', id);

    log('[BuyProducts] File added to product:', id, file.name);

    res.json(updatedProduct);
  } catch (error) {
    console.error('[BuyProducts] Error adding file:', error.message);
    console.error('[BuyProducts] Error stack:', error.stack);
    console.error('[BuyProducts] Error name:', error.name);
    if (error.errors) {
      console.error('[BuyProducts] Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: error.errors || {},
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

    if (product.companyId.toString() !== req.companyId.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const fileToRemove = product.files.find((f) => f.id === fileId);
    if (!fileToRemove) {
      return res.status(404).json({ error: 'File not found' });
    }

    product.files = product.files.filter(f => f.id !== fileId);
    await product.save();

    const storedPath = fileToRemove.storagePath || fileToRemove.url.replace(/^\/uploads\//, '');
    const absolutePath = path.join(__dirname, '..', '..', 'remote-assets', 'uploads', storedPath);

    fs.promises.unlink(absolutePath).catch((unlinkError) => {
      if (unlinkError && unlinkError.code !== 'ENOENT') {
        console.error('[BuyProducts] Failed to remove file from disk:', unlinkError.message);
      }
    });

    log('[BuyProducts] File deleted from product:', id, fileId);

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
    const companyId = req.companyId;

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

// GET /buy-products/download/:id/:fileId - скачать файл
router.get('/download/:id/:fileId', verifyToken, async (req, res) => {
  try {
    console.log('[BuyProducts] Download request received:', {
      productId: req.params.id,
      fileId: req.params.fileId,
      userId: req.userId,
      companyId: req.companyId,
      headers: req.headers.authorization
    });
    
    const { id, fileId } = req.params;
    const product = await BuyProduct.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const file = product.files.find((f) => f.id === fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Создаем абсолютный путь к файлу
    const filePath = path.resolve(UPLOADS_ROOT, file.storagePath);
    
    console.log('[BuyProducts] Trying to download file:', {
      fileId: file.id,
      fileName: file.name,
      storagePath: file.storagePath,
      absolutePath: filePath,
      exists: fs.existsSync(filePath)
    });

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      console.error('[BuyProducts] File not found on disk:', filePath);
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Устанавливаем правильные заголовки для скачивания с поддержкой кириллицы
    const encodedFileName = encodeURIComponent(file.name);
    res.setHeader('Content-Type', file.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Content-Length', file.size);

    // Отправляем файл
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('[BuyProducts] Error sending file:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('[BuyProducts] Error downloading file:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
