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
  client: { _id: string; firstName: string; lastName: string; };
  counselor: { _id: string; firstName: string; lastName: string; };
  date: string;
  duration: number;
  price: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
}

const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const fetchSessions = useCallback(async (status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = status === 'all' ? '/admin/sessions' : `/admin/sessions?status=${status}`;
      const response = await api.get(url);
      setSessions(response.data);
    } catch (err: unknown) {
      const errorMessage = 'Could not load sessions.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions(filter);
  }, [filter, fetchSessions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminSidebarLayout activePath="/admin/sessions">
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
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
                  <TableHead>Client</TableHead>
                  <TableHead>Counselor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow key={session._id}>
                      <TableCell>{`${session.client.firstName} ${session.client.lastName}`}</TableCell>
                      <TableCell>{`${session.counselor.firstName} ${session.counselor.lastName}`}</TableCell>
                      <TableCell>{format(new Date(session.date), 'PPpp')}</TableCell>
                      <TableCell>{session.duration} mins</TableCell>
                      <TableCell>₦{session.price.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No sessions found.
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

export default SessionManagement;
