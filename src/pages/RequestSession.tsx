import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';

interface Counselor {
  _id: string;
  firstName: string;
  lastName: string;
  sessionRate?: number;
  ngnSessionRate?: number;
}

const RequestSession: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        const res = await api.get(`/users/counselors/${id}`);
        setCounselor(res.data);
      } catch (error: unknown) {
        let errorMessage = 'Could not load counselor details.';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const apiError = error as { response?: { data?: { msg?: string } } };
          errorMessage = apiError.response?.data?.msg || errorMessage;
        }
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCounselor();
    }
  }, [id, toast]);

  const paystackConfig = {
    reference: new Date().getTime().toString(),
    email: user?.email || '',
    amount: (counselor?.ngnSessionRate || 0) * 100, // Amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };

  const handlePaymentSuccess = async (reference: { reference: string }) => {
    setIsSubmitting(true);
    try {
      await api.post(`/sessions/request`, {
        counselorId: id,
        message: message,
        paymentReference: reference.reference,
      });

      toast({
        title: 'Request Sent',
        description: `Your session request has been sent to ${counselor?.firstName} ${counselor?.lastName}. You will be notified when they respond.`,
      });
      navigate('/sessions');
    } catch (error: unknown) {
      let errorMessage = 'Failed to send session request after payment. Please contact support.';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentClose = () => {
    toast({
      title: 'Payment cancelled',
      description: 'You cancelled the payment process.',
      variant: 'default',
    });
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please write a message for your request.',
        variant: 'destructive',
      });
      return;
    }
    if (!counselor?.ngnSessionRate) {
      toast({
        title: 'Rate not available',
        description: 'This counselor has not set a session rate yet.',
        variant: 'destructive',
      });
      return;
    }

    initializePayment({
      onSuccess: handlePaymentSuccess,
      onClose: handlePaymentClose,
    });
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-full">Loading...</div>
      </SidebarLayout>
    );
  }

  if (!counselor) {
    return (
      <SidebarLayout>
        <div className="flex justify-center items-center h-full">Counselor not found.</div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout activePath="/counselors">
      <div className="p-4 md:p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          ← Back
        </Button>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Send Session Request</CardTitle>
            <CardDescription>
              Your request will be sent to {counselor.firstName} {counselor.lastName}. The session fee is ₦{counselor.ngnSessionRate?.toLocaleString()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Write a brief message to ${counselor.firstName} ${counselor.lastName} about what you'd like to discuss...`}
                    rows={6}
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Proceed to Payment (₦{counselor.ngnSessionRate?.toLocaleString()})
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default RequestSession;
