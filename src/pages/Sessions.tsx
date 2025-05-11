
import React from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Video } from 'lucide-react';

interface Session {
  id: number;
  counselorName: string;
  date: string;
  time: string;
  duration: string;
  type: 'video' | 'text';
  status: 'upcoming' | 'completed' | 'cancelled';
}

const Sessions: React.FC = () => {
  const upcomingSessions: Session[] = [
    {
      id: 1,
      counselorName: 'Dr. Abdullah Malik',
      date: '15 May 2024',
      time: '10:00 AM',
      duration: '60 min',
      type: 'video',
      status: 'upcoming'
    },
    {
      id: 2,
      counselorName: 'Dr. Sara Ahmed',
      date: '20 May 2024',
      time: '3:30 PM',
      duration: '45 min',
      type: 'video',
      status: 'upcoming'
    }
  ];
  
  const pastSessions: Session[] = [
    {
      id: 3,
      counselorName: 'Dr. Mohammed Hassan',
      date: '5 May 2024',
      time: '11:00 AM',
      duration: '60 min',
      type: 'video',
      status: 'completed'
    },
    {
      id: 4,
      counselorName: 'Dr. Abdullah Malik',
      date: '28 April 2024',
      time: '2:00 PM',
      duration: '30 min',
      type: 'text',
      status: 'completed'
    },
    {
      id: 5,
      counselorName: 'Dr. Nadia Fakih',
      date: '15 April 2024',
      time: '4:30 PM',
      duration: '60 min',
      type: 'video',
      status: 'cancelled'
    }
  ];

  const SessionCard = ({ session }: { session: Session }) => {
    const isUpcoming = session.status === 'upcoming';
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="text-primary text-sm font-semibold">
                  {session.counselorName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{session.counselorName}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-1" />
                  {session.date}
                  <span className="mx-2">•</span>
                  <Clock size={14} className="mr-1" />
                  {session.time}
                  <span className="mx-2">•</span>
                  {session.duration}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {session.status === 'upcoming' ? (
                <>
                  <Button size="sm" variant="outline">Reschedule</Button>
                  <Button size="sm">
                    <Video size={16} className="mr-1" />
                    Join
                  </Button>
                </>
              ) : session.status === 'completed' ? (
                <Button size="sm" variant="outline">View Summary</Button>
              ) : (
                <span className="text-red-500 text-sm">Cancelled</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <SidebarLayout activePath="/sessions">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <Button>
          <Calendar size={16} className="mr-1" />
          Book New Session
        </Button>
      </div>
      
      <Tabs defaultValue="upcoming" className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-4">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No upcoming sessions</h3>
              <p className="mb-4">You don't have any upcoming counseling sessions scheduled</p>
              <Button>Book a Session</Button>
            </div>
          ) : (
            <div>
              {upcomingSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-4">
          {pastSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No past sessions</h3>
              <p>You haven't had any counseling sessions yet</p>
            </div>
          ) : (
            <div>
              {pastSessions.map(session => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  );
};

export default Sessions;
