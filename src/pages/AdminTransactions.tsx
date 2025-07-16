import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Session {
  _id: string;
  client: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  counselor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  price: number;
  status: 'paid' | 'completed' | 'canceled';
  date: string;
  notes?: string;
}

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const fetchTransactions = useCallback(async (status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = status === 'all' ? '/admin/transactions' : `/admin/transactions?status=${status}`;
      const response = await api.get(url);
      setTransactions(response.data);
    } catch (err: unknown) {
      const errorMessage = 'Could not load transactions.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTransactions(filter);
  }, [filter, fetchTransactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminSidebarLayout activePath="/admin/transactions">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
             <div className="text-red-500 p-4">Error: {error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>{`${tx.client?.firstName || ''} ${tx.client?.lastName || ''}`}</TableCell>
                      <TableCell><Badge variant="outline">Session Payment</Badge></TableCell>
                      <TableCell>₦{tx.price?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>{format(new Date(tx.date), 'PPpp')}</TableCell>
                      <TableCell>{`Session with ${tx.counselor?.firstName || ''} ${tx.counselor?.lastName || ''}`}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminSidebarLayout>
  );
};

export default AdminTransactions;
