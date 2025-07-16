
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

// List of Nigerian banks for the dropdown. Keeping as a constant avoids hard-coding in JSX.
const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank',
  'Ecobank',
  'Fidelity Bank',
  'First Bank',
  'First City Monument Bank',
  'Globus Bank',
  'GTBank',
  'Heritage Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Opay',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'Union Bank',
  'UBA',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
];

interface BankAccount {
  _id?: string; // comes from backend after save
  accountType: 'local' | 'international';
  accountName: string;
  accountNumber: string;
  bankName: string;
  country: string;
  iban?: string;
  swiftBic?: string;
}

interface Withdrawal {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

const CounselorWallet: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('withdraw');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [balance, setBalance] = useState(0);
  const [bankDetails, setBankDetails] = useState<BankAccount>({
    accountType: 'local',
    accountName: '',
    accountNumber: '',
    bankName: '',
    country: 'NG',
  });
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');

  const fetchBankDetails = useCallback(async () => {
    try {
      const { data } = await api.get('/wallet/bank-accounts');
      if (data && data.length > 0) {
        // Assuming the counselor has only one bank account for simplicity
        setBankDetails(data[0]);
      }
    } catch (error) {
      // It's okay if this fails (e.g., 404), it just means no bank details are saved yet.
      console.error('Could not fetch bank details, maybe none are set up.', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/wallet');
        setBalance(data.balance || 0);

        const withdrawalHistory = data.transactions
          .filter((tx: any) => tx.type === 'debit')
          .map((tx: any) => ({ ...tx, createdAt: tx.date }));

        setWithdrawals(withdrawalHistory);

        // After fetching wallet, get bank details
        await fetchBankDetails();

      } catch (error: unknown) {
        let errorMessage = 'An unexpected error occurred while fetching wallet data.';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const apiError = error as { response?: { data?: { msg?: string } } };
          errorMessage = apiError.response?.data?.msg || errorMessage;
        }
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        console.error('Generic fetch data error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, toast, fetchBankDetails]);

  const handleBankDetailsChange = (e: React.ChangeEvent<HTMLInputElement> | string, field: keyof BankAccount) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setBankDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBankDetails = async () => {
    setIsSaving(true);
    try {
      // There's no PUT, so we just POST. The backend should handle conflicts if necessary.
      const { data } = await api.post('/wallet/bank-accounts', bankDetails);
      setBankDetails(data);
      toast({ title: 'Success', description: 'Bank details saved successfully' });
      setActiveTab('withdraw');
    } catch (error: unknown) {
      let errorMessage = 'Failed to save bank details';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWithdrawal = async () => {
    if (parseFloat(withdrawalAmount) <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a valid amount.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await api.post('/wallet/withdraw', {
        amount: parseFloat(withdrawalAmount),
        bankAccountId: bankDetails._id,
      });
      setBalance(data.newBalance);
      setWithdrawals([data.withdrawal, ...withdrawals]);
      setWithdrawalAmount('');
      toast({ title: 'Success', description: 'Withdrawal request submitted!' });
    } catch (error: unknown) {
      let errorMessage = 'Withdrawal failed';
      if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <CounselorSidebarLayout activePath="/counselor/wallet">
        <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </CounselorSidebarLayout>
    );
  }

  return (
    <CounselorSidebarLayout activePath="/counselor/wallet">
      <div className="dashboard-background min-h-screen p-6">
        <h1 className="text-2xl font-semibold mb-8 text-white">Wallet</h1>
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('withdraw')} className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'withdraw' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>Withdraw</button>
            <button onClick={() => setActiveTab('bank-details')} className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'bank-details' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>Bank Details</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'history' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-600 hover:bg-gray-50'}`}>History</button>
          </div>
          <div className="p-6">
            {activeTab === 'bank-details' && (
              <div className="space-y-4 max-w-md mx-auto">
                {/* <h2 className="text-lg font-semibold text-gray-800">Your Bank Account</h2> */}
                <div><Label>Account Name</Label><Input name="accountName" value={bankDetails.accountName} onChange={(e) => handleBankDetailsChange(e, 'accountName')} placeholder="e.g., John Doe" /></div>
                <div><Label>Account Number</Label><Input name="accountNumber" value={bankDetails.accountNumber} onChange={(e) => handleBankDetailsChange(e, 'accountNumber')} placeholder="e.g., 0123456789" /></div>
                <div><Label>Bank Name</Label><Select onValueChange={(value) => handleBankDetailsChange(value, 'bankName')} value={bankDetails.bankName}><SelectTrigger><SelectValue placeholder="Select Bank" /></SelectTrigger><SelectContent>
  {NIGERIAN_BANKS.map(bank => (
    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
  ))}
</SelectContent></Select></div>
                <div><Label>Country</Label><Select onValueChange={(value) => handleBankDetailsChange(value, 'country')} value={bankDetails.country}><SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger><SelectContent><SelectItem value="NG">Nigeria</SelectItem><SelectItem value="US">United States</SelectItem></SelectContent></Select></div>
                <Button onClick={handleSaveBankDetails} className="w-full bg-teal-600 hover:bg-teal-700" disabled={isSaving}>{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Bank Details'}</Button>
              </div>
            )}
            {activeTab === 'withdraw' && (
              <div className="space-y-6 max-w-md mx-auto">
                <div className="text-center p-4 border rounded-lg bg-gray-50"><div className="text-sm text-gray-600">Available Balance</div><div className="text-3xl font-bold text-teal-600">₦{balance.toLocaleString()}</div></div>
                <div><Label htmlFor='amount'>Amount to Withdraw (NGN)</Label><Input id='amount' name="amount" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} placeholder="e.g., 5000" type="number" /></div>
                <Button onClick={handleWithdrawal} className="w-full bg-teal-600 hover:bg-teal-700" disabled={isSaving || !withdrawalAmount}>{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Request Withdrawal'}</Button>
              </div>
            )}
            {activeTab === 'history' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Withdrawal History</h2>
                <div className="space-y-3">
                  {withdrawals.length > 0 ? withdrawals.map(w => (
                    <div key={w._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border">
                      <div>
                        <p className="font-medium">₦{w.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{new Date(w.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${w.status === 'completed' ? 'bg-green-100 text-green-800' : w.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {w.status}
                      </span>
                    </div>
                  )) : <p className="text-center text-gray-500 py-4">No withdrawal history.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CounselorSidebarLayout>
  );
};

export default CounselorWallet;
