import React, { useEffect, useState } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil } from 'lucide-react';
import SetRateModal from '@/components/SetRateModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

interface Counselor { _id: string; firstName: string; lastName: string; email: string; sessionRate?: number; ngnSessionRate?: number; }

const Settings: React.FC = () => {
  const [matchingAlgorithm, setMatchingAlgorithm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // counselor rates state
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const response = await api.get('/admin/settings/matching-algorithm', {
          headers: { 'x-auth-token': token },
        });
        setMatchingAlgorithm(response.data.value);
      } catch (err) {
        toast({ title: 'Error', description: 'Could not load settings.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [token, toast]);

  const fetchCounselors = async () => {
    try {
      const res = await api.get('/admin/users?role=counselor');
      setCounselors(res.data);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchCounselors(); }, []);

  const openRateModal = (c: Counselor)=>{ setSelectedCounselor(c); setRateModalOpen(true);} ;

  const handleSaveRate = async (usd: number|null, ngn: number|null)=>{
    if(!selectedCounselor) return;
    setRateSubmitting(true);
    try{
      await api.put(`/admin/counselors/${selectedCounselor._id}/rate`, { usdRate: usd, ngnRate: ngn });
      await fetchCounselors();
      setRateModalOpen(false);
    }catch(err){ toast({title:'Error', description:'Failed to save rate', variant:'destructive'});}finally{setRateSubmitting(false);} };

  const handleSave = async () => {
    if (!token) return;
    try {
      await api.put('/admin/settings/matching-algorithm', { value: matchingAlgorithm }, {
        headers: { 'x-auth-token': token },
      });
      toast({ title: 'Success', description: 'Settings have been saved.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <AdminSidebarLayout activePath="/admin/settings"><p>Loading settings...</p></AdminSidebarLayout>;
  }

  return (
    <AdminSidebarLayout activePath="/admin/settings">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="matching-algorithm" className="block text-sm font-medium text-gray-700">Matching Algorithm</label>
            <Select value={matchingAlgorithm} onValueChange={setMatchingAlgorithm}>
              <SelectTrigger id="matching-algorithm">
                <SelectValue placeholder="Select an algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic</SelectItem>
                <SelectItem value="manual">Manual Approval</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Determines how clients are matched with counselors.</p>
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </AdminSidebarLayout>
  );
};

export default Settings;
