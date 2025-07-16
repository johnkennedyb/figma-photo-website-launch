
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Video, Star } from 'lucide-react';
import RatingModal from '@/components/RatingModal';
import { useToast } from '@/components/ui/use-toast';

import { api } from '@/utils/api';

interface Counselor {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Session {
  _id: string;
  counselor: Counselor;
  date: string;
  duration: number;
  sessionType: 'video' | 'text';
  status: 'upcoming' | 'completed' | 'cancelled' | 'paid' | 'rated';
  videoCallUrl?: string;
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await api.get('/sessions');
        if (Array.isArray(data)) {
          setSessions(data);
        } else {
          console.error('Failed to fetch sessions or data is not in expected format', data);
          setSessions([]);
        }
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        navigate('/login');
      }
    };

    fetchSessions();
  }, [navigate]);

  const upcomingSessions = Array.isArray(sessions) ? sessions.filter(s => s.status === 'upcoming' || s.status === 'paid') : [];
  const pastSessions = Array.isArray(sessions) ? sessions.filter(s => s.status !== 'upcoming' && s.status !== 'paid') : [];



  const SessionCard = ({ session, currentTime }: { session: Session, currentTime: Date }) => {
    const sessionTime = new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const counselorName = session.counselor ? `${session.counselor.firstName} ${session.counselor.lastName}` : 'Counselor';
    const counselorInitials = counselorName ? counselorName.split(' ').map(n => n[0]).join('') : 'C';

    const isJoinable = () => {
      if (!session.videoCallUrl || (session.status !== 'paid' && session.status !== 'upcoming')) {
        return false;
      }
      const sessionStart = new Date(session.date);
      const twoHoursAfter = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);
      return currentTime >= sessionStart && currentTime < twoHoursAfter;
    };

    const handleJoinClick = () => {
      if (isJoinable()) {
        window.open(session.videoCallUrl, '_blank', 'noopener,noreferrer');
      } else {
        const sessionStart = new Date(session.date);
        if (currentTime < sessionStart) {
          alert('Your session has not started yet. You can join at the scheduled time.');
        } else {
          alert('This session link has expired.');
        }
      }
    };

    const handleRate = (session: Session) => {
      setSelectedSession(session);
      setIsRatingModalOpen(true);
    };

    const handleSubmitRating = async (rating: number, comment: string) => {
      if (!selectedSession) return;

      try {
        await api.post(`/sessions/${selectedSession._id}/rate`, { rating, comment });

        toast({
          title: 'Rating Submitted',
          description: 'Thank you for your feedback!',
        });

        // Optionally, update the session in the local state to reflect that it has been rated
        setSessions(sessions.map(s => 
          s._id === selectedSession._id ? { ...s, status: 'rated' as any } : s
        ));

      } catch (error) {
        console.error('Failed to submit rating:', error);
        toast({
          title: 'Error',
          description: 'Failed to submit rating. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsRatingModalOpen(false);
        setSelectedSession(null);
      }
    };

    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="text-primary text-sm font-semibold">
                  {counselorInitials}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{counselorName}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-1" />
                  {new Date(session.date).toLocaleDateString()}
                  <span className="mx-2">•</span>
                  <Clock size={14} className="mr-1" />
                  {sessionTime}
                  <span className="mx-2">•</span>
                  {session.duration} min
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {(session.status === 'upcoming' || session.status === 'paid') ? (
                <>
                  {session.sessionType === 'video' && (
                    <Button size="sm" onClick={handleJoinClick}>
                      <Video size={16} className="mr-1" />
                      Join Call
                    </Button>
                  )}
                  {session.sessionType === 'text' && (
                     <Button asChild size="sm">
                       <Link to={`/chat/${session.counselor?._id}`}>
                         Chat
                       </Link>
                     </Button>
                  )}
                </>
              ) : session.status === 'completed' ? (
                <>
                  <Button size="sm" variant="outline">View Summary</Button>
                  <Button size="sm" onClick={() => handleRate(session)}><Star size={16} className="mr-1"/>Rate</Button>
                </>
              ) : (
                <span className="text-sm text-gray-500 capitalize">{session.status}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <SidebarLayout activePath="/sessions">
      <div className="dashboard-background min-h-screen p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Sessions</h1>
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
                <p className="mb-4">You don't have any upcoming counseling sessions scheduled. Sessions are booked by counselors.</p>
              </div>
            ) : (
              <div>
                {upcomingSessions.map(session => (
                  <SessionCard key={session._id} session={session} currentTime={currentTime} />
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
                  <SessionCard key={session._id} session={session} currentTime={currentTime} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedSession && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          onSubmit={handleSubmitRating}
          counselorName={`${selectedSession.counselor.firstName} ${selectedSession.counselor.lastName}`}
        />
      )}
    </SidebarLayout>
  );
};

export default Sessions;
