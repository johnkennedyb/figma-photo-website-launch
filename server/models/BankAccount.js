const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountType: {
    type: String,
    enum: ['local', 'international'],
    required: true,
  },
  // For local (Nigerian) accounts
  bankName: { type: String },
  accountNumber: { type: String },
  bankCode: { type: String },

  // For all accounts
  accountName: { type: String, required: true },

  // For international accounts
  iban: { type: String },
  swiftBic: { type: String },
  country: { type: String, required: true },

  isVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', BankAccountSchema);
