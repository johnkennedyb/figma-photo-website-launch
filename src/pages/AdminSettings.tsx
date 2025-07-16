import React, { useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import SetRateModal from '@/components/SetRateModal';

interface Counselor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  sessionRate?: number;
  ngnSessionRate?: number;
}

const AdminSettings: React.FC = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // rate modal state
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isSubmittingRate, setIsSubmittingRate] = useState(false);

  const fetchCounselors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/users?role=counselor');
      setCounselors(res.data);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to fetch counselors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  const handleOpenRateModal = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    setIsRateModalOpen(true);
  };

  const handleSaveRate = async (usd: number | null, ngn: number | null) => {
    if (!selectedCounselor) return;
    setIsSubmittingRate(true);
    try {
      await api.put(`/admin/counselors/${selectedCounselor._id}/rate`, { usdRate: usd, ngnRate: ngn });
      setIsRateModalOpen(false);
      await fetchCounselors();
    } catch (err) {
      console.error('Failed to save rate', err);
    } finally {
      setIsSubmittingRate(false);
    }
  };

  return (
    <SidebarLayout activePath="/settings">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Counselor Session Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-red-500 p-4">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>USD Rate</TableHead>
                    <TableHead>NGN Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {counselors.map(c => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                      <TableCell>{c.email}</TableCell>
                      <TableCell>
                        {c.sessionRate ? (
                          <Badge variant="outline">${c.sessionRate}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {c.ngnSessionRate ? (
                          <Badge variant="outline">₦{c.ngnSessionRate}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenRateModal(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedCounselor && (
        <SetRateModal
          isOpen={isRateModalOpen}
          onClose={() => setIsRateModalOpen(false)}
          onSubmit={handleSaveRate}
          isSubmitting={isSubmittingRate}
          initialUsd={selectedCounselor.sessionRate}
          initialNgn={selectedCounselor.ngnSessionRate}
        />
      )}
    </SidebarLayout>
  );
};

export default AdminSettings;
