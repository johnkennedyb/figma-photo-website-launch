const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bankName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  bankCode: {
    type: String, // Required for some payment gateways like Paystack
  },
  country: {
    type: String,
    required: true,
    enum: ['NG', 'US'] // Example countries
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', BankAccountSchema);
