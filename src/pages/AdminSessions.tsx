import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';

interface Session {
  _id: string;
  client: { _id: string; firstName: string; lastName: string; email: string };
  counselor: { _id: string; firstName: string; lastName: string; email: string };
  date: string;
  sessionType: 'video' | 'chat';
  status: 'pending_payment' | 'paid' | 'completed' | 'canceled';
  price: number;
}

const AdminSessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();
  const { token, user: authUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!authUser || authUser.role !== 'admin')) {
      toast({ title: 'Access Denied', description: 'You do not have permission to view this page.', variant: 'destructive' });
      navigate('/admin/login');
    }
  }, [authUser, authLoading, navigate, toast]);

  useEffect(() => {
    if (token) {
      const fetchSessions = async () => {
        try {
          const apiUrl = import.meta.env.VITE_API_BASE_URL;
          const response = await fetch(`${apiUrl}/api/admin/sessions`, {
            headers: { 'x-auth-token': token },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || 'Failed to fetch sessions.');
          }
          const data: Session[] = await response.json();
          setSessions(data);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSessions();
    }
  }, [token]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => 
      statusFilter === 'all' || session.status === statusFilter
    );
  }, [sessions, statusFilter]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'paid': return 'secondary';
      case 'pending_payment': return 'destructive';
      case 'canceled': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading || authLoading) {
    return <div className="flex justify-center items-center h-screen">Loading sessions...</div>;
  }

  return (
    <AdminSidebarLayout activePath="/admin/sessions">
      <h1 className="text-3xl font-bold mb-6">Session Management</h1>

      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>All Sessions ({filteredSessions.length})</CardTitle>
          <div className="flex items-center space-x-4 mt-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="paid">Paid (Upcoming)</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Counselor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map(session => (
                <TableRow key={session._id}>
                  <TableCell className="font-medium">{session.client ? `${session.client.firstName} ${session.client.lastName}` : 'N/A'}</TableCell>
                  <TableCell>{session.counselor ? `${session.counselor.firstName} ${session.counselor.lastName}` : 'N/A'}</TableCell>
                  <TableCell>{new Date(session.date).toLocaleString()}</TableCell>
                  <TableCell>${session.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(session.status)}>
                      {session.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminSidebarLayout>
  );
};

export default AdminSessions;
