const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 500
  },
  type: {
    type: String,
    enum: ['sell', 'buy'],
    required: true
  },
  productUrl: String,
  companyId: {
    type: String,
    required: true,
    index: true
  },
  price: String,
  unit: String,
  minOrder: String,
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

// Индекс для поиска
productSchema.index({ companyId: 1, type: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Transform _id to id in JSON output
productSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);
