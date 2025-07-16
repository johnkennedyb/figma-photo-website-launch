import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface Session {
  _id: string;
  client: { firstName: string; lastName: string; email: string };
  counselor: { firstName: string; lastName: string; email: string };
  date: string;
  time: string;
  price: number;
  currency: string;
  status: string;
}

const AdminSessionList: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const fetchSessions = async () => {
        setIsLoading(true);
        try {
          const response = await api.get('/api/admin/sessions', {
            headers: { 'x-auth-token': token },
          });
          setSessions(response.data);
        } catch (err: unknown) {
          let errorMessage = 'Failed to fetch sessions.';
          if (typeof err === 'object' && err !== null) {
            const apiError = err as { response?: { data?: { msg?: string } } };
            errorMessage = apiError.response?.data?.msg || 'Failed to fetch sessions.';
          }
          setError(errorMessage);
          toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };

      fetchSessions();
    }
  }, [token, toast]);

  const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'paid':
      case 'confirmed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading || authLoading) {
    return <div className="flex justify-center items-center h-screen">Loading sessions...</div>;
  }

  return (
    <AdminSidebarLayout activePath="/admin/sessions">
      <h1 className="text-3xl font-bold mb-6">Session Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Booked Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">Error: {error}</p>}
          
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Counselor</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length > 0 ? (
                  sessions.map((session) => {
                    let formattedDate = 'Invalid Date';
                    if (session.date) {
                      const date = new Date(session.date);
                      if (!isNaN(date.getTime())) {
                        formattedDate = format(date, 'PPp');
                      }
                    }
                    return (
                      <TableRow key={session._id}>
                        <TableCell>
                          <div className="font-medium">{session.client ? `${session.client.firstName} ${session.client.lastName}` : 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{session.client?.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{session.counselor ? `${session.counselor.firstName} ${session.counselor.lastName}` : 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{session.counselor?.email}</div>
                        </TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: session.currency.toUpperCase() }).format(session.price)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getStatusBadgeVariant(session.status)}>
                            {session.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No sessions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {sessions.length > 0 ? (
              sessions.map((session) => {
                let formattedDate = 'Invalid Date';
                if (session.date) {
                  const date = new Date(session.date);
                  if (!isNaN(date.getTime())) {
                    formattedDate = format(date, 'PPp');
                  }
                }
                return (
                  <Card key={session._id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold">{session.client?.name || 'N/A'}</h3>
                        <Badge variant={getStatusBadgeVariant(session.status)}>
                          {session.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{session.client?.email}</p>
                      <div className="border-t my-2"></div>
                      <p className="text-sm"><span className="font-medium">Counselor:</span> {session.counselor?.name || 'N/A'}</p>
                      <p className="text-sm"><span className="font-medium">Date:</span> {formattedDate}</p>
                      <p className="text-sm font-semibold text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: session.currency.toUpperCase() }).format(session.price)}</p>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-12">No sessions found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminSidebarLayout>
  );
};

export default AdminSessionList;
