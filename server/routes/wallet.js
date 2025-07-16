const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const BankAccount = require('../models/BankAccount');
const Transaction = require('../models/Transaction');
const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

// @route   GET api/wallet
// @desc    Get user wallet balance and transactions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id }).populate('transactions');

    if (!wallet) {
      wallet = new Wallet({ user: req.user.id, balance: 0, transactions: [] });
      await wallet.save();
    }

    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date)),
      currency: wallet.currency || 'USD',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/wallet/deposit
// @desc    Fund user wallet and verify payment with Paystack
// @access  Private
router.post('/deposit', auth, async (req, res) => {
  const { reference, amount } = req.body;

  if (!reference || !amount) {
    return res.status(400).json({ msg: 'Payment reference and amount are required.' });
  }

  try {
    const paystackResponse = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });

    const { status, data } = paystackResponse.data;

    if (!status || data.status !== 'success') {
      return res.status(400).json({ msg: 'Payment verification failed.' });
    }

    if (data.amount !== amount * 100) {
      return res.status(400).json({ msg: 'Paid amount does not match transaction amount.' });
    }

    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id, balance: 0 });
    }

    const existingTransaction = await Transaction.findOne({ reference });
    if (existingTransaction) {
      return res.status(409).json({ msg: 'This transaction has already been processed.' });
    }

    const newTransaction = new Transaction({
      wallet: wallet._id,
      type: 'credit',
      amount,
      description: 'Wallet deposit',
      reference,
      status: 'completed',
    });
    await newTransaction.save();

    wallet.balance += amount;
    wallet.transactions.push(newTransaction._id);
    await wallet.save();

    res.json({ msg: 'Wallet funded successfully.', balance: wallet.balance });
  } catch (err) {
    console.error('Deposit Error:', err.response ? err.response.data : err.message);
    res.status(500).send('Server Error');
  }
});

// --- Counselor Bank Account Management ---

// @route   POST api/wallet/bank-accounts
// @desc    Add a bank account for a counselor
// @access  Private (Counselor)
router.post('/bank-accounts', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'User not authorized' });
  }

  const { accountType, accountName, bankName, accountNumber, iban, swiftBic, country } = req.body;

  try {
    let bankAccountData = { user: req.user.id, accountType, accountName, country };
    let recipientCode;

    if (accountType === 'local') {
      if (!bankName || !accountNumber) {
        return res.status(400).json({ msg: 'Bank name and account number are required for local accounts.' });
      }
      // In a real app, you would fetch the bank code from Paystack's API based on the bankName
      const bankCode = '058'; // Hardcoded for simplicity (GTBank)
      if (process.env.NODE_ENV !== 'production' || !paystack?.transfer_recipient?.create) {
        // Skip external call entirely in dev or if library unavailable
        recipientCode = `TEST-${Date.now()}`;
      } else {
        try {
          const recipient = await paystack.transfer_recipient.create({
            type: 'nuban',
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'NGN',
          });
          recipientCode = recipient.data.recipient_code;
        } catch (paystackErr) {
          console.error('Paystack recipient creation failed:', paystackErr?.response?.data || paystackErr.message);
          // Fallback for development / testing without valid Paystack keys.
          if (process.env.NODE_ENV !== 'production') {
            recipientCode = `TEST-${Date.now()}`;
          } else {
            return res.status(500).json({ msg: 'Failed to create Paystack recipient. Please try again later.' });
          }
        }
      }
      bankAccountData = { ...bankAccountData, bankName, accountNumber, recipientCode };
    } else {
      if (!iban || !swiftBic) {
        return res.status(400).json({ msg: 'IBAN and SWIFT/BIC are required for international accounts.' });
      }
      bankAccountData = { ...bankAccountData, iban, swiftBic };
    }

    // Upsert: if a bank account already exists for this user, update it instead of creating a duplicate
    const bankAccount = await BankAccount.findOneAndUpdate(
      { user: req.user.id },
      bankAccountData,
      { new: true, upsert: true }
    );
    res.json(bankAccount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/wallet/bank-accounts
// @desc    Get all bank accounts for a counselor
// @access  Private (Counselor)
router.get('/bank-accounts', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'User not authorized' });
  }
  try {
    const accounts = await BankAccount.find({ user: req.user.id });
    res.json(accounts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/wallet/bank-accounts/:id
// @desc    Delete a bank account
// @access  Private (Counselor)
router.delete('/bank-accounts/:id', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'User not authorized' });
  }
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ msg: 'Bank account not found' });
    }
    if (account.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await BankAccount.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Bank account removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Counselor Withdrawal --- 

// @route   POST api/wallet/withdraw
// @desc    Request a withdrawal
// @access  Private (Counselor)
router.post('/withdraw', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'User not authorized' });
  }

  const { amount, bankAccountId } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ msg: 'Please enter a valid amount.' });
  }
  if (!bankAccountId) {
    return res.status(400).json({ msg: 'Please select a bank account.' });
  }

  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    const bankAccount = await BankAccount.findById(bankAccountId);

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance.' });
    }

    if (!bankAccount || bankAccount.user.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Bank account not found or does not belong to user.' });
    }

    let transferResponse;
    let description = `Withdrawal to ${bankAccount.accountName}`;

    if (bankAccount.accountType === 'local') {
      if (!bankAccount.recipientCode) {
        if (process.env.NODE_ENV !== 'production') {
          // Skip external transfer in dev when we have no recipientCode
          transferResponse = { data: { transfer_code: `TEST-WITHDRAW-${Date.now()}` }, status: true };
        } else {
          return res.status(400).json({ msg: 'Paystack recipient details not found. Please re-add the account.' });
        }
      } else {
        transferResponse = await paystack.transfer.initiate({
          source: 'balance',
          amount: amount * 100, // Paystack expects kobo
          recipient: bankAccount.recipientCode,
          reason: description,
        });
        if (!transferResponse.status) {
          return res.status(400).json({ msg: `Paystack transfer failed: ${transferResponse.message}` });
        }
      }
    } else { // International withdrawal via Stripe
      // This is a simplified example. For production, use Stripe Connect for managed accounts.
      transferResponse = await stripe.payouts.create({
        amount: amount * 100, // Stripe expects cents
        currency: 'usd',
        method: 'standard',
        description: description,
      });
    }

    wallet.balance -= Number(amount);

    const transaction = new Transaction({
      wallet: wallet._id,
      type: 'debit',
      amount: Number(amount),
      description,
      status: 'completed',
      reference: transferResponse.data ? transferResponse.data.transfer_code : transferResponse.id,
    });

    await transaction.save();
    wallet.transactions.push(transaction._id);
    await wallet.save();

    res.json({ 
      msg: 'Withdrawal initiated successfully!', 
      balance: wallet.balance, 
      withdrawal: transaction, 
      newBalance: wallet.balance 
    });
  } catch (err) {
    console.error('Withdrawal Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/wallet/counselor
// @access  Private (Counselor)
router.get('/counselor', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'User not authorized' });
  }

  const { period } = req.query; // today, week, month, year, total

  try {
    let wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      wallet = new Wallet({ user: req.user.id, balance: 0 });
      await wallet.save();
    }

    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const week = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const month = new Date(today.getFullYear(), today.getMonth(), 1);
    const year = new Date(today.getFullYear(), 0, 1);

    const getDateRange = (p) => {
      switch (p) {
        case 'today': return { $gte: today };
        case 'week': return { $gte: week };
        case 'month': return { $gte: month };
        case 'year': return { $gte: year };
        default: return {};
      }
    };

    const calculateEarnings = async (dateRange) => {
      const result = await Transaction.aggregate([
        { $match: { wallet: wallet._id, type: 'credit', date: dateRange } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      return result.length > 0 ? result[0].total : 0;
    };

    const earnings = {
      today: await calculateEarnings(getDateRange('today')),
      week: await calculateEarnings(getDateRange('week')),
      month: await calculateEarnings(getDateRange('month')),
      year: await calculateEarnings(getDateRange('year')),
      total: await calculateEarnings(getDateRange('total')),
    };

    res.json({ balance: wallet.balance, earnings });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
