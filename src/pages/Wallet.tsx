import React, { useState, useEffect, useCallback } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { usePaystackPayment } from 'react-paystack';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import AddBankAccountModal from '@/components/AddBankAccountModal';
import { PlusCircle, Trash2 } from 'lucide-react';

interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

interface BankAccount {
  _id: string;
  accountType: 'local' | 'international';
  accountName: string;
  bankName?: string;
  accountNumber?: string;
  country: string;
  iban?: string;
  swiftBic?: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
  currency: 'USD' | 'NGN';
}

const Wallet: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData>({ balance: 0, transactions: [], currency: 'USD' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const fetchWalletData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/wallet');
      if (res.data && typeof res.data.balance === 'number' && Array.isArray(res.data.transactions)) {
        setWalletData(res.data);
      } else {
        throw new Error('Invalid wallet data format');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || 'Failed to fetch wallet data.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    if (user?.role !== 'counselor') return;
    try {
      const res = await api.get('/wallet/bank-accounts');
      setBankAccounts(res.data);
    } catch (err) {
      toast.error('Failed to fetch bank accounts.');
    }
  }, [user?.role]);

  useEffect(() => {
    fetchWalletData();
    fetchBankAccounts();
  }, [fetchWalletData, fetchBankAccounts]);

  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: user?.email || '',
    amount: depositAmount * 100, // Amount in kobo/cents
    currency: walletData.currency,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handlePaymentSuccess = async (reference: any) => {
    try {
      await api.post('/wallet/deposit', {
        reference: reference.reference,
        amount: depositAmount,
      });
      toast.success('Deposit successful!');
      fetchWalletData(); // Re-fetch all wallet data for consistency
    } catch (err: any) { 
      toast.error(err.response?.data?.msg || 'Failed to verify payment.');
    } finally {
      setIsDepositDialogOpen(false);
      setDepositAmount(0);
    }
  };

  const handlePaymentClose = () => {
    toast.info('Payment window closed.');
  };

  const handleWithdraw = async () => {
    if (withdrawalAmount <= 0) {
      return toast.error('Please enter a valid amount.');
    }
    if (!selectedAccount) {
      return toast.error('Please select a bank account.');
    }
    try {
      setIsLoading(true);
      const res = await api.post('/wallet/withdraw', {
        amount: withdrawalAmount,
        bankAccountId: selectedAccount,
      });
      toast.success(res.data.msg || 'Withdrawal request successful!');
      fetchWalletData(); // Refresh wallet balance
      setIsWithdrawOpen(false);
      setWithdrawalAmount(0);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Withdrawal failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await api.delete(`/wallet/bank-accounts/${accountId}`);
      toast.success('Bank account removed successfully.');
      fetchBankAccounts(); // Refresh the list
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to remove bank account.');
    }
  };

  const handleDeposit = () => {
    if (depositAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    initializePayment({ onSuccess: handlePaymentSuccess, onClose: handlePaymentClose });
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'NGN') => {
    const locale = currency === 'NGN' ? 'en-NG' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <SidebarLayout activePath="/wallet">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout activePath="/wallet">
        <div className="p-4 md:p-6 text-red-500">
          Error: {error}
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout activePath="/wallet">
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-6">My Wallet</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(walletData.balance, walletData.currency)}</p>
                <div className="flex gap-2 mt-4">
                  <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex-1">Add Funds</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Funds to Wallet</DialogTitle>
                        <DialogDescription>
                          Enter the amount in {walletData.currency} you want to deposit.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="amount" className="text-right">
                            Amount ({walletData.currency})
                          </Label>
                          <Input
                            id="amount"
                            type="number"
                            value={depositAmount || ''}
                            onChange={(e) => setDepositAmount(Number(e.target.value))}
                            className="col-span-3"
                            placeholder="e.g., 50"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleDeposit}>Proceed to Payment</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  {user?.role === 'counselor' && (
                     <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1">Withdraw</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Withdraw Funds</DialogTitle>
                          <DialogDescription>Enter amount and select account.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Input
                            type="number"
                            placeholder={`Amount (${walletData.currency})`}
                            value={withdrawalAmount || ''}
                            onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                          />
                          <Select onValueChange={setSelectedAccount} value={selectedAccount}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Bank Account" />
                            </SelectTrigger>
                            <SelectContent>
                              {bankAccounts.map(acc => (
                                <SelectItem key={acc._id} value={acc._id}>
                                  {acc.bankName} - {acc.accountNumber?.slice(-4)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleWithdraw} disabled={isLoading}>Request Withdrawal</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>
          {user?.role === 'counselor' && (
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Bank Accounts</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setIsAddAccountOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bankAccounts.length > 0 ? (
                      bankAccounts.map(acc => (
                        <div key={acc._id} className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                          <div>
                            <p className="font-medium">{acc.accountName}</p>
                            <p className="text-sm text-gray-500">{acc.bankName} - ****{acc.accountNumber?.slice(-4)} ({acc.accountType})</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(acc._id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-4">No bank accounts added.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {walletData.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {walletData.transactions.map((tx) => (
                      <div key={tx._id} className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-gray-500">{format(new Date(tx.date), 'PP')}</p>
                        </div>
                        <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount, walletData.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No transactions yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AddBankAccountModal 
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAccountAdded={fetchBankAccounts}
      />
    </SidebarLayout>
  );
};

export default Wallet;
