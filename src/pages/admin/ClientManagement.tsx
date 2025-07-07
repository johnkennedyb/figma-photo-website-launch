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

interface Client {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  isSuspended?: boolean;
}

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchClients = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiUrl}/api/admin/users?role=client`, {
          headers: { 'x-auth-token': token },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Failed to fetch clients');
        }
        const data = await response.json();
        setClients(data);
      } catch (err) {
        setError((err as Error).message);
        toast({ title: 'Error', description: 'Could not load clients.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, [token, toast]);

  const apiAction = async (url: string, method: string, successMessage: string, errorMessage: string) => {
    if (!token) return null;
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}${url}`, {
        method,
        headers: { 'x-auth-token': token },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || errorMessage);
      }
      toast({ title: 'Success', description: successMessage });
      return await response.json();
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
      return null;
    }
  };

  const handleSuspend = async (clientId: string, isSuspended: boolean) => {
    const successMessage = isSuspended ? 'Client has been un-suspended.' : 'Client has been suspended.';
    const errorMessage = 'Failed to update suspension status.';
    const updatedClient = await apiAction(`/api/admin/users/${clientId}/suspend`, 'PUT', successMessage, errorMessage);
    if (updatedClient) {
      setClients(clients.map(c => c._id === clientId ? { ...c, isSuspended: !c.isSuspended } : c));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    const result = await apiAction(`/api/admin/users/${userToDelete._id}`, 'DELETE', 'Client has been deleted.', 'Failed to delete client.');
    if (result) {
      setClients(clients.filter(c => c._id !== userToDelete._id));
    }
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (isLoading) {
    return <AdminSidebarLayout activePath="/admin/clients"><p>Loading clients...</p></AdminSidebarLayout>;
  }

  if (error) {
    return <AdminSidebarLayout activePath="/admin/clients"><p>Error: {error}</p></AdminSidebarLayout>;
  }

  return (
    <AdminSidebarLayout activePath="/admin/clients">
      <Card>
        <CardHeader>
          <CardTitle>Client Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client._id}>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{new Date(client.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{client.isSuspended ? 'Suspended' : 'Active'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSuspend(client._id, !!client.isSuspended)}>
                          {client.isSuspended ? 'Un-suspend' : 'Suspend'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setUserToDelete(client); setIsDeleteDialogOpen(true); }} className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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

export default ClientManagement;
