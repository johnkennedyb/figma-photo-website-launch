import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadStripe } from '@stripe/stripe-js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, MessageSquare, Star, Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import FileComplaint from '@/components/complaints/FileComplaint';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error("Missing Stripe publishable key. Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file.");
}

interface Counselor {
  profilePicture?: string;
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  rating?: number;
  bio?: string;
  nationality?: string;
  countryOfResidence?: string;
  cityOfResidence?: string;
  maritalStatus?: string;
  academicQualifications?: string;
  relevantPositions?: string;
  yearsOfExperience?: string;
  issuesSpecialization?: string;
  affiliations?: string;
  languages?: string[];
  sessionRate?: string;
  ngnSessionRate?: string;
  availability?: string[];
  certifications?: string[];
  isFavorite?: boolean;
}

const CounselorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isChatAllowed, setIsChatAllowed] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'pending' | 'accepted'>('idle');
  const [currency, setCurrency] = useState('usd');
  const [isRequesting, setIsRequesting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCounselor = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/counselors/${id}`);
        const data = response.data;
        setCounselor(data);
        setIsFavorite(data.isFavorite || false);
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: 'Could not load counselor profile.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCounselor();
      const checkRequestStatus = async () => {
        try {
          const res = await api.get(`/requests/status/${id}`);
          setRequestStatus(res.data.status || 'idle');
          if (res.data.status === 'accepted') {
            setIsChatAllowed(true);
          }
        } catch (error: unknown) {
          setRequestStatus('idle');
        }
      };
      checkRequestStatus();
    }
  }, [id, navigate, toast, user]);



  const handleFavorite = async () => {
    if (!counselor) return;

    const originalIsFavorite = isFavorite;
    setIsFavorite(!originalIsFavorite);

    try {
      await api.post('/users/favorites', { counselorId: counselor._id });
      toast({
        title: !originalIsFavorite ? 'Added to favorites' : 'Removed from favorites',
      });
    } catch (error: unknown) {
      setIsFavorite(originalIsFavorite);
      toast({
        title: 'Error',
        description: 'Could not update favorites. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSendRequest = async () => {
    if (!counselor) return;
    setIsRequesting(true);
    try {
      const response = await api.post('/payment/create-checkout-session', {
        counselorId: id,
        currency,
        type: 'request',
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
      toast({
        title: 'Request Failed',
        description: error.response?.data?.msg || 'An error occurred while creating the payment session.',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout activePath="/counselors">
        <div className="flex justify-center items-center h-full">Loading profile...</div>
      </SidebarLayout>
    );
  }

  if (!counselor) {
    return (
      <SidebarLayout activePath="/counselors">
        <div className="flex justify-center items-center h-full">Counselor not found.</div>
      </SidebarLayout>
    );
  }

  const renderDetail = (label: string, value: string | undefined | null) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold">{value || 'N/A'}</p>
    </div>
  );

  return (
    <SidebarLayout activePath="/counselors">
      <div className="p-4 md:p-6">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            ← Back to Counselors
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto">
                    <CardContent className="p-6 md:p-8 relative">
            {user && user.role === 'client' && counselor && (
              <div className="absolute top-6 right-6">
                <FileComplaint reportedUserId={counselor._id} />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="md:col-span-1 flex flex-col items-center md:items-start">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 overflow-hidden border-2 border-primary-light">
                  {counselor.profilePicture ? (
                    <img src={counselor.profilePicture} alt={`${counselor.firstName} ${counselor.lastName}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary text-3xl font-bold">
                      {((counselor.firstName?.[0] || '') + (counselor.lastName?.[0] || '')).toUpperCase() || 'N/A'}
                    </span>
                  )}
                </div>
                <div className="space-y-4 text-center md:text-left">
                  {renderDetail('Full Name', `${counselor.firstName} ${counselor.lastName}`)}
                  {renderDetail('Nationality', counselor.nationality)}
                  {renderDetail('Location', `${counselor.cityOfResidence || ''}${counselor.cityOfResidence && counselor.countryOfResidence ? ', ' : ''}${counselor.countryOfResidence || ''}`)}
                  {renderDetail('Email Address', counselor.email)}
                  {renderDetail('Specialisation', counselor.issuesSpecialization)}
                  {renderDetail('Languages Spoken', counselor.languages?.join(', '))}
                </div>
              </div>

              {/* Right Column */}
              <div className="md:col-span-2 space-y-4">
                {renderDetail('Academic Qualification', counselor.academicQualifications)}
                {renderDetail('Position Held', counselor.relevantPositions)}
                {renderDetail('Affiliations & Memberships', counselor.affiliations)}
                {renderDetail('Years Of Experience in Counselling', counselor.yearsOfExperience)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t">
              {requestStatus === 'idle' && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Select onValueChange={setCurrency} defaultValue={currency}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="ngn">NGN (₦)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSendRequest} className="w-full sm:w-auto" disabled={isRequesting}>
                    {isRequesting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Send className="mr-2 h-4 w-4" /> Pay to Send Request</>}
                  </Button>
                </div>
              )}
              {requestStatus === 'pending' && (
                <Button disabled className="w-full sm:w-auto">
                  Request Pending Counselor Approval
                </Button>
              )}
              {isChatAllowed && (
                <Link to={`/chat/${id}`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white relative pr-8">
                    Chat with Counsellor
                    <div className="absolute -bottom-2 right-1/2 transform translate-x-1/2 w-4 h-4 bg-green-600 rotate-45"></div>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default CounselorProfile;
