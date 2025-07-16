const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  counselor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: { // This will now store the full date and time
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    enum: ['usd', 'ngn'],
  },
  status: {
    type: String,
    enum: ['pending_payment', 'paid', 'completed', 'canceled'],
    default: 'pending_payment',
  },
  // ID from the checkout session creation, used to find the session from the initial webhook
  stripeCheckoutSessionId: {
    type: String,
    index: true, // Index for faster lookups from webhooks
  },
   // The actual payment intent ID, useful for refunds. Populated by the webhook.
  paymentIntentId: {
    type: String,
  },
  // Reference for Paystack transactions
  paymentReference: {
    type: String,
    index: true, // Index for faster lookups from webhooks
  },
  notes: {
    type: String,
  },
  videoCallUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Session', SessionSchema);
