import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const BookingSuccess: React.FC = () => {
  const [status, setStatus] = useState<'connecting' | 'verifying' | 'success' | 'timeout' | 'error'>('connecting');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
    useEffect(() => {
    const sessionId = new URLSearchParams(location.search).get('session_id');

    if (!sessionId) {
      setStatus('error');
      toast({ title: 'Error', description: 'No session ID found in URL.', variant: 'destructive' });
      return;
    }

    let attempts = 0;
    const maxAttempts = 10; // Poll for 20 seconds max (10 attempts * 2s interval)
    setStatus('verifying');

    const intervalId = setInterval(async () => {
      try {
        attempts++;
        const response = await api.get(`/sessions/${sessionId}`);
        if (response.data && response.data.status === 'paid') {
          setStatus('success');
          toast({
            title: 'Booking Confirmed!',
            description: 'Your session has been successfully booked.',
          });
          clearInterval(intervalId);
        } else if (attempts >= maxAttempts) {
          setStatus('timeout');
          toast({
            title: 'Verification Timeout',
            description: 'Could not confirm payment automatically. Please check your sessions page for updates.',
            variant: 'destructive',
          });
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error verifying session:', err);
        setStatus('error');
        toast({ title: 'Verification Error', description: 'Could not verify your booking status.', variant: 'destructive' });
        clearInterval(intervalId);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [location.search, navigate, toast]);

  const renderContent = () => {
    switch (status) {
      
      case 'verifying':
        return (
          <>
            <Loader2 className="mx-auto h-16 w-16 text-blue-500 animate-spin mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Verifying Your Payment...</h1>
            <p className="text-gray-600">Please wait while we confirm your booking. This should only take a moment.</p>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Session Confirmed!</h1>
            <p className="text-gray-700">Your session has been successfully booked.</p>
            <Button asChild className="mt-6">
              <Link to="/sessions">View My Sessions</Link>
            </Button>
          </>
        );
      case 'timeout':
        return (
          <>
            <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Verification Taking Too Long</h1>
            <p className="text-gray-600">We could not automatically confirm your payment. Please check your "Sessions" page to see if your booking was successful.</p>
            <Button asChild className="mt-6">
              <Link to="/sessions">Check My Sessions</Link>
            </Button>
          </>
        );
      case 'error':
        return (
          <>
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Booking Error</h1>
            <p className="text-gray-600">An unexpected error occurred. Please try booking again.</p>
            <Button asChild className="mt-6">
              <Link to="/counselors">Find a Counselor</Link>
            </Button>
          </>
        );
    }
  };

  return (
    <SidebarLayout activePath="/counselors">
      <div className="dashboard-background p-6 flex items-center justify-center">
        <div className="text-center bg-white/90 p-10 rounded-lg shadow-lg max-w-md w-full">
          {renderContent()}
        </div>
      </div>
    </SidebarLayout>
  );
};

export default BookingSuccess;
