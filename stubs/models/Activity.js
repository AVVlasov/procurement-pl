const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'message_received',
      'message_sent',
      'request_received',
      'request_sent',
      'request_response',
      'product_accepted',
      'review_received',
      'profile_updated',
      'product_added',
      'buy_product_added'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  relatedCompanyId: {
    type: String
  },
  relatedCompanyName: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Индексы для оптимизации
activitySchema.index({ companyId: 1, createdAt: -1 });
activitySchema.index({ companyId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

