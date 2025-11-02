const mongoose = require('mongoose');

const buyDocumentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ownerCompanyId: {
    type: String,
    required: true,
    index: true
  },
  name: {
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
  filePath: {
    type: String,
    required: true
  },
  acceptedBy: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('BuyDocument', buyDocumentSchema);

