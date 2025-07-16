const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paystack = require('paystack-api')(process.env.PAYSTACK_SECRET_KEY);
const auth = require('../middleware/auth');
const User = require('../models/User');
const Session = require('../models/Session');
const Wallet = require('../models/Wallet');
const Request = require('../models/Request');
const Withdrawal = require('../models/Withdrawal');
const { createVideoCall } = require('../helpers/videoCallHelper');

// @route   POST api/payment/create-checkout-session
// @desc    Create a payment checkout session for booking
// @access  Private
router.post('/create-checkout-session', auth, async (req, res) => {
  const { counselorId, date, time, currency } = req.body;
  const clientId = req.user.id;

  try {
    const counselor = await User.findById(counselorId);
    const client = await User.findById(clientId);

    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ msg: 'Counselor not found' });
    }
    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }

    let sessionRate, priceInCents;
    if (currency === 'usd') {
      sessionRate = counselor.sessionRate || 50; // Default to 50 USD
      priceInCents = sessionRate * 100;
    } else if (currency === 'ngn') {
      sessionRate = counselor.ngnSessionRate || 25000; // Default to 25,000 NGN
      priceInCents = sessionRate * 100; // Convert NGN to Kobo for Paystack
    } else {
      return res.status(400).json({ msg: 'Unsupported currency' });
    }

    // Use the current date and time as a fallback if not provided
    const sessionDateTime = (date && time) ? new Date(`${date}T${time}`) : new Date();

    const newSession = new Session({
      client: clientId,
      counselor: counselorId,
      date: sessionDateTime,
      price: sessionRate,
      currency,
      status: 'pending_payment',
    });

    // Save the session *before* creating the external payment session
    await newSession.save();

    if (currency === 'usd') {
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: client.email,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Counseling session with ${counselor.name}`,
              description: `Booking for ${date} at ${time}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        // We pass our internal session ID to the metadata
        metadata: { internalSessionId: newSession._id.toString() },
        success_url: `${process.env.CLIENT_URL}/booking/success?session_id=${newSession._id}`,
        cancel_url: `${process.env.CLIENT_URL}/booking/cancel`,
      });

      // Store the Stripe Checkout Session ID for reconciliation via webhook
      newSession.stripeCheckoutSessionId = stripeSession.id;
      await newSession.save();
      
      res.json({ provider: 'stripe', id: stripeSession.id, url: stripeSession.url });

    } else if (currency === 'ngn') {
      const reference = newSession._id.toString();
      newSession.paymentReference = reference;
      await newSession.save();

      const paystackResponse = await axios.post('https://api.paystack.co/transaction/initialize', {
        email: client.email,
        amount: priceInCents, // Paystack expects amount in Kobo
        currency: 'NGN',
        reference: reference,
        metadata: { internalSessionId: newSession._id.toString() },
        callback_url: `${process.env.CLIENT_URL}/payment/verify?provider=paystack&counselor_id=${counselorId}&session_id=${reference}`,
      }, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        }
      });

      res.json({ provider: 'paystack', ...paystackResponse.data.data, url: paystackResponse.data.data.authorization_url });
    }

  } catch (err) {
    console.error('Error creating checkout session:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/payment/stripe/webhook
// @desc    Handle Stripe payment webhooks
// @access  Public
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️ Stripe webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object;
    const internalSessionId = checkoutSession.metadata.internalSessionId;

    try {
      // Use the Stripe Checkout Session ID to find our internal session
      const session = await Session.findOne({ stripeCheckoutSessionId: checkoutSession.id });

      if (!session) {
        console.error(`Webhook Error: Session not found with Stripe Checkout Session ID: ${checkoutSession.id}`);
        return res.status(404).send('Session not found.');
      }

      if (session.status === 'paid') {
        console.log(`Session ${session._id} is already paid.`);
        return res.status(200).send('Session already processed.');
      }

      // Update session status and save the actual Payment Intent ID for future reference (e.g., refunds)
      session.status = 'paid';
      session.paymentIntentId = checkoutSession.payment_intent; // Correctly store the Payment Intent ID

      // Create video call room
      try {
        const videoCallUrl = await createVideoCall(session);
        session.videoCallUrl = videoCallUrl;
        console.log(`[Stripe Webhook] Successfully created video call for session ${session._id}`);
      } catch (videoCallError) {
        console.error(`[Stripe Webhook] Failed to create video call for session ${session._id}:`, videoCallError.message);
        // Non-fatal error, we log and continue
      }
      
      await session.save();

      // After successful payment, create a connection request
      try {
        const existingRequest = await Request.findOne({
          client: session.client,
          counselor: session.counselor,
          status: { $in: ['pending', 'accepted'] },
        });

        if (!existingRequest) {
          const newRequest = new Request({
            client: session.client,
            counselor: session.counselor,
          });
          await newRequest.save();
          console.log(`[Stripe Webhook] Created connection request ${newRequest._id}`);

          // Notify counselor about the new request
          const io = req.io;
          const userSocketMap = req.userSocketMap;
          const counselorSocketId = userSocketMap[session.counselor.toString()];
          if (counselorSocketId) {
            io.to(counselorSocketId).emit('new-request', newRequest);
          }
        } else {
          console.log(`[Stripe Webhook] Request already exists for client ${session.client} and counselor ${session.counselor}`);
        }
      } catch (requestError) {
        console.error(`[Stripe Webhook] Failed to create connection request for session ${session._id}:`, requestError.message);
      }

      // Add to counselor's wallet
      const platformFee = 0.1; // 10% platform fee
      const amountEarned = session.price * (1 - platformFee);

      await Wallet.findOneAndUpdate(
        { user: session.counselor },
        { $inc: { balance: amountEarned } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Notify the client via WebSocket
      const io = req.io;
      const userSocketMap = req.userSocketMap;
      const clientSocketId = userSocketMap[session.client.toString()];
      const counselorSocketId = userSocketMap[session.counselor.toString()];

      if (clientSocketId) {
        io.to(clientSocketId).emit('session-booked', session);
      }
      if (counselorSocketId) {
        io.to(counselorSocketId).emit('session-booked', session);
        io.to(counselorSocketId).emit('wallet-updated');
      }
    } catch (dbError) {
      console.error('Error processing Stripe webhook:', dbError);
      return res.status(500).send('Internal Server Error');
    }
  }

  res.json({ received: true });
});

// @route   POST api/payment/paystack/webhook
// @desc    Handle Paystack payment webhooks
// @access  Public
router.post('/paystack/webhook', express.json(), async (req, res) => {
  // Validate the webhook signature
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) {
    console.error('Invalid Paystack signature.');
    return res.sendStatus(400);
  }

  const event = req.body;
  console.log(`Paystack webhook received: ${event.event}`);

  // Handle the charge.success event
  if (event.event === 'charge.success') {
    const { reference } = event.data;
    console.log(`Processing Paystack charge.success for reference: ${reference}`);

    try {
      const session = await Session.findOne({ paymentReference: reference }).populate('counselor', 'name email');
      
      if (!session) {
        console.error(`Webhook Error: Session not found with reference: ${reference}`);
        return res.sendStatus(404);
      }

      if (session.status === 'paid') {
        console.log(`Session ${reference} has already been processed.`);
        return res.sendStatus(200);
      }

      session.status = 'paid';

      // Create video call room
      try {
        const videoCallUrl = await createVideoCall(session);
        session.videoCallUrl = videoCallUrl;
        console.log(`[Paystack Webhook] Successfully created video call for session ${session._id}`);
      } catch (videoCallError) {
        console.error(`[Paystack Webhook] Failed to create video call for session ${session._id}:`, videoCallError.message);
      }
      
      // Add to counselor's wallet
      const platformFee = 0.1; // 10% platform fee
      const amountEarned = session.price * (1 - platformFee);

      const wallet = await Wallet.findOneAndUpdate(
        { user: session.counselor },
        { $inc: { balance: amountEarned } },
        { new: true, upsert: true }
      );

      console.log(`Credited ${amountEarned} to counselor ${session.counselor._id}'s wallet. New balance: ${wallet.balance}`);

      await session.save();
      console.log(`Session ${session._id} status updated to paid.`);



      // Notify the client via WebSocket
      const io = req.io;
      const userSocketMap = req.userSocketMap;
      const clientSocketId = userSocketMap[session.client.toString()];
      const counselorSocketId = userSocketMap[session.counselor.toString()];

      if (clientSocketId) {
        io.to(clientSocketId).emit('session-booked', session);
        console.log(`Sent session-booked event to client ${session.client} via socket ${clientSocketId}`);
      } else {
        console.log(`Client ${session.client} not connected via socket.`);
      }

      if (counselorSocketId) {
        io.to(counselorSocketId).emit('session-booked', session);
        io.to(counselorSocketId).emit('wallet-updated');
        console.log(`Sent session-booked and wallet-updated events to counselor ${session.counselor._id} via socket ${counselorSocketId}`);
      } else {
        console.log(`Counselor ${session.counselor._id} not connected via socket.`);
      }

    } catch (err) {
      console.error('Error processing Paystack webhook:', err);
      return res.status(500).send('Internal Server Error');
    }
  }

  // Acknowledge receipt of the webhook to prevent retries
  res.sendStatus(200);
});

// @route   POST /api/payment/paystack-webhook
// @desc    Handle Paystack transfer webhooks
// @access  Public
router.post('/paystack-webhook', async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    console.error('Paystack webhook error: Invalid signature');
    return res.sendStatus(401);
  }

  const { event, data } = req.body;

  if (event === 'transfer.success' || event === 'transfer.failed' || event === 'transfer.reversed') {
    try {
      const withdrawal = await Withdrawal.findOne({ transactionId: data.transfer_code });

      if (!withdrawal) {
        console.error(`Paystack webhook: Withdrawal not found for transfer_code ${data.transfer_code}`);
        return res.sendStatus(404);
      }

      if (event === 'transfer.failed' || event === 'transfer.reversed') {
        withdrawal.status = 'failed';
        withdrawal.failureReason = data.failure_reason || 'Transfer was reversed by Paystack.';
        // Refund the user's wallet
        const wallet = await Wallet.findOne({ user: withdrawal.user });
        wallet.balance += withdrawal.amount;
        await wallet.save();
      } else if (event === 'transfer.success') {
        withdrawal.status = 'completed';
      }

      await withdrawal.save();
      console.log(`Withdrawal ${withdrawal._id} status updated to ${withdrawal.status}`);

    } catch (err) {
      console.error('Error processing Paystack webhook:', err);
      return res.sendStatus(500);
    }
  }

  res.sendStatus(200);
});

// @route   POST /api/payment/webhook
// @desc    Stripe webhook endpoint
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sessionId = session.client_reference_id;

    try {
      const bookingSession = await Session.findById(sessionId);
      if (bookingSession && bookingSession.status !== 'paid') {
        bookingSession.status = 'paid';
        bookingSession.paymentDetails = {
          provider: 'stripe',
          transactionId: session.payment_intent,
        };
        await bookingSession.save();

        // Notify the client via Socket.IO
        const io = req.io;
        const userSocketMap = req.userSocketMap;
        const clientSocketId = userSocketMap[bookingSession.client.toString()];

        if (clientSocketId) {
          io.to(clientSocketId).emit('session-updated', bookingSession);
        }
      }
    } catch (err) {
      console.error('Error updating session status:', err);
      return res.status(500).send('Server Error');
    }
  }

  res.json({ received: true });
});


// @route   POST api/payment/verify-payment
// @desc    Verify a Stripe checkout session payment status
// @access  Private
router.post('/verify-payment', auth, async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ msg: 'Session ID is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    // If payment is successful, ensure a session exists and is marked as paid
    if (session.payment_status === 'paid') {
      let counselorId = session.metadata?.counselorId;
      let clientId = session.metadata?.clientId;
      let internalSessionId = session.metadata?.internalSessionId;
      if (!counselorId || !clientId) {
          if (internalSessionId) {
            const storedSession = await Session.findById(internalSessionId).populate('counselor client');
            if (storedSession) {
              counselorId = storedSession.counselor._id;
              clientId    = storedSession.client._id;
              if (storedSession.status !== 'paid') {
                storedSession.status = 'paid';
                await storedSession.save();
              }
            }
          }
        }
        if (counselorId && clientId) {
        try {
          let existingSession = await Session.findOne({ client: clientId, counselor: counselorId, status: { $in: ['pending', 'pending_payment'] } });
          if (!existingSession) {
            existingSession = new Session({
              client: clientId,
              counselor: counselorId,
              status: 'paid',
              price: session.amount_total / 100, // amount_total is in cents
              currency: session.currency || 'usd',
              date: new Date(),
            });
          } else {
            existingSession.status = 'paid';
          }
          await existingSession.save();

          // Credit counselor wallet and create transaction record
          const platformFee = 0.1;
          const amountEarned = (session.amount_total / 100) * (1 - platformFee);
          const wallet = await Wallet.findOneAndUpdate(
            { user: counselorId },
            { $inc: { balance: amountEarned } },
            { new: true, upsert: true }
          );
          const Transaction = require('../models/Transaction');
          const newTx = new Transaction({
            wallet: wallet._id,
            type: 'credit',
            amount: amountEarned,
            description: 'Session payment',
            status: 'completed',
          });
          await newTx.save();
          wallet.transactions.push(newTx._id);
          await wallet.save();
        } catch (dbErr) {
          console.error('Error ensuring session payment record:', dbErr);
        }
      }
    }

    res.json({ payment_status: session.payment_status });
  } catch (err) {
    console.error('Error verifying Stripe session:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});


// @route   POST api/payment/verify-paystack
// @desc    Verify a Paystack transaction status
// also credit counselor wallet
// @access  Private
router.post('/verify-paystack', auth, async (req, res) => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ msg: 'Paystack reference is required' });
  }

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        }
    });

    // If successful, update session and wallet
    if (response.data.data.status === 'success') {
      const metadata = response.data.data.metadata || {};
      const internalSessionId = metadata.internalSessionId;
      if (internalSessionId) {
        const paidSession = await Session.findById(internalSessionId);
        if (paidSession && paidSession.status !== 'paid') {
          paidSession.status = 'paid';
          await paidSession.save();
        }
        const counselorId = paidSession?.counselor;
        if (counselorId) {
          const platformFee = 0.1;
          const amountEarned = (response.data.data.amount / 100) * (1 - platformFee); // amount in Kobo converted to NGN
          const wallet = await Wallet.findOneAndUpdate(
            { user: counselorId },
            { $inc: { balance: amountEarned } },
            { new: true, upsert: true }
          );
          const Transaction = require('../models/Transaction');
          const newTx = new Transaction({
            wallet: wallet._id,
            type: 'credit',
            amount: amountEarned,
            description: 'Session payment',
            status: 'completed',
          });
          await newTx.save();
          wallet.transactions.push(newTx._id);
          await wallet.save();
        }
      }
    }

    res.json({ payment_status: response.data.data.status }); // e.g., 'success', 'failed'

  } catch (err) {
    console.error('Error verifying Paystack transaction:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
