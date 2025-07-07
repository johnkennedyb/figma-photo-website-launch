const Paystack = require('paystack-api');
const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

/**
 * Verifies a bank account with Paystack.
 * @param {string} accountNumber - The account number.
 * @param {string} bankCode - The Paystack bank code.
 * @returns {Promise<object>} The resolved account details from Paystack.
 */
const resolveAccountNumber = async ({ accountNumber, bankCode }) => {
  try {
    const response = await paystack.verification.resolveAccount({
      account_number: accountNumber,
      bank_code: bankCode,
    });
    if (!response.status) {
      throw new Error(response.message || 'Failed to resolve account.');
    }
    return response.data;
  } catch (error) {
    console.error('Paystack account resolution error:', error.message);
    throw new Error(error.message || 'Could not verify bank account with Paystack.');
  }
};

/**
 * Creates a transfer recipient on Paystack.
 * @param {object} details - The recipient details.
 * @param {string} details.name - The account holder's name.
 * @param {string} details.accountNumber - The account number.
 * @param {string} details.bankCode - The Paystack bank code.
 * @returns {Promise<string>} The recipient code from Paystack.
 */
const createTransferRecipient = async ({ name, accountNumber, bankCode }) => {
  try {
    const response = await paystack.transfer_recipient.create({
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    });
    if (!response.status) {
      throw new Error(response.message || 'Failed to create transfer recipient.');
    }
    return response.data.recipient_code;
  } catch (error) {
    console.error('Paystack create recipient error:', error.message);
    throw new Error(error.message || 'Could not create transfer recipient with Paystack.');
  }
};

/**
 * Initiates a transfer to a recipient.
 * @param {object} details - The transfer details.
 * @param {number} details.amount - The amount to transfer in kobo.
 * @param {string} details.recipient - The recipient code.
 * @param {string} details.reason - The reason for the transfer.
 * @returns {Promise<object>} The transfer data from Paystack.
 */
const initiateTransfer = async ({ amount, recipient, reason }) => {
  try {
    const response = await paystack.transfer.initiate({
      source: 'balance',
      amount: amount * 100, // Convert to kobo
      recipient,
      reason,
    });
    if (!response.status) {
      throw new Error(response.message || 'Failed to initiate transfer.');
    }
    return response.data;
  } catch (error) {
    console.error('Paystack initiate transfer error:', error.message);
    throw new Error(error.message || 'Could not initiate transfer with Paystack.');
  }
};

module.exports = {
  resolveAccountNumber,
  createTransferRecipient,
  initiateTransfer,
};
