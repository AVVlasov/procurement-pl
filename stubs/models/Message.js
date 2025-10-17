const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
    index: true
  },
  senderCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  recipientCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Индекс для быстрого поиска сообщений потока
messageSchema.index({ threadId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
