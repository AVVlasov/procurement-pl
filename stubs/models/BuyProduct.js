const mongoose = require('mongoose');

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
  files: [{
    id: String,
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
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
