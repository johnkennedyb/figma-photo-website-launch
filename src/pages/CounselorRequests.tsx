
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface ClientRequest {
  _id: string;
  client: {
    _id: string;
    name: string;
  };
  status: 'pending' | 'accepted' | 'declined';
}

const CounselorRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { token, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const fetchRequests = async () => {
      if (!token) {
        toast.error('Authentication error. Please log in.');
        navigate('/counselor-login');
        return;
      }

      try {
        setIsLoading(true);
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${apiUrl}/api/requests?status=pending`, {
          headers: { 'x-auth-token': token },
        });

        if (!res.ok) throw new Error('Failed to fetch requests');

        const data = await res.json();
        setRequests(data);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [navigate, token, authLoading]);

  const handleRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    if (!token) {
      toast.error('Authentication error. Please log in.');
      return;
    }
    setProcessingId(requestId);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${apiUrl}/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${status} request`);
      }

      setRequests((prev) => prev.filter((req) => req._id !== requestId));
      toast.success(`Request ${status}`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const viewProfile = (clientId: string) => {
    navigate(`/counselor/client-profile/${clientId}`);
  };

  if (isLoading) {
    return (
      <CounselorSidebarLayout activePath="/counselor-requests">
        <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </CounselorSidebarLayout>
    );
  }

  return (
    <CounselorSidebarLayout activePath="/counselor-requests">
      <div className="dashboard-background min-h-screen p-6">
        <h1 className="text-2xl font-semibold mb-8">Client Requests</h1>
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Pending Requests</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {requests.length > 0 ? (
                requests.map(request => (
                  <div key={request._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <span className="text-gray-700">{request.client.name} sent you a request</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => viewProfile(request.client._id)} disabled={processingId === request._id}>View Profile</Button>
                      <Button variant="outline" size="sm" onClick={() => handleRequest(request._id, 'accepted')} disabled={processingId === request._id}>
                        {processingId === request._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Accept'}
                      </Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleRequest(request._id, 'declined')} disabled={processingId === request._id}>
                        {processingId === request._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Decline'}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No pending requests.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </CounselorSidebarLayout>
  );
};

export default CounselorRequests;
