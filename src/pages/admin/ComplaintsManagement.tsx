import React, { useEffect, useState } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Complaint {
  _id: string;
  reporter: { name: string; email: string };
  reportedUser: { name: string; email: string };
  reason: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: string;
}

const ComplaintsManagement: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!token) return;
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiUrl}/api/admin/complaints`, {
          headers: { 'x-auth-token': token },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch complaints');
        }
        const data = await response.json();
        setComplaints(data);
      } catch (err) {
        setError((err as Error).message);
        toast({ title: 'Error', description: 'Could not load complaints.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, [token, toast]);

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/admin/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token!,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to update status');
      }

      const updatedComplaint = await response.json();
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? updatedComplaint : c))
      );
      toast({ title: 'Success', description: 'Complaint status updated.' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'default';
      case 'dismissed':
        return 'destructive';
      case 'pending':
      case 'under_review':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <AdminSidebarLayout activePath="/admin/complaints">
      <Card>
        <CardHeader>
          <CardTitle>Complaints Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading complaints...</p>}
          {error && <p className="text-red-500">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporter</TableHead>
                <TableHead>Reported User</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint._id}>
                  <TableCell>{complaint.reporter?.name || 'N/A'}</TableCell>
                  <TableCell>{complaint.reportedUser?.name || 'N/A'}</TableCell>
                  <TableCell>{complaint.reason}</TableCell>
                  <TableCell>{new Date(complaint.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(complaint.status)}>{complaint.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={complaint.status}
                      onValueChange={(newStatus) => handleStatusChange(complaint._id, newStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Update status" />
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminSidebarLayout>
  );
};

export default ComplaintsManagement;
