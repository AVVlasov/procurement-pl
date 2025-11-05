const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Request = require('../models/Request');
const BuyProduct = require('../models/BuyProduct');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

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

const REQUESTS_UPLOAD_ROOT = path.join(__dirname, '..', '..', 'remote-assets', 'uploads', 'requests');

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDirectory(REQUESTS_UPLOAD_ROOT);

const MAX_REQUEST_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_REQUEST_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = req.requestUploadSubfolder || '';
    const destinationDir = path.join(REQUESTS_UPLOAD_ROOT, subfolder);
    ensureDirectory(destinationDir);
    cb(null, destinationDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || '';
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]+/g, '_')
      .toLowerCase();
    cb(null, `${Date.now()}_${baseName}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_REQUEST_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_REQUEST_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    if (!req.invalidFiles) {
      req.invalidFiles = [];
    }
    req.invalidFiles.push(file.originalname);
    cb(null, false);
  },
});

const handleFilesUpload = (fieldName, subfolderResolver, maxCount = 10) => (req, res, next) => {
  req.invalidFiles = [];
  req.requestUploadSubfolder = subfolderResolver(req);

  upload.array(fieldName, maxCount)(req, res, (err) => {
    if (err) {
      console.error('[Requests] Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File is too large. Maximum size is 20MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

const cleanupUploadedFiles = async (req) => {
  if (!Array.isArray(req.files) || req.files.length === 0) {
    return;
  }

  const subfolder = req.requestUploadSubfolder || '';
  const removalTasks = req.files.map((file) => {
    const filePath = path.join(REQUESTS_UPLOAD_ROOT, subfolder, file.filename);
    return fs.promises.unlink(filePath).catch((error) => {
      if (error.code !== 'ENOENT') {
        console.error('[Requests] Failed to cleanup uploaded file:', error.message);
      }
    });
  });

  await Promise.all(removalTasks);
};

const mapFilesToMetadata = (req) => {
  if (!Array.isArray(req.files) || req.files.length === 0) {
    return [];
  }

  const subfolder = req.requestUploadSubfolder || '';
  return req.files.map((file) => {
    const relativePath = path.join('requests', subfolder, file.filename).replace(/\\/g, '/');
    return {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.originalname,
      url: `/uploads/${relativePath}`,
      type: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      storagePath: relativePath,
    };
  });
};

const normalizeToArray = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    // ignore JSON parse errors
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const removeStoredFiles = async (files = []) => {
  if (!files || files.length === 0) {
    return;
  }

  const tasks = files
    .filter((file) => file && file.storagePath)
    .map((file) => {
      const absolutePath = path.join(__dirname, '..', '..', 'remote-assets', 'uploads', file.storagePath);
      return fs.promises.unlink(absolutePath).catch((error) => {
        if (error.code !== 'ENOENT') {
          console.error('[Requests] Failed to remove stored file:', error.message);
        }
      });
    });

  await Promise.all(tasks);
};

// GET /requests/sent - получить отправленные запросы
router.get('/sent', verifyToken, async (req, res) => {
  try {
    const companyId = req.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

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
    const companyId = req.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

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
router.post(
  '/',
  verifyToken,
  handleFilesUpload('files', (req) => path.join('sent', (req.companyId || 'unknown').toString()), 10),
  async (req, res) => {
    try {
      const senderCompanyId = req.companyId;
      const recipients = normalizeToArray(req.body.recipientCompanyIds);
      const text = (req.body.text || '').trim();
      const productId = req.body.productId ? String(req.body.productId) : null;
      let subject = (req.body.subject || '').trim();

      if (req.invalidFiles && req.invalidFiles.length > 0) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({
          error: 'Unsupported file type. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV.',
          details: req.invalidFiles,
        });
      }

      if (!text) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({ error: 'Request text is required' });
      }

      if (!recipients.length) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({ error: 'At least one recipient is required' });
      }

      let uploadedFiles = mapFilesToMetadata(req);
      
      console.log('========================');
      console.log('[Requests] Initial uploadedFiles:', uploadedFiles.length);
      console.log('[Requests] ProductId:', productId);
      
      // Если есть productId, получаем данные товара
      if (productId) {
        try {
          const product = await BuyProduct.findById(productId);
          console.log('[Requests] Product found:', product ? product.name : 'null');
          console.log('[Requests] Product files count:', product?.files?.length || 0);
          if (product && product.files) {
            console.log('[Requests] Product files:', JSON.stringify(product.files, null, 2));
          }
          
          if (product) {
            // Берем subject из товара, если не указан
            if (!subject) {
              subject = product.name;
            }
            
            // Если файлы не загружены вручную, используем файлы из товара
            if (uploadedFiles.length === 0 && product.files && product.files.length > 0) {
              console.log('[Requests] ✅ Copying files from product...');
              // Копируем файлы из товара, изменяя путь для запроса
              uploadedFiles = product.files.map(file => ({
                id: file.id || `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name: file.name,
                url: file.url,
                type: file.type,
                size: file.size,
                uploadedAt: file.uploadedAt || new Date(),
                storagePath: file.storagePath || file.url.replace('/uploads/', ''),
              }));
              console.log('[Requests] ✅ Using', uploadedFiles.length, 'files from product:', productId);
              console.log('[Requests] ✅ Copied files:', JSON.stringify(uploadedFiles, null, 2));
            } else {
              console.log('[Requests] ❌ NOT copying files. uploadedFiles.length:', uploadedFiles.length, 'product.files.length:', product.files?.length || 0);
            }
          }
        } catch (lookupError) {
          console.error('[Requests] ❌ Failed to lookup product:', lookupError.message);
          console.error(lookupError.stack);
        }
      }
      
      console.log('[Requests] Final uploadedFiles for saving:', JSON.stringify(uploadedFiles, null, 2));
      console.log('========================');

      if (!subject) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({ error: 'Subject is required' });
      }

      const results = [];
      for (const recipientCompanyId of recipients) {
        try {
          const request = new Request({
            senderCompanyId,
            recipientCompanyId,
            text,
            productId,
            subject,
            files: uploadedFiles,
            responseFiles: [],
            status: 'pending',
          });

          await request.save();
          results.push({
            companyId: recipientCompanyId,
            success: true,
            message: 'Request sent successfully',
          });

          log('[Requests] Request sent to company:', recipientCompanyId);
        } catch (err) {
          console.error('[Requests] Error storing request for company:', recipientCompanyId, err.message);
          results.push({
            companyId: recipientCompanyId,
            success: false,
            message: err.message,
          });
        }
      }

      const createdAt = new Date();

      res.status(201).json({
        id: 'bulk-' + Date.now(),
        text,
        subject,
        productId,
        files: uploadedFiles,
        result: results,
        createdAt,
      });
    } catch (error) {
      console.error('[Requests] Error creating request:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /requests/:id - ответить на запрос
router.put(
  '/:id',
  verifyToken,
  handleFilesUpload('responseFiles', (req) => path.join('responses', req.params.id || 'unknown'), 5),
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log('[Requests] PUT /requests/:id called with id:', id);
      console.log('[Requests] Request body:', req.body);
      console.log('[Requests] Files:', req.files);
      console.log('[Requests] CompanyId:', req.companyId);
      
      const responseText = (req.body.response || '').trim();
      const statusRaw = (req.body.status || 'accepted').toLowerCase();
      const status = statusRaw === 'rejected' ? 'rejected' : 'accepted';
      
      console.log('[Requests] Response text:', responseText);
      console.log('[Requests] Status:', status);

      if (req.invalidFiles && req.invalidFiles.length > 0) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({
          error: 'Unsupported file type. Allowed formats: PDF, DOC, DOCX, XLS, XLSX, CSV.',
          details: req.invalidFiles,
        });
      }

      if (!responseText) {
        await cleanupUploadedFiles(req);
        return res.status(400).json({ error: 'Response text is required' });
      }

      const request = await Request.findById(id);

      if (!request) {
        await cleanupUploadedFiles(req);
        return res.status(404).json({ error: 'Request not found' });
      }

      if (request.recipientCompanyId !== req.companyId) {
        await cleanupUploadedFiles(req);
        return res.status(403).json({ error: 'Not authorized' });
      }

      const uploadedResponseFiles = mapFilesToMetadata(req);
      console.log('[Requests] Uploaded response files count:', uploadedResponseFiles.length);
      console.log('[Requests] Uploaded response files:', JSON.stringify(uploadedResponseFiles, null, 2));

      if (uploadedResponseFiles.length > 0) {
        await removeStoredFiles(request.responseFiles || []);
        request.responseFiles = uploadedResponseFiles;
      }

      request.response = responseText;
      request.status = status;
      request.respondedAt = new Date();
      request.updatedAt = new Date();

      let savedRequest;
      try {
        savedRequest = await request.save();
        log('[Requests] Request responded:', id);
      } catch (saveError) {
        console.error('[Requests] Mongoose save failed, trying direct MongoDB update:', saveError.message);
        // Fallback: использовать MongoDB драйвер напрямую
        const mongoose = require('mongoose');
        const updateData = {
          response: responseText,
          status: status,
          respondedAt: new Date(),
          updatedAt: new Date()
        };
        if (uploadedResponseFiles.length > 0) {
          updateData.responseFiles = uploadedResponseFiles;
        }
        
        const result = await mongoose.connection.collection('requests').findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(id) },
          { $set: updateData },
          { returnDocument: 'after' }
        );
        
        if (!result) {
          throw new Error('Failed to update request');
        }
        savedRequest = result;
        log('[Requests] Request responded via direct MongoDB update:', id);
      }

      res.json(savedRequest);
    } catch (error) {
      console.error('[Requests] Error responding to request:', error.message);
      console.error('[Requests] Error stack:', error.stack);
      if (error.name === 'ValidationError') {
        console.error('[Requests] Validation errors:', JSON.stringify(error.errors, null, 2));
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /requests/download/:id/:fileId - скачать файл ответа
router.get('/download/:id/:fileId', verifyToken, async (req, res) => {
  try {
    console.log('[Requests] Download request received:', {
      requestId: req.params.id,
      fileId: req.params.fileId,
      userId: req.userId,
      companyId: req.companyId,
    });

    const { id, fileId } = req.params;
    const request = await Request.findById(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Проверяем, что пользователь имеет доступ к запросу (отправитель или получатель)
    if (request.senderCompanyId !== req.companyId && request.recipientCompanyId !== req.companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Ищем файл в responseFiles или в обычных files
    let file = request.responseFiles?.find((f) => f.id === fileId);
    if (!file) {
      file = request.files?.find((f) => f.id === fileId);
    }
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Создаем абсолютный путь к файлу
    // Если storagePath не начинается с 'requests/', значит это файл из buy-products
    let fullPath = file.storagePath;
    if (!fullPath.startsWith('requests/')) {
      fullPath = `buy-products/${fullPath}`;
    }
    const filePath = path.resolve(__dirname, '..', '..', 'remote-assets', 'uploads', fullPath);

    console.log('[Requests] Trying to download file:', {
      fileId: file.id,
      fileName: file.name,
      storagePath: file.storagePath,
      absolutePath: filePath,
      exists: fs.existsSync(filePath),
    });

    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      console.error('[Requests] File not found on disk:', filePath);
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
        console.error('[Requests] Error sending file:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error sending file' });
        }
      } else {
        log('[Requests] File downloaded:', file.name);
      }
    });
  } catch (error) {
    console.error('[Requests] Error downloading file:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
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
    if (request.senderCompanyId !== req.companyId && request.recipientCompanyId !== req.companyId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await removeStoredFiles(request.files || []);
    await removeStoredFiles(request.responseFiles || []);

    await Request.findByIdAndDelete(id);

    log('[Requests] Request deleted:', id);

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('[Requests] Error deleting request:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
