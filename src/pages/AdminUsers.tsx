import React, { useEffect, useState } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Counselor {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  isVerified: boolean;
  isSuspended?: boolean;
}

const AdminUsers: React.FC = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<Counselor | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCounselors = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await api.get('/admin/users?role=counselor', {
          headers: { 'x-auth-token': token },
        });
        setCounselors(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.msg || 'Could not load counselors.';
        setError(errorMessage);
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCounselors();
  }, [token, toast]);

  const apiAction = async (url: string, method: 'put' | 'delete', successMessage: string) => {
    if (!token) return null;
    try {
      const response = await api[method](url, {},
        {
          headers: { 'x-auth-token': token },
        });
      toast({ title: 'Success', description: successMessage });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || `An error occurred.`;
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    }
  };

  const handleApprove = async (counselorId: string) => {
    const updatedCounselor = await apiAction(`/admin/users/${counselorId}/verify`, 'put', 'Counselor has been approved.');
    if (updatedCounselor) {
      setCounselors(counselors.map(c => c._id === counselorId ? { ...c, isVerified: true } : c));
    }
  };

  const handleSuspend = async (counselorId: string, isSuspended: boolean) => {
    const successMessage = isSuspended ? 'Counselor has been un-suspended.' : 'Counselor has been suspended.';
    const updatedCounselor = await apiAction(`/admin/users/${counselorId}/suspend`, 'put', successMessage);
    if (updatedCounselor) {
      setCounselors(counselors.map(c => c._id === counselorId ? { ...c, isSuspended: !c.isSuspended } : c));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    const result = await apiAction(`/admin/users/${userToDelete._id}`, 'delete', 'Counselor has been deleted.');
    if (result) {
      setCounselors(counselors.filter(c => c._id !== userToDelete._id));
    }
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (isLoading) return <AdminSidebarLayout activePath="/admin/users"><div className="flex justify-center items-center h-screen">Loading counselors...</div></AdminSidebarLayout>;
  if (error) return <AdminSidebarLayout activePath="/admin/users"><div className="text-red-500 text-center mt-10">Error: {error}</div></AdminSidebarLayout>;

  return (
    <AdminSidebarLayout activePath="/admin/users">
      <Card>
        <CardHeader>
          <CardTitle>Counselor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counselors.length > 0 ? (
                counselors.map((counselor) => {
                  let formattedDate = 'Invalid Date';
                  if (counselor.createdAt) {
                    const date = new Date(counselor.createdAt);
                    if (!isNaN(date.getTime())) {
                      formattedDate = format(date, 'PP');
                    }
                  }
                  return (
                    <TableRow key={counselor._id}>
                      <TableCell className="font-medium">{counselor.name}</TableCell>
                      <TableCell>{counselor.email}</TableCell>
                      <TableCell>{formattedDate}</TableCell>
                      <TableCell>
                        <Badge variant={counselor.isVerified ? 'default' : 'secondary'} className={counselor.isVerified ? 'bg-green-500' : ''}>
                          {counselor.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={counselor.isSuspended ? 'destructive' : 'outline'}>
                          {counselor.isSuspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!counselor.isVerified && (
                              <DropdownMenuItem onClick={() => handleApprove(counselor._id)}>Approve</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleSuspend(counselor._id, !!counselor.isSuspended)}>
                              {counselor.isSuspended ? 'Un-suspend' : 'Suspend'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setUserToDelete(counselor); setIsDeleteDialogOpen(true); }} className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No counselors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account for {userToDelete?.name} and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSidebarLayout>
  );
};

export default AdminUsers;
