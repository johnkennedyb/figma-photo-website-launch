import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const VerifyPayment: React.FC = () => {
  const [status, setStatus] = useState('Verifying payment...');
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id'); // This is the Stripe session ID or Paystack reference
    const counselorId = params.get('counselor_id');
    const provider = params.get('provider');

    if (!sessionId || !counselorId || !provider) {
      setStatus('Invalid payment verification URL.');
      toast({ title: 'Error', description: 'Invalid payment verification URL.', variant: 'destructive' });
      navigate('/counselors');
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;

      const verify = () => {
        if (provider === 'stripe') {
          return api.post('/payment/verify-payment', { sessionId });
        } else if (provider === 'paystack') {
          return api.post('/payment/verify-paystack', { reference: sessionId });
        }
        return Promise.reject(new Error('Invalid payment provider.'));
      };

      verify()
        .then(res => {
          if (res.data.payment_status === 'paid' || res.data.payment_status === 'success') {
            clearInterval(interval);
            setStatus('Payment verified successfully!');
            toast({ title: 'Payment Successful', description: 'Your connection request has been sent.' });
            navigate('/dashboard');
            const checkAndCreateRequest = async () => {
              try {
                const res = await api.get(`/requests/status/${counselorId}`);
                if (res.data.status === 'not_sent') {
                  await api.post('/requests', { counselorId });
                }
              } catch (error) {
                // Silently fail if check or creation fails, as payment was successful.
                console.error('Could not create request post-payment', error);
              }
            };
            checkAndCreateRequest();
            return;
          }
        })
        
        .catch((err) => {
           console.error(`Verification attempt ${attempts} failed:`, err);
        });

      if (attempts > 10) {
        clearInterval(interval);
        setStatus('Verification taking too long. Please check your sessions page or contact support.');
        toast({ title: 'Verification Timeout', description: 'We could not automatically confirm your payment. Please check your Sessions page to see if your booking was successful.', variant: 'destructive' });
        navigate('/counselors');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [location, navigate, toast]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Payment Verification</h1>
        <p>{status}</p>
      </div>
    </div>
  );
};

export default VerifyPayment;
