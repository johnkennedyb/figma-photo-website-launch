import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

const Wallet: React.FC = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!token) return;
      try {
        const res = await api.get('/wallet', {
          headers: { 'x-auth-token': token },
        });
        setWalletData(res.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch wallet data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, [token, toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
                {isLoading ? (
                  <p>Loading...</p>
                ) : (
                  <p className="text-3xl font-bold">{formatCurrency(walletData?.balance ?? 0)}</p>
                )}
                <Button className="mt-4 w-full">Add Funds</Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading transactions...</p>
                ) : walletData?.transactions?.length ? (
                  <div className="space-y-4">
                    {walletData.transactions.map((tx) => (
                      <div key={tx._id} className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                        </div>
                        <p className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No transactions yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Wallet;
