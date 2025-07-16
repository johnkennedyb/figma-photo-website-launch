const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');

// @route   POST api/paystack/create-payment
// @desc    Create a Paystack payment link
// @access  Private
router.post('/create-payment', auth, async (req, res) => {
  const { email, amount, counselorId, clientId } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ msg: 'Email and amount are required' });
  }

  const params = {
    email,
    amount, // Amount is expected in kobo (integer)
    metadata: {
      counselorId,
      clientId,
    },
  };

  try {
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      params,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url } = paystackResponse.data.data;
    res.json({ url: authorization_url });

  } catch (err) {
    console.error('Paystack API Error:', err.response ? err.response.data : err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
