const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BankAccount = require('../models/BankAccount');
const Withdrawal = require('../models/Withdrawal');
const Wallet = require('../models/Wallet');
const {
  resolveAccountNumber,
  createTransferRecipient,
  initiateTransfer,
} = require('../helpers/paystack');

// @route   POST api/bank/account
// @desc    Add or update a counselor's bank account
// @access  Private (Counselor only)
router.post('/account', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'Forbidden: Access is limited to counselors only.' });
  }

  const { bankName, accountNumber, accountName, bankCode, country } = req.body;

  try {
    let bankAccount = await BankAccount.findOne({ user: req.user.id });

    if (bankAccount) {
      // Update existing account
      bankAccount.bankName = bankName;
      bankAccount.accountNumber = accountNumber;
      bankAccount.accountName = accountName;
      bankAccount.bankCode = bankCode;
      bankAccount.country = country;
      bankAccount.isVerified = false; // Require re-verification on update
    } else {
      // Create new account
      bankAccount = new BankAccount({ user: req.user.id, ...req.body });
    }

    const resolvedAccount = await resolveAccountNumber({ accountNumber, bankCode });

    if (resolvedAccount.account_name.toLowerCase() !== accountName.toLowerCase()) {
      return res.status(400).json({ msg: 'Account name does not match the registered name with the bank.' });
    }

    bankAccount.accountName = resolvedAccount.account_name; // Use the verified name
    bankAccount.isVerified = true;

    await bankAccount.save();
    res.json(bankAccount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bank/account
// @desc    Get counselor's bank account
// @access  Private (Counselor only)
router.get('/account', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'Forbidden: Access is limited to counselors only.' });
  }

  try {
    const bankAccount = await BankAccount.findOne({ user: req.user.id });
    if (!bankAccount) {
      return res.status(404).json({ msg: 'No bank account found for this user.' });
    }
    res.json(bankAccount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/bank/withdraw
// @desc    Request a withdrawal
// @access  Private (Counselor only)
router.post('/withdraw', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'Forbidden: Access is limited to counselors only.' });
  }

  const { amount, currency } = req.body;

  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    const bankAccount = await BankAccount.findOne({ user: req.user.id });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ msg: 'Insufficient funds.' });
    }

    if (!bankAccount) {
      return res.status(400).json({ msg: 'No bank account set up. Please add a bank account first.' });
    }

    // Deduct from wallet balance immediately
    wallet.balance -= amount;
    await wallet.save();

    const recipientCode = await createTransferRecipient({
      name: bankAccount.accountName,
      accountNumber: bankAccount.accountNumber,
      bankCode: bankAccount.bankCode,
    });

    const transfer = await initiateTransfer({
      amount,
      recipient: recipientCode,
      reason: `Withdrawal for ${req.user.email}`,
    });

    const withdrawal = new Withdrawal({
      user: req.user.id,
      amount,
      currency,
      bankAccount: bankAccount._id,
      status: transfer.status, // Use status from Paystack
      transactionId: transfer.transfer_code,
    });

    await withdrawal.save();

    res.json({ msg: 'Withdrawal request submitted successfully.', withdrawal, newBalance: wallet.balance });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bank/withdrawals
// @desc    Get counselor's withdrawal history
// @access  Private (Counselor only)
router.get('/withdrawals', auth, async (req, res) => {
  if (req.user.role !== 'counselor') {
    return res.status(403).json({ msg: 'Forbidden: Access is limited to counselors only.' });
  }

  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
