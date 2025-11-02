const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  confirmed: {
    type: Boolean,
    default: false
  },
  customer: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  volume: {
    type: String
  },
  contact: {
    type: String
  },
  comment: {
    type: String
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
experienceSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('Experience', experienceSchema);

