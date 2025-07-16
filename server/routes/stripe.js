const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Route to create a Stripe Checkout session
router.post('/create-checkout-session', async (req, res) => {
  const { amount, currency, counselorId, clientId } = req.body;

  if (!amount || !currency || !counselorId || !clientId) {
    return res.status(400).json({ error: 'Missing required session parameters.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Counseling Session',
              // You can add more details here, like a description or images
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
      metadata: {
        counselorId,
        clientId,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe session creation failed:', error);
    res.status(500).json({ error: 'Failed to create Stripe session.' });
  }
});

module.exports = router;
