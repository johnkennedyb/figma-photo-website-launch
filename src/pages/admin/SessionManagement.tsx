import React, { useEffect, useState } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Session {
  _id: string;
  client: { name: string };
  counselor: { name: string };
  date: string;
  price: number;
  currency: string;
  status: string;
}

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiUrl}/api/admin/sessions`, {
          headers: { 'x-auth-token': token },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Failed to fetch sessions');
        }
        const data = await response.json();
        setSessions(data);
      } catch (err) {
        setError((err as Error).message);
        toast({ title: 'Error', description: 'Could not load sessions.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [token, toast]);

  const getStatusBadgeVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'canceled':
        return 'destructive';
      case 'paid':
      case 'upcoming':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return <AdminSidebarLayout activePath="/admin/sessions"><p>Loading sessions...</p></AdminSidebarLayout>;
  }

  if (error) {
    return <AdminSidebarLayout activePath="/admin/sessions"><p>Error: {error}</p></AdminSidebarLayout>;
  }

  return (
    <AdminSidebarLayout activePath="/admin/sessions">
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
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
              {sessions.map((session) => (
                <TableRow key={session._id}>
                  <TableCell>{session.client?.name || 'N/A'}</TableCell>
                  <TableCell>{session.counselor?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(session.date).toLocaleString()}</TableCell>
                  <TableCell>{`${session.price} ${session.currency.toUpperCase()}`}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(session.status)}>{session.status}</Badge>
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

export default SessionManagement;
