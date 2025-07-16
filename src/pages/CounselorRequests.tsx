
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import ClientProfileDialog from '@/components/ClientProfileDialog';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
}

interface ClientRequest {
  _id: string;
  client: Client;
  status: 'pending' | 'accepted' | 'declined';
}

const CounselorRequests: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'declined'>('pending');

  useEffect(() => {
    if (authLoading) return;

    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/requests?status=${activeTab}`);
        setRequests(res.data);
      } catch (error) {
        toast({
          title: 'Error fetching requests',
          description: 'Could not load requests. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [navigate, authLoading, activeTab, toast]);

  const handleRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    setProcessingId(requestId);
    try {
      await api.put(`/requests/${requestId}`, { status });
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
      toast({
        title: 'Success',
        description: `Request ${status}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${status} request. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const viewProfile = (clientId: string) => {
    setSelectedClientId(clientId);
    setDialogOpen(true);
  };



  return (
    <CounselorSidebarLayout activePath="/counselor/requests">
      <div className="dashboard-background min-h-screen p-6">
        <h1 className="text-2xl font-semibold mb-8">Client Requests</h1>
                <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b flex space-x-4">
            <Button variant={activeTab === 'pending' ? 'default' : 'outline'} onClick={() => setActiveTab('pending')}>Pending</Button>
            <Button variant={activeTab === 'accepted' ? 'default' : 'outline'} onClick={() => setActiveTab('accepted')}>Accepted</Button>
            <Button variant={activeTab === 'declined' ? 'default' : 'outline'} onClick={() => setActiveTab('declined')}>Declined</Button>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {requests.length > 0 ? (
                  requests.map(request => (
                    <div key={request._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <span className="text-gray-700">{request.client.firstName} {request.client.lastName}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => viewProfile(request.client._id)} disabled={processingId === request._id}>View Profile</Button>
                        {activeTab === 'pending' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleRequest(request._id, 'accepted')} disabled={processingId === request._id}>
                              {processingId === request._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Accept'}
                            </Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleRequest(request._id, 'declined')} disabled={processingId === request._id}>
                              {processingId === request._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Decline'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No {activeTab} requests.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ClientProfileDialog clientId={selectedClientId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </CounselorSidebarLayout>
  );
};

export default CounselorRequests;
