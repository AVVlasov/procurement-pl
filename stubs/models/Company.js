const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  shortName: String,
  inn: {
    type: String,
    sparse: true
  },
  ogrn: String,
  legalForm: String,
  industry: String,
  companySize: String,
  website: String,
  phone: String,
  email: String,
  slogan: String,
  description: String,
  foundedYear: Number,
  employeeCount: String,
  revenue: String,
  legalAddress: String,
  actualAddress: String,
  bankDetails: String,
  logo: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  platformGoals: [String],
  productsOffered: String,
  productsNeeded: String,
  partnerIndustries: [String],
  partnerGeography: [String],
  verified: {
    type: Boolean,
    default: false
  },
  metrics: {
    type: {
      profileViews: { type: Number, default: 0 }
    },
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  collection: 'companies',
  minimize: false
});

// Индексы для поиска
companySchema.index({ fullName: 'text', shortName: 'text', description: 'text' });
companySchema.index({ industry: 1 });
companySchema.index({ rating: -1 });

module.exports = mongoose.model('Company', companySchema);
