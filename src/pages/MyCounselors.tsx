import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, Clock, CheckCircle, Star } from 'lucide-react';
import StarRating from '@/components/ui/StarRating';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useNavigate, useLocation } from 'react-router-dom';

interface CounselorRequest {
  _id: string;
  counselor: {
    _id: string;
    firstName: string;
    lastName: string;
    issuesSpecialization: string;
    profilePicture?: string;
    averageRating?: number;
    sessionRate?: number;
    ngnSessionRate?: number;
    yearsOfExperience?: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  acceptedAt?: string;
}

const MyCounselors: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('accepted');

  const { data: requests = [], isLoading, refetch } = useQuery<CounselorRequest[]>({
    queryKey: ['my-counselors', user?._id],
    queryFn: () => api.get('/requests').then(res => res.data),
    enabled: !!user
  });

  const acceptedCounselors = requests.filter(req => req.status === 'accepted');
  const pendingCounselors = requests.filter(req => req.status === 'pending');

  const handleStartChat = (counselorId: string) => {
    navigate(`/messages?counselor=${counselorId}`);
  };

  const handleBookSession = (counselorId: string) => {
    navigate(`/counselors?book=${counselorId}`);
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await api.delete(`/requests/${requestId}`);
      refetch();
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout activePath={location.pathname}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading your counselors...</div>
        </div>
      </SidebarLayout>
    );
  }

  const CounselorCard = ({ request, showActions = true }: { request: CounselorRequest; showActions?: boolean }) => (
    <Card className="mb-4">
      <CardHeader className="flex-row items-center gap-4 pb-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={request.counselor.profilePicture} />
          <AvatarFallback>
            {request.counselor.firstName.charAt(0)}{request.counselor.lastName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl">
            {request.counselor.firstName} {request.counselor.lastName}
          </CardTitle>
          <p className="text-sm text-muted-foreground mb-2">
            {request.counselor.issuesSpecialization || 'General Counseling'}
          </p>
          <div className="flex items-center gap-2">
            <StarRating rating={request.counselor.averageRating || 0} />
            <span className="text-sm text-muted-foreground">
              {request.counselor.yearsOfExperience} years experience
            </span>
          </div>
          <Badge 
            variant={request.status === 'accepted' ? 'default' : 'secondary'}
            className="mt-2"
          >
            {request.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
            {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {request.status === 'accepted' ? 'Connected' : 'Requested'} on
          </p>
          <p className="text-sm font-medium">
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardHeader>
      {showActions && (
        <CardContent className="pt-0">
          <div className="flex gap-2">
            {request.status === 'accepted' && (
              <>
                <Button 
                  onClick={() => handleStartChat(request.counselor._id)}
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
                <Button 
                  onClick={() => handleBookSession(request.counselor._id)}
                  variant="outline"
                  className="flex-1"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Session
                </Button>
              </>
            )}
            {request.status === 'pending' && (
              <Button 
                onClick={() => handleCancelRequest(request._id)}
                variant="outline"
                className="ml-auto"
              >
                Cancel Request
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <SidebarLayout activePath={location.pathname}>
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">My Counselors</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="accepted">
              Connected ({acceptedCounselors.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingCounselors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accepted" className="mt-6">
            {acceptedCounselors.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">No Connected Counselors</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't connected with any counselors yet.
                  </p>
                  <Button onClick={() => navigate('/counselors')}>
                    Find Counselors
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                {acceptedCounselors.map(request => (
                  <CounselorCard key={request._id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {pendingCounselors.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any pending counselor requests.
                  </p>
                  <Button onClick={() => navigate('/counselors')}>
                    Find Counselors
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                {pendingCounselors.map(request => (
                  <CounselorCard key={request._id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
};

export default MyCounselors;