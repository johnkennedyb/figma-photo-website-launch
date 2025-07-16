import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserInfo {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Complaint {
  _id: string;
  reporter: UserInfo;
  reportedUser: UserInfo;
  reason: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: string;
}

const ComplaintsManagement: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const fetchComplaints = useCallback(async (status: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = status === 'all' ? '/admin/complaints' : `/admin/complaints?status=${status}`;
      const response = await api.get(url);
      setComplaints(response.data);
    } catch (err: unknown) {
      const errorMessage = 'Could not load complaints.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchComplaints(filter);
  }, [filter, fetchComplaints]);

  const handleStatusChange = async (complaintId: string, newStatus: Complaint['status']) => {
    try {
      const response = await api.put(`/admin/complaints/${complaintId}/status`, { status: newStatus });
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? response.data : c))
      );
      toast({ title: 'Success', description: 'Complaint status updated.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.msg || 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: Complaint['status']) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-500">Under Review</Badge>;
      case 'dismissed':
        return <Badge variant="destructive">Dismissed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminSidebarLayout activePath="/admin/complaints">
      <Card>
        <CardHeader>
          <CardTitle>Complaints Management</CardTitle>
        </CardHeader>
        <CardContent>
           <Tabs value={filter} onValueChange={setFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="under_review">Under Review</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
               <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
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
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.length > 0 ? (
                  complaints.map((complaint) => (
                    <TableRow key={complaint._id}>
                      <TableCell>{`${complaint.reporter?.firstName} ${complaint.reporter?.lastName}`}</TableCell>
                      <TableCell>{`${complaint.reportedUser?.firstName} ${complaint.reportedUser?.lastName}`}</TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.reason}</TableCell>
                      <TableCell>{format(new Date(complaint.createdAt), 'PP')}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={complaint.status}
                          onValueChange={(newStatus: Complaint['status']) => handleStatusChange(complaint._id, newStatus)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Update..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No complaints found.
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

export default ComplaintsManagement;
