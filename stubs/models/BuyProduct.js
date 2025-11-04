const mongoose = require('mongoose');

// Явно определяем схему для файлов
const fileSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  storagePath: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const buyProductSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  quantity: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    default: 'шт'
  },
  files: [fileSchema],
  acceptedBy: [{
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    acceptedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Индексы для оптимизации поиска
buyProductSchema.index({ companyId: 1, createdAt: -1 });
buyProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('BuyProduct', buyProductSchema);
