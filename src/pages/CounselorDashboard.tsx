import React, { useEffect, useState, useContext } from 'react';
import { SocketContext, SocketProvider } from '@/context/SocketContext';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Search, Bell } from 'lucide-react';
import { api } from '@/lib/api';

interface User {
  name: string;
}

interface Session {
  _id: string;
  user: { _id: string; name: string };
  date: string;
  status: string;
}

interface Earnings {
  total: number;
  year: number;
  month: number;
  week: number;
}

const CounselorDashboardContent: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { socket } = useContext(SocketContext);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setIsDataLoading(false);
        return;
      }
      
      setIsDataLoading(true);
      setFetchError(null);
      
      try {
        const [sessionsRes, walletRes] = await Promise.allSettled([
          api.get('/sessions/list-for-counselor'),
          api.get('/wallet/counselor'),
        ]);

        if (sessionsRes.status === 'fulfilled') {
          setSessions(sessionsRes.value.data || []);
        } else {
          console.error('Failed to fetch sessions:', sessionsRes.reason.response?.data || sessionsRes.reason);
          if (sessionsRes.reason.response?.status !== 404) {
            setFetchError(prev => (prev ? `${prev} ` : '') + 'Failed to load session data.');
          }
        }

        if (walletRes.status === 'fulfilled') {
          setEarnings(walletRes.value.data.earnings);
          setBalance(walletRes.value.data.balance);
        } else {
          console.error('Failed to fetch wallet data:', walletRes.reason.response?.data || walletRes.reason);
          if (walletRes.reason.response?.status !== 404) {
            setFetchError(prev => (prev ? `${prev} ` : '') + 'Failed to load wallet data.');
          }
        }
      } catch (error) {
        console.error('An unexpected error occurred while fetching dashboard data:', error);
        setFetchError('An unexpected error occurred. Please try again later.');
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket) {
      const handleSessionBooked = (newSession: Session) => {
        setSessions(prev => [...prev, newSession]);
      };

      const handleSessionUpdated = (updatedSession: Session) => {
        setSessions(prev => prev.map(s => s._id === updatedSession._id ? updatedSession : s));
      };

      const handleWalletUpdate = async () => {
        try {
          const walletRes = await api.get('/wallet/counselor');
          setEarnings(walletRes.data.earnings);
          setBalance(walletRes.data.balance);
        } catch (error) {
          console.error('Failed to fetch earnings', error);
        }
      };

      socket.on('session-booked', handleSessionBooked);
      socket.on('session-updated', handleSessionUpdated);
      socket.on('wallet-updated', handleWalletUpdate);

      return () => {
        socket.off('session-booked', handleSessionBooked);
        socket.off('session-updated', handleSessionUpdated);
        socket.off('wallet-updated', handleWalletUpdate);
      };
    }
  }, [socket]);

  const upcomingSessions = sessions.filter(s => s && new Date(s.date) > new Date() && s.status === 'confirmed');
  upcomingSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextSession = upcomingSessions[0];

  const totalClients = new Set(sessions.filter(s => s && s.user).map(s => s.user._id)).size;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/counselor-login" replace />;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <CounselorSidebarLayout activePath="/counselor-dashboard">
      <div className="min-h-screen p-6">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-white">Welcome {user.name}! 👋</h1>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Link to="/counselor/profile/edit">Edit Profile</Link>
            </Button>
            <Button variant="outline" size="icon" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Search size={16} />
            </Button>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                <Bell size={18} />
            </Button>
          </div>
        </div>
        
        {isDataLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : fetchError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{fetchError}</span>
          </div>
        ) : (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Current Clients */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Current Clients</h3>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600 mb-2">{totalClients}</div>
                  <div className="text-gray-500">Clients</div>
                </div>
              </div>
            </div>
            
            {/* Next Session Date */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Next session date</h3>
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">📅</div>
                                    {nextSession ? (
                    <>
                      <div className="text-lg font-medium">{new Date(nextSession.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-gray-500">{new Date(nextSession.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      <Button asChild className="mt-4 bg-teal-600 hover:bg-teal-700">
                        <Link to="/counselor-sessions">View Session</Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-500">No upcoming sessions.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Earnings Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <span className="text-xl mr-2">💰</span>
              <h3 className="text-lg font-medium">Earnings</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total amount earned so far</span>
                <span className="font-semibold">₦{balance.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Year</span>
                <span className="font-semibold">₦{earnings?.year.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">₦{earnings?.month.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold">₦{earnings?.week.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
        )}
        </ div>
      </CounselorSidebarLayout>
    </div>
  );
};

const CounselorDashboard: React.FC = () => (
  <SocketProvider>
    <CounselorDashboardContent />
  </SocketProvider>
);

export default CounselorDashboard;
