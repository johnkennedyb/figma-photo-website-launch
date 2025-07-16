import React, { useEffect, useState } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Counselor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  isSuspended?: boolean;
  isVerified?: boolean;
  isVisible?: boolean;
}

const CounselorManagement: React.FC = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ location: '', specialization: '', experience: '' });
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCounselors = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams();
        if (filters.location) params.append('location', filters.location);
        if (filters.specialization) params.append('specialization', filters.specialization);
        if (filters.experience) params.append('experience', filters.experience);

        const response = await api.get(`/admin/counselors?${params.toString()}`, {
          headers: { 'x-auth-token': token },
        });
        setCounselors(response.data);
      } catch (err) {
        setError((err as Error).message);
        toast({ title: 'Error', description: 'Could not load counselors.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCounselors();
  }, [token, toast, filters]);

  const handleAction = async (counselorId: string, action: 'verify' | 'suspend' | 'toggleVisibility') => {
    const endpoints = {
      verify: `/admin/users/${counselorId}/verify`,
      suspend: `/admin/users/${counselorId}/suspend`,
      toggleVisibility: `/admin/counselors/${counselorId}/visibility`,
    };

    try {
      const response = await api.put(endpoints[action], {}, {
        headers: { 'x-auth-token': token },
      });
      const updatedCounselor = response.data;
      setCounselors(counselors.map(c => c._id === counselorId ? updatedCounselor : c));
      toast({ title: 'Success', description: `Counselor has been updated.` });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <AdminSidebarLayout activePath="/admin/counselors"><p>Loading counselors...</p></AdminSidebarLayout>;
  }

  if (error) {
    return <AdminSidebarLayout activePath="/admin/counselors"><p>Error: {error}</p></AdminSidebarLayout>;
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminSidebarLayout activePath="/admin/counselors">
      <Card>
        <CardHeader>
          <CardTitle>Counselor Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Input
              placeholder="Location (Country)"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
            <Input
              placeholder="Specialization"
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
            />
            <Input
              placeholder="Min Experience (Years)"
              type="number"
              value={filters.experience}
              onChange={(e) => handleFilterChange('experience', e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counselors.map((counselor) => (
                <TableRow key={counselor._id}>
                  <TableCell>{`${counselor.firstName} ${counselor.lastName}`}</TableCell>
                  <TableCell>{counselor.email}</TableCell>
                  <TableCell>{new Date(counselor.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {counselor.isVerified ? 'Verified' : 'Pending'}
                    {counselor.isSuspended && <span className="text-red-500 ml-2">Suspended</span>}
                  </TableCell>
                  <TableCell>{counselor.isVisible ? 'Visible' : 'Hidden'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!counselor.isVerified && (
                          <DropdownMenuItem onClick={() => handleAction(counselor._id, 'verify')}>
                            Approve
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleAction(counselor._id, 'suspend')}>
                          {counselor.isSuspended ? 'Un-suspend' : 'Suspend'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(counselor._id, 'toggleVisibility')}>
                          {counselor.isVisible ? 'Hide' : 'Show'}
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
    </AdminSidebarLayout>
  );
};

export default CounselorManagement;
