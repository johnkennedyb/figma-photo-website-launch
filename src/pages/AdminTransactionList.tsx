import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { format } from 'date-fns';

// The backend returns Session objects for transactions
interface Transaction {
  _id: string;
  client: { name: string; email: string };
  counselor: { name: string; email: string };
  date: string;
  price: number;
  currency: string;
  status: 'pending_payment' | 'paid' | 'completed' | 'canceled' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action';
}

const AdminTransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { token, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast({ title: 'Access Denied', description: 'You do not have permission to view this page.', variant: 'destructive' });
      navigate('/admin/login');
    }
  }, [user, authLoading, navigate, toast]);

  useEffect(() => {
    if (token) {
      const fetchTransactions = async () => {
        setLoading(true);
        try {
          const response = await api.get('/admin/transactions', {
            headers: { 'x-auth-token': token },
          });
          setTransactions(response.data);
        } catch (err: unknown) {
          let errorMessage = 'Failed to fetch transactions.';
          if (typeof err === 'object' && err !== null) {
            const apiError = err as { response?: { data?: { msg?: string } } };
            errorMessage = apiError.response?.data?.msg || 'Failed to fetch transactions.';
          }
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      fetchTransactions();
    }
  }, [token]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => 
      statusFilter === 'all' || transaction.status === statusFilter
    );
  }, [transactions, statusFilter]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid': 
        return 'default'; // Green for success
      case 'pending_payment':
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'secondary'; // Yellow for pending
      case 'canceled': 
        return 'destructive'; // Red for canceled
      default: 
        return 'outline';
    }
  };

  if (loading || authLoading) {
    return <div className="flex justify-center items-center h-screen">Loading transactions...</div>;
  }

  return (
    <AdminSidebarLayout activePath="/admin/transactions">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction Log</CardTitle>
            <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="requires_action">Requires Action</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">Error: {error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Counselor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                let formattedDate = 'Invalid Date';
                if (transaction.date) {
                  const date = new Date(transaction.date);
                  if (!isNaN(date.getTime())) {
                    formattedDate = format(date, 'PPp');
                  }
                }
                return (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      <div className="font-medium">{transaction.client?.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{transaction.client?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{transaction.counselor?.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{transaction.counselor?.email}</div>
                    </TableCell>
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency.toUpperCase() }).format(transaction.price)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(transaction.status)}>
                        {transaction.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminSidebarLayout>
  );
};

export default AdminTransactionList;
