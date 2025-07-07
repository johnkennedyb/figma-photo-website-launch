const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const Session = require('../models/Session');
const Withdrawal = require('../models/Withdrawal');
const BankAccount = require('../models/BankAccount');

// @route   GET api/wallet
// @desc    Get counselor earnings overview
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ counselor: req.user.id, status: 'completed' });

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    const earnings = {
      total: sessions.reduce((acc, s) => acc + (s.price || 0), 0),
      year: sessions.filter(s => new Date(s.date) >= oneYearAgo).reduce((acc, s) => acc + (s.price || 0), 0),
      month: sessions.filter(s => new Date(s.date) >= oneMonthAgo).reduce((acc, s) => acc + (s.price || 0), 0),
      week: sessions.filter(s => new Date(s.date) >= oneWeekAgo).reduce((acc, s) => acc + (s.price || 0), 0),
    };

    res.json(earnings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/wallet/details
// @desc    Get wallet balance and bank details
// @access  Private
router.get('/details', auth, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      // Create a new wallet if it doesn't exist
      wallet = new Wallet({ user: req.user.id });
      await wallet.save();
    }
    res.json({
      balance: wallet.balance,
      bankDetails: wallet.bankDetails,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/wallet/bank-details
// @desc    Add/Update bank details
// @access  Private
router.post('/bank-details', auth, async (req, res) => {
  const { bankName, accountNumber, accountName, bvn } = req.body;
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = new Wallet({ user: req.user.id });
    }
    wallet.bankDetails = { bankName, accountNumber, accountName, bvn };
    await wallet.save();
    res.json(wallet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/wallet/withdraw
// @desc    Request a withdrawal
// @access  Private
router.post('/withdraw', auth, async (req, res) => {
  const { amount } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ msg: 'Please enter a valid amount.' });
  }

  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    const bankAccount = await BankAccount.findOne({ user: req.user.id });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance.' });
    }

    if (!bankAccount) {
      return res.status(400).json({ msg: 'No bank account found. Please add one first.' });
    }

    // Deduct from wallet
    wallet.balance -= Number(amount);
    await wallet.save();

    // Create withdrawal record
    const withdrawal = new Withdrawal({
      user: req.user.id,
      amount: Number(amount),
      currency: 'NGN', // Assuming NGN for now
      bankAccount: bankAccount._id,
      status: 'pending',
    });
    await withdrawal.save();

    res.json({ 
      msg: 'Withdrawal request successful. It will be processed shortly.', 
      balance: wallet.balance 
    });

  } catch (err) {
    console.error('Withdrawal Error:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/wallet/withdrawals
// @desc    Get user's withdrawal history
// @access  Private
router.get('/withdrawals', auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    console.error('Error fetching withdrawals:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/wallet/counselor
// @desc    Get counselor earnings overview and wallet balance
// @access  Private
router.get('/counselor', auth, async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({ msg: 'User is not a counselor' });
    }

    const sessions = await Session.find({ counselor: req.user.id, status: 'completed' });
    const wallet = await Wallet.findOne({ user: req.user.id });

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    const earnings = {
      total: sessions.reduce((acc, s) => acc + (s.price || 0), 0),
      year: sessions.filter(s => new Date(s.date) >= oneYearAgo).reduce((acc, s) => acc + (s.price || 0), 0),
      month: sessions.filter(s => new Date(s.date) >= oneMonthAgo).reduce((acc, s) => acc + (s.price || 0), 0),
      week: sessions.filter(s => new Date(s.date) >= oneWeekAgo).reduce((acc, s) => acc + (s.price || 0), 0),
    };

    res.json({
      earnings,
      balance: wallet ? wallet.balance : 0,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
