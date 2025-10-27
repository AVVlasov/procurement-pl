const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  senderCompanyId: {
    type: String,
    required: true,
    index: true
  },
  recipientCompanyId: {
    type: String,
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
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
  productId: {
    type: String,
    ref: 'BuyProduct'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  response: {
    type: String,
    default: null
  },
  respondedAt: {
    type: Date,
    default: null
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
requestSchema.index({ senderCompanyId: 1, createdAt: -1 });
requestSchema.index({ recipientCompanyId: 1, createdAt: -1 });
requestSchema.index({ senderCompanyId: 1, recipientCompanyId: 1 });

module.exports = mongoose.model('Request', requestSchema);
