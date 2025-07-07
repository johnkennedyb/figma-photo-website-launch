import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageSquare, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

interface Counselor {
  _id: string;
  name: string;
  specialty?: string;
  rating?: number;
  experience?: string;
  bio?: string;
  education?: string;
  certifications?: string[];
  languages?: string[];
  sessionRate?: string;
  availability?: string[];
}

const CounselorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [counselor, setCounselor] = useState<Counselor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    const fetchCounselor = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      const apiUrl = import.meta.env.VITE_API_BASE_URL;

      try {
        setIsLoading(true);
        const res = await fetch(`${apiUrl}/api/counselors/${id}`, {
          headers: { 'x-auth-token': token },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch counselor data');
        }

        const data = await res.json();
        setCounselor(data);
      } catch (error) {
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
    }
  }, [id, navigate, toast, token]);

  if (isLoading) {
    return (
      <SidebarLayout activePath="/counselors">
        <div>Loading profile...</div>
      </SidebarLayout>
    );
  }

  if (!counselor) {
    return (
      <SidebarLayout activePath="/counselors">
        <div>Counselor not found.</div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout activePath="/counselors">
      <div className="mb-8">
        <Link to="/counselors" className="text-primary mb-2 block">
          ← Back to Counselors
        </Link>
        <h1 className="text-2xl font-semibold">Counselor Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary text-xl font-semibold">
                    {counselor.name?.split(' ').map((n) => n[0]).join('') || 'N/A'}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{counselor.name}</h2>
                <p className="text-gray-600 mb-2">{counselor.specialty || 'N/A'}</p>
                <div className="flex mb-4">
                  {(() => {
                    const displayRating = Math.max(0, Math.min(5, Math.round(counselor.rating || 0)));
                    return (
                      <>
                        {Array(displayRating)
                          .fill(0)
                          .map((_, i) => (
                            <Star
                              key={`filled-${i}`}
                              size={16}
                              className="text-yellow-500 fill-yellow-500"
                            />
                          ))}
                        {Array(5 - displayRating)
                          .fill(0)
                          .map((_, i) => (
                            <Star key={`empty-${i}`} size={16} className="text-gray-300" />
                          ))}
                      </>
                    );
                  })()}
                </div>
                <div className="w-full flex flex-col gap-3">
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/book/${counselor._id}`)}
                  >
                    <Calendar className="mr-2" size={16} />
                    Book Session
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/chat/${counselor._id}`}>
                      <MessageSquare className="mr-2" size={16} />
                      Message
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="about">
                <TabsList className="mb-4">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="education">Education & Experience</TabsTrigger>
                  <TabsTrigger value="services">Services & Rates</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Bio</h3>
                    <p className="text-gray-600">{counselor.bio || 'No bio available.'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Languages</h3>
                    <div className="flex gap-2">
                      {counselor.languages?.length ? (
                        counselor.languages.map((lang) => (
                          <span
                            key={lang}
                            className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                          >
                            {lang}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-600">N/A</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="education" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Education</h3>
                    <p className="text-gray-600">{counselor.education || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Experience</h3>
                    <p className="text-gray-600">{counselor.experience || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Certifications</h3>
                    {counselor.certifications?.length ? (
                      <ul className="list-disc pl-5 text-gray-600">
                        {counselor.certifications.map((cert) => (
                          <li key={cert}>{cert}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No certifications listed.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Session Rate</h3>
                    <p className="text-gray-600">{counselor.sessionRate || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Availability</h3>
                    <div className="flex flex-wrap gap-2">
                      {counselor.availability?.length ? (
                        counselor.availability.map((day) => (
                          <span
                            key={day}
                            className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                          >
                            {day}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-600">Availability not specified.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default CounselorProfile;
