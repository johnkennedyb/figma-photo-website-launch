
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageSquare, Star } from 'lucide-react';

const CounselorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // This would typically come from an API call using the id
  const counselor = {
    id: Number(id),
    name: 'Dr. Abdullah Malik',
    specialty: 'Family Counseling',
    rating: 5,
    experience: '8 years',
    bio: 'Dr. Abdullah is a certified family counselor with extensive experience in helping families navigate challenges and improve relationships. His expertise includes conflict resolution, communication enhancement, and strengthening family bonds.',
    education: 'Ph.D in Psychology, Islamic University of Madinah',
    certifications: ['Licensed Family Therapist', 'Certified Marriage Counselor'],
    languages: ['English', 'Arabic'],
    sessionRate: '$120 per hour',
    availability: ['Monday', 'Wednesday', 'Friday'],
    status: 'Online',
    favorite: true
  };

  return (
    <SidebarLayout activePath="/counselors">
      <div className="mb-8">
        <Link to="/counselors" className="text-primary mb-2 block">← Back to Counselors</Link>
        <h1 className="text-2xl font-semibold">Counselor Profile</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-primary text-xl font-semibold">{counselor.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <h2 className="text-lg font-semibold">{counselor.name}</h2>
                <p className="text-gray-600 mb-2">{counselor.specialty}</p>
                <div className="flex mb-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className="text-yellow-500 fill-yellow-500" 
                    />
                  ))}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm mb-6 ${
                  counselor.status === 'Online' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {counselor.status}
                </div>
                <div className="w-full flex flex-col gap-3">
                  <Button className="w-full">
                    <Calendar className="mr-2" size={16} />
                    Book Session
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/chat/${counselor.id}`}>
                      <MessageSquare className="mr-2" size={16} />
                      Message
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Profile main content */}
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
                    <p className="text-gray-600">{counselor.bio}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Languages</h3>
                    <div className="flex gap-2">
                      {counselor.languages.map(lang => (
                        <span key={lang} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="education" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Education</h3>
                    <p className="text-gray-600">{counselor.education}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Experience</h3>
                    <p className="text-gray-600">{counselor.experience}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Certifications</h3>
                    <ul className="list-disc pl-5 text-gray-600">
                      {counselor.certifications.map(cert => (
                        <li key={cert}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="services" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Session Rate</h3>
                    <p className="text-gray-600">{counselor.sessionRate}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Availability</h3>
                    <div className="flex flex-wrap gap-2">
                      {counselor.availability.map(day => (
                        <span key={day} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                          {day}
                        </span>
                      ))}
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
