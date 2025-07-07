import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

// IMPORTANT: Make sure to set VITE_STRIPE_PUBLISHABLE_KEY in your .env file
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error("Missing Stripe publishable key. Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file.");
} 

const Booking: React.FC = () => {
  const { counselorId } = useParams<{ counselorId: string }>();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({ title: 'Authentication Error', description: 'Please log in to book a session.', variant: 'destructive' });
      navigate('/login');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/payment/create-checkout-session', {
        counselorId,
        date,
        time,
        currency,
      });

      const sessionData = response.data;

      if (sessionData.provider === 'stripe') {
        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (stripe) {
          const { error } = await stripe.redirectToCheckout({ sessionId: sessionData.id });
          if (error) {
            toast({ title: 'Stripe Error', description: error.message || 'Redirect failed', variant: 'destructive' });
          }
        }
      } else if (sessionData.provider === 'paystack') {
        window.location.href = sessionData.authorization_url;
      }

    } catch (error: any) {
      console.error('Booking submission failed:', error.response?.data || error);
      toast({
        title: 'Booking Failed',
        description: error.response?.data?.msg || (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout activePath="/counselors">
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Book a Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">Date</label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="time" className="text-sm font-medium">Time</label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">Currency</label>
                <Select onValueChange={setCurrency} defaultValue={currency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="ngn">NGN (₦)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Booking;
