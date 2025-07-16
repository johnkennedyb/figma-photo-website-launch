
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Bell } from 'lucide-react';
import { RescheduleSessionModal } from '@/components/RescheduleSessionModal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Session {
  _id: string;
  client: Client;
  date: string;
  duration: number;
  sessionType: 'video' | 'text';
  status: 'paid' | 'completed' | 'canceled' | 'upcoming' | 'pending_payment';
  videoCallUrl?: string;
}

const CounselorSessions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('past');
  const [sessions, setSessions] = useState<Session[]>([]);
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/sessions');
        setSessions(response.data);
      } catch (error: unknown) {
        console.error('Failed to fetch sessions:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch sessions.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchData();
    } else if (!isLoading) {
      navigate('/counselor-login');
    }
  }, [token, navigate, toast, isLoading]);

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await api.put(`/sessions/${sessionId}/complete`);
      setSessions(prevSessions =>
        prevSessions.map(s =>
          s._id === sessionId ? { ...s, status: 'completed' } : s
        )
      );
      toast({ title: 'Success', description: 'Session marked as complete! Funds added to your wallet.' });
    } catch (error: unknown) {
      let errorMessage = 'Failed to complete session.';
      if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

    const handleSessionRescheduled = (updatedSession: Session) => {
    setSessions(sessions.map(s => s._id === updatedSession._id ? updatedSession : s));
  };

  const upcomingSessions = sessions.filter(s => (['paid', 'upcoming', 'pending_payment'].includes(s.status)) && new Date(s.date) > new Date());
  const needsCompletionSessions = sessions.filter(s => s.status === 'paid' && new Date(s.date) <= new Date());
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="dashboard-background">
      <CounselorSidebarLayout activePath="/counselor/sessions">
        <div className="dashboard-background min-h-screen p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-white">Welcome {user?.firstName} {user?.lastName}! 👋</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Search size={16} className="mr-2" />
                Search
              </Button>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                <Bell size={18} />
              </Button>
            </div>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="past">Past Sessions</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
                    <TabsTrigger value="book" className="bg-teal-600 text-white data-[state=active]:bg-teal-700">Book Sessions</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="past" className="mt-0">
                  <div className="space-y-4">
                    {isLoading ? <p>Loading...</p> : (needsCompletionSessions.length > 0 || completedSessions.length > 0) ? (
                      <>
                        {needsCompletionSessions.map((session, index) => (
                          <div key={session._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                            <div className="flex items-center">
                              <span className="text-gray-600 mr-4">{index + 1}.</span>
                              <span className="text-gray-700">{(session.client ? `${session.client.firstName} ${session.client.lastName}` : undefined) || 'Client'}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleCompleteSession(session._id)} size="sm" className="bg-green-600 hover:bg-green-700">
                                Complete Session
                              </Button>
                              <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700">
                                <Link to={`/counselor/chat/${session.client?._id}`}>Message Client</Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                        {completedSessions.map((session, index) => (
                          <div key={session._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                            <div className="flex items-center">
                              <span className="text-gray-600 mr-4">{index + needsCompletionSessions.length + 1}.</span>
                              <span className="text-gray-700">{(session.client ? `${session.client.firstName} ${session.client.lastName}` : undefined) || 'Client'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-600 font-medium">Completed</span>
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/counselor/chat/${session.client?._id}`}>View Chat</Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : <p className="text-center text-gray-500 py-4">No past sessions.</p>}
                  </div>
                </TabsContent>

                <TabsContent value="upcoming" className="mt-0">
                  <div className="space-y-4">
                    {isLoading ? <p>Loading...</p> : upcomingSessions.length > 0 ? upcomingSessions.map((session) => {
                      const sessionStart = new Date(session.date);
                      const tenMinutesBefore = new Date(sessionStart.getTime() - 10 * 60 * 1000);
                      const twoHoursAfter = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);
                      const canJoin = session.videoCallUrl && (session.status === 'paid' || session.status === 'upcoming') && currentTime >= tenMinutesBefore && currentTime < twoHoursAfter;

                      return (
                        <div key={session._id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                          <div className="flex items-center">
                            <span className="text-gray-700">{(session.client ? `${session.client.firstName} ${session.client.lastName}` : undefined) || 'Client'}</span>
                            <span className="text-gray-500 ml-4">
                              {new Date(session.date).toLocaleDateString()} - {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                              Reschedule
                            </Button>
                            {session.sessionType === 'video' && (
                              <Button asChild size="sm" disabled={!canJoin} className="bg-teal-600 hover:bg-teal-700">
                                <a href={canJoin ? session.videoCallUrl : undefined} target="_blank" rel="noopener noreferrer">
                                  Join Call
                                </a>
                              </Button>
                            )}
                            <Button asChild size="sm" variant="outline">
                              <Link to={`/counselor/chat/${session.client?._id}`}>Message Client</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    }) : <p className="text-center text-gray-500 py-4">No upcoming sessions.</p>}
                  </div>
                </TabsContent>

                <TabsContent value="book" className="mt-0">
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Book a new session with your clients</p>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      Schedule New Session
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </CounselorSidebarLayout>
      {selectedSession && (
        <RescheduleSessionModal
          session={selectedSession}
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          onSessionRescheduled={handleSessionRescheduled}
        />
      )}
    </div>
  );
};

export default CounselorSessions;
