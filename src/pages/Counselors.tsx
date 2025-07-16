import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Country, State, City } from 'country-state-city';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Star, Briefcase, Languages, MessageSquare, Calendar } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { loadStripe } from '@stripe/stripe-js';

interface Counselor {
  _id: string;
  name: string;
  specialty: string;
  profilePicture?: string;
  yearsOfExperience?: number;
  education?: string;
  languages?: string[];
  sessionRate?: number;
  ngnSessionRate?: number;
  country?: string;
  state?: string;
  city?: string;
  averageRating?: number;
  isFavorite?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'declined';
  isChatAllowed?: boolean;
}

const Counselors: React.FC = () => {
  const [filters, setFilters] = useState({ country: '', state: '', city: '', specialty: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currency, setCurrency] = useState('usd');

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

    const { data: counselorsData, isLoading, error } = useQuery<Counselor[]>({ queryKey: ['counselors'], queryFn: () => api.get('/counselors').then(res => res.data) });
  const { data: requests, refetch: refetchRequests } = useQuery<any[]>({ queryKey: ['requests', user?._id], queryFn: () => api.get('/requests').then(res => res.data), enabled: !!user });

  const counselors = useMemo(() => {
      if (!counselorsData) return [];
      return counselorsData.map(counselor => {
          const request = requests?.find(r => r.counselor === counselor._id);
          let requestStatus = 'idle';
          if (request) {
              requestStatus = request.status;
          }
          return { ...counselor, requestStatus };
      });
  }, [counselorsData, requests]);

  const { data: favorites = [], refetch: refetchFavorites } = useQuery<string[]>({
    queryKey: ['favorites', user?._id],
    queryFn: () => api.get('/users/favorites').then(res => res.data.map((fav: any) => fav._id)),
    enabled: !!user
  });

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => filters.country ? State.getStatesOfCountry(filters.country) : [], [filters.country]);
  const cities = useMemo(() => (filters.country && filters.state) ? City.getCitiesOfState(filters.country, filters.state) : [], [filters.country, filters.state]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value, ...(name === 'country' && { state: '', city: '' }), ...(name === 'state' && { city: '' }) }));
  };

  const filteredCounselors = useMemo(() => {
    if (!counselors) return [];
    return counselors
      .map(c => ({ ...c, isFavorite: favorites.includes(c._id) }))
      .filter(c => {
        const searchMatch = searchTerm ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
        const countryMatch = filters.country ? c.country === filters.country : true;
        const stateMatch = filters.state ? c.state === filters.state : true;
        const cityMatch = filters.city ? c.city === filters.city : true;
        const specialtyMatch = filters.specialty ? c.specialty?.toLowerCase().includes(filters.specialty.toLowerCase()) : true;
        return searchMatch && countryMatch && stateMatch && cityMatch && specialtyMatch;
      });
  }, [counselors, filters, searchTerm, favorites]);

      const handleViewProfile = (counselor: Counselor) => {
    setSelectedCounselor(counselor);
    setIsModalOpen(true);
  };

    useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('payment') === 'cancel') {
        toast({ title: 'Payment Cancelled', description: 'Your payment was cancelled.', variant: 'destructive' });
        navigate('/counselors', { replace: true });
    }
  }, [location, navigate, toast]);

  const handleToggleFavorite = async (counselorId: string, isFavorite: boolean) => {
    if (!user) {
      toast({ title: 'Please log in to manage favorites.', variant: 'destructive' });
      return;
    }
    try {
      const url = `/users/favorites/${counselorId}`;
      if (isFavorite) {
        await api.delete(url);
        toast({ title: 'Removed from favorites' });
      } else {
        await api.post(url);
        toast({ title: 'Added to favorites' });
      }
      refetchFavorites();
    } catch (err) {
      toast({ title: 'Error updating favorites', variant: 'destructive' });
    }
  };

  const handlePayment = async (counselor: Counselor | null) => {
    if (!counselor || !user) {
        toast({ title: 'Authentication Error', description: 'Please log in to proceed with payment.', variant: 'destructive' });
        return;
    }

            const amount = currency === 'ngn' ? counselor.ngnSessionRate : counselor.sessionRate;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        toast({ title: 'Invalid session rate', description: 'This counselor has not set a valid session rate.', variant: 'destructive' });
        return;
    }

    try {
        const { data } = await api.post('/payment/create-checkout-session', {
            counselorId: counselor._id,
            clientId: user._id,
            currency,
            amount: amount * 100, // Convert to cents/kobo
            success_url: `${window.location.origin}/payment/verify?provider=stripe&counselor_id=${counselor._id}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/counselors?payment=cancel`,
        });

      if (data.provider === 'stripe') {
            const stripe = await stripePromise;
            if (stripe && data.id) {
                await stripe.redirectToCheckout({ sessionId: data.id });
            } else {
                throw new Error('Stripe is not initialized or session ID is missing.');
            }
        } else if (data.provider === 'paystack') {
            window.location.href = data.authorization_url;
        }

    } catch (error: any) {
        console.error('Payment Error:', error);
        const errorMessage = error.response?.data?.msg || 'Failed to initiate payment session.';
        toast({ title: 'Payment Error', description: errorMessage, variant: 'destructive' });
    }
  };

  if (isLoading) return <SidebarLayout activePath={location.pathname}><div>Loading...</div></SidebarLayout>;
  if (error) return <SidebarLayout activePath={location.pathname}><div>Error loading counselors.</div></SidebarLayout>;

  return (
    <SidebarLayout activePath={location.pathname}>
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Find a Counselor</h1>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input 
                placeholder="Search by name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="lg:col-span-2"
              />
              <Select onValueChange={value => handleFilterChange('country', value)} value={filters.country}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                  {countries.map(c => <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={value => handleFilterChange('state', value)} value={filters.state} disabled={!filters.country}>
                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>
                  {states.map(s => <SelectItem key={s.isoCode} value={s.isoCode}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={value => handleFilterChange('city', value)} value={filters.city} disabled={!filters.state}>
                <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
                <SelectContent>
                  {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCounselors.map(counselor => (
            <Card key={counselor._id} className="flex flex-col">
              <CardHeader className="flex-row items-start gap-4 p-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={counselor.profilePicture} alt={counselor.name} />
                  <AvatarFallback>{counselor.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-xl">{counselor.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{counselor.specialty}</p>
                  <StarRating rating={counselor.averageRating || 0} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleToggleFavorite(counselor._id, !!counselor.isFavorite)}>
                  <Heart className={`w-6 h-6 ${counselor.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                </Button>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{counselor.yearsOfExperience || 'N/A'} years of experience</span>
                </div>
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{counselor.languages?.join(', ') || 'N/A'}</span>
                </div>
              </CardContent>
              <DialogFooter className="p-4 border-t">
                <Button onClick={() => handleViewProfile(counselor)} className="w-full">View Profile</Button>
              </DialogFooter>
            </Card>
          ))}
        </div>

        {selectedCounselor && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Counselor Profile</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                <div className="md:col-span-1 flex flex-col items-center text-center">
                  <Avatar className="w-32 h-32 mb-4">
                    <AvatarImage src={selectedCounselor.profilePicture} alt={selectedCounselor.name} />
                    <AvatarFallback>{selectedCounselor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold">{selectedCounselor.name}</h2>
                  <p className="text-muted-foreground">{selectedCounselor.specialty}</p>
                  <StarRating rating={selectedCounselor.averageRating || 0} />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">
                      Experienced counselor specializing in {selectedCounselor.specialty}. Dedicated to providing a safe and supportive environment for clients.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold">Experience</h4>
                      <p>{selectedCounselor.yearsOfExperience || 'N/A'} years</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Education</h4>
                      <p>{selectedCounselor.education || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Languages</h4>
                      <p>{selectedCounselor.languages?.join(', ') || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Location</h4>
                      <p>{selectedCounselor.city}, {selectedCounselor.country}</p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center gap-4 pt-6 border-t">
                 <div className='flex items-center gap-2'>
                    <p className='font-bold text-lg'>
                        {currency === 'ngn' 
                            ? `₦${selectedCounselor.ngnSessionRate || 'N/A'}` 
                            : `$${selectedCounselor.sessionRate || 'N/A'}`}
                    </p>
                    <Select onValueChange={setCurrency} defaultValue={currency}>
                      <SelectTrigger className="w-full sm:w-[100px]">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="ngn">NGN</SelectItem>
                      </SelectContent>
                    </Select>
                 </div>
                
                <div className="flex gap-2">
                    {selectedCounselor.isChatAllowed ? (
                      <Button
                        onClick={() => navigate(`/chat/${selectedCounselor._id}`)}
                        className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
                      >
                        <MessageSquare className="mr-2 h-4 w-4"/> Chat
                      </Button>
                    ) : selectedCounselor.requestStatus === 'pending' ? (
                      <Button disabled className="w-full sm:w-auto">Request Pending</Button>
                    ) : (
                      <Button
                        onClick={() => handlePayment(selectedCounselor)}
                        className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
                      >
                        Pay to Send Request
                      </Button>
                    )}
                    
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Counselors;
