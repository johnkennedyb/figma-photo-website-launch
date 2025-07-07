
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

interface Counselor {
  _id: string;
  name: string;
  specialties?: string[];
  bio?: string;
  experience?: string;
  sessionRate?: number;
  profilePicture?: string; 
}

const Counselors: React.FC = () => {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchCounselors = async () => {
      if (authLoading) return; // Wait for auth state to be determined

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setIsLoading(true);
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
                const res = await fetch(`${apiUrl}/api/counselors`, {
          headers: {
            'x-auth-token': token,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch counselors');
        }

        const data = await res.json();
        setCounselors(data);
      } catch (error) {
        toast({
          title: 'Error fetching counselors',
          description: (error as Error).message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounselors();
  }, [navigate, toast, token, authLoading]);

  const handleBookSession = (counselorId: string) => {
    navigate(`/book/${counselorId}`);
  };

  return (
    <SidebarLayout activePath="/counselors">
      <div className="dashboard-background p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Counsellors</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search counsellors..."
              className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 bg-primary/5 p-4 font-medium text-gray-700">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Name of Counsellor</div>
              <div className="col-span-4">Specialty</div>
              <div className="col-span-3">Actions</div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : counselors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No counselors available at the moment.
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block">
                  {counselors.map((counselor, index) => (
                    <div key={counselor._id} className="grid grid-cols-12 p-4 border-b items-center">
                      <div className="col-span-1">{index + 1}</div>
                      <div className="col-span-4 flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-4 flex-shrink-0"></div>
                        <div>
                          <div className="font-medium">{counselor.name}</div>
                        </div>
                      </div>
                      <div className="col-span-4 text-gray-600">
                        {counselor.specialties && counselor.specialties.length > 0 ? counselor.specialties.join(', ') : 'Not specified'}
                      </div>
                      <div className="col-span-3 flex gap-2">
                        <Button size="sm" asChild>
                          <Link to={`/counselor/${counselor._id}`}>View Profile</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBookSession(counselor._id)}>Book Session</Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4 p-4">
                  {counselors.map((counselor) => (
                    <Card key={counselor._id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start mb-4">
                          <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 flex-shrink-0"></div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{counselor.name}</h3>
                            <p className="text-sm text-gray-600">
                              {counselor.specialties && counselor.specialties.length > 0 ? counselor.specialties.join(', ') : 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" asChild>
                            <Link to={`/counselor/${counselor._id}`}>View Profile</Link>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleBookSession(counselor._id)}>Book Session</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Counselors;
