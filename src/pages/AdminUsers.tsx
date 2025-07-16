import React, { useEffect, useState, useCallback } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import SetRateModal from '@/components/SetRateModal';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client' | 'counselor';
  createdAt: string;
  isVerified: boolean;
  isSuspended?: boolean;
}

const AdminUsers: React.FC = () => {
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const { toast } = useToast();

  const fetchUsers = useCallback(async (role: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = role === 'all' ? '/admin/users' : `/admin/users?role=${role}`;
      const response = await api.get(url);
      setUsers(response.data);
    } catch (err: unknown) {
      const errorMessage = 'Could not load users.';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers(roleFilter);
  }, [roleFilter, fetchUsers]);

  const apiAction = async (url: string, method: 'put' | 'delete', successMessage: string) => {
    try {
      const response = await api[method](url);
      toast({ title: 'Success', description: successMessage });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || `An error occurred.`;
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    }
  };

  const handleApprove = async (userId: string) => {
    const updatedUser = await apiAction(`/admin/users/${userId}/verify`, 'put', 'Counselor has been approved.');
    if (updatedUser) {
      setUsers(users.map(u => u._id === userId ? { ...u, isVerified: true } : u));
    }
  };

  const handleSetRate = (counselor: User) => {
    setSelectedCounselor(counselor);
    setRateModalOpen(true);
  };

  const submitRate = async (usdRate: number | null, ngnRate: number | null) => {
    if (!selectedCounselor) return;
    setRateSubmitting(true);
    try {
      await api.put(`/admin/counselors/${selectedCounselor._id}/rate`, {
        sessionRate: usdRate ?? undefined,
        ngnSessionRate: ngnRate ?? undefined,
      });
      toast({ title: 'Success', description: 'Session rates updated.' });
      // refresh list
      fetchUsers(roleFilter);
    } catch (err: any) {
      const msg = err.response?.data?.msg || 'Failed to update rates.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setRateSubmitting(false);
      setRateModalOpen(false);
      setSelectedCounselor(null);
    }
  };

  const handleSuspend = async (userId: string, isSuspended: boolean) => {
    const successMessage = isSuspended ? 'User has been un-suspended.' : 'User has been suspended.';
    const updatedUser = await apiAction(`/admin/users/${userId}/suspend`, 'put', successMessage);
    if (updatedUser) {
      setUsers(users.map(u => u._id === userId ? { ...u, isSuspended: !u.isSuspended } : u));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    const result = await apiAction(`/admin/users/${userToDelete._id}`, 'delete', 'User has been deleted.');
    if (result) {
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <AdminSidebarLayout activePath="/admin/users">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={roleFilter} onValueChange={setRoleFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="counselor">Counselors</TabsTrigger>
              <TabsTrigger value="client">Clients</TabsTrigger>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                      <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'PP') : 'N/A'}</TableCell>
                      <TableCell>
                        {user.role === 'counselor' && (
                           <Badge variant={user.isVerified ? 'default' : 'secondary'} className={user.isVerified ? 'bg-green-500' : ''}>
                           {user.isVerified ? 'Verified' : 'Pending'}
                         </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isSuspended ? 'destructive' : 'outline'}>
                          {user.isSuspended ? 'Suspended' : 'Active'}
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
                            {user.role === 'counselor' && !user.isVerified && (
                              <DropdownMenuItem onClick={() => handleApprove(user._id)}>Approve</DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => handleSuspend(user._id, !!user.isSuspended)}>
                              {user.isSuspended ? 'Un-suspend' : 'Suspend'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setUserToDelete(user); setIsDeleteDialogOpen(true); }} className="text-red-600">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No users found for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the account for {userToDelete?.firstName} {userToDelete?.lastName} and remove their data from our servers.
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
    <SetRateModal
        isOpen={rateModalOpen}
        onClose={() => { setRateModalOpen(false); setSelectedCounselor(null); }}
        onSubmit={submitRate}
        isSubmitting={rateSubmitting}
        initialUsd={selectedCounselor?.sessionRate as number | undefined}
        initialNgn={(selectedCounselor as any)?.ngnSessionRate}
      />
    </AdminSidebarLayout>
  );
};

export default AdminUsers;
