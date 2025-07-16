import React, { useState, useEffect, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useParams, useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error("Missing Stripe publishable key. Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file.");
}

interface Counselor {
  _id: string;
  firstName: string;
  lastName: string;
  availability?: string[];
}

const Booking: React.FC = () => {
  const { counselorId } = useParams<{ counselorId: string }>();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        const response = await api.get(`/counselors/${counselorId}`);
        console.log('Counselor data received:', response.data);
        setCounselor(response.data);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch counselor details.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCounselor();
  }, [counselorId, toast]);

  const availableSlotsByDate = useMemo(() => {
    if (!counselor?.availability) return {};
    return counselor.availability.reduce((acc, slot) => {
      try {
        const date = format(parseISO(slot), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
      } catch (error) {
        console.error(`Invalid date format for slot: ${slot}`);
      }
      return acc;
    }, {} as Record<string, string[]>);
  }, [counselor?.availability]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Authentication Error', description: 'Please log in to book a session.', variant: 'destructive' });
      navigate('/login');
      return;
    }
    if (!selectedSlot) {
      toast({ title: 'Selection Error', description: 'Please select an available time slot.', variant: 'destructive' });
      return;
    }

    setIsBooking(true);
    try {
      const response = await api.post('/payment/create-checkout-session', {
        counselorId,
        sessionDate: selectedSlot, // Send the full ISO string
        currency,
      });

      const sessionData = response.data;
      if (sessionData.provider === 'stripe') {
        const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
        if (stripe) {
          stripe.redirectToCheckout({ sessionId: sessionData.id });
        }
      } else if (sessionData.provider === 'paystack') {
        window.location.href = sessionData.authorization_url;
      }
    } catch (error: any) {
      toast({ title: 'Booking Failed', description: error.response?.data?.msg || 'An error occurred.', variant: 'destructive' });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!counselor) {
    return <div className="text-center p-8">Counselor not found.</div>;
  }

  return (
    <SidebarLayout activePath="/counselors">
      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Book a Session with {counselor.firstName} {counselor.lastName}</CardTitle>
            <CardDescription>Select an available time slot and proceed to payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Available Slots</h3>
              {Object.keys(availableSlotsByDate).length > 0 ? (
                Object.entries(availableSlotsByDate).map(([date, slots]) => (
                  <div key={date}>
                    <h4 className="font-medium mb-2">{format(parseISO(`${date}T00:00:00`), 'EEEE, MMMM d')}</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map(slot => (
                        <Button
                          key={slot}
                          variant={selectedSlot === slot ? 'default' : 'outline'}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {format(parseISO(slot), 'h:mm a')}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">This counselor has not set their availability yet.</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">Payment Currency</label>
              <Select onValueChange={setCurrency} defaultValue={currency}>
                <SelectTrigger id="currency" className="w-[180px]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="ngn">NGN (₦)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={isBooking || !selectedSlot}>
              {isBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Proceed to Payment'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Booking;
