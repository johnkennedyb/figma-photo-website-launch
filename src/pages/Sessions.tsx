
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Video } from 'lucide-react';
import { RescheduleSessionModal } from '@/components/RescheduleSessionModal';
import { api } from '@/lib/api';

interface Counselor {
  _id: string;
  name: string;
}

interface Session {
  _id: string;
  counselor: Counselor;
  date: string;
  duration: number;
  sessionType: 'video' | 'text';
  status: 'upcoming' | 'completed' | 'cancelled' | 'paid';
  videoCallUrl?: string;
}

const Sessions: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/sessions');
        setSessions(res.data);
      } catch (error) {
        console.error('Failed to fetch sessions:', error);
        navigate('/login');
      }
    };

    fetchSessions();
  }, [navigate]);

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming' || s.status === 'paid');
  const pastSessions = sessions.filter(s => s.status !== 'upcoming' && s.status !== 'paid');

  const handleSessionRescheduled = (updatedSession: Session) => {
    setSessions(sessions.map(s => s._id === updatedSession._id ? updatedSession : s));
  };

  const SessionCard = ({ session, currentTime }: { session: Session, currentTime: Date }) => {
    const sessionTime = new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const counselorName = session.counselor?.name || 'Counselor';
    const counselorInitials = counselorName ? counselorName.split(' ').map(n => n[0]).join('') : 'C';

    const isJoinable = () => {
      if (!session.videoCallUrl || (session.status !== 'paid' && session.status !== 'upcoming')) {
        return false;
      }
      const sessionStart = new Date(session.date);
      // Allow joining only at or after the session start time
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
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedSession(session);
                    setIsModalOpen(true);
                  }}>Reschedule</Button>
                  
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
      <div className="dashboard-background min-h-screen p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Sessions</h1>
          <Link to="/counselors">
            <Button>
              <Calendar size={16} className="mr-1" />
              Book New Session
            </Button>
          </Link>
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
                <Link to="/counselors">
                  <Button>Book a Session</Button>
                </Link>
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
        <RescheduleSessionModal
          session={selectedSession}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSession(null);
          }}
          onSessionRescheduled={handleSessionRescheduled}
        />
      )}
    </SidebarLayout>
  );
};

export default Sessions;
