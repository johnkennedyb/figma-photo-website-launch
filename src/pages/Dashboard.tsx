import React, { useEffect, useState, useContext } from 'react';
import { SocketContext } from '@/context/SocketContext';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/ui/StarRating';
import { Calendar, Clock, Bell, Wallet as WalletIcon } from 'lucide-react';
import MiniCalendar from '@/components/MiniCalendar';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
    specialties?: string[];
  rating?: number;
}

interface Session {
  _id: string;
  date: string;
  status: 'upcoming' | 'completed' | 'canceled' | 'paid';
}

interface Wallet {
  balance: number;
  currency: string;
}

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, loading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [favoriteCounselors, setFavoriteCounselors] = useState<User[]>([]);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsData, walletData, favoritesData] = await Promise.all([
          api.get('/sessions'),
          api.get('/wallet'),
          api.get('/users/favorites'),
        ]);
        if (Array.isArray(sessionsData)) {
          setSessions(sessionsData);
        } else {
          console.error('Failed to fetch sessions or data is not in expected format', sessionsRes);
          setSessions([]); // Ensure sessions is an array
        }
        if (walletData) {
          setWallet(walletData);
        } else {
          console.error('Failed to fetch wallet data or data is not in expected format', walletRes);
          setWallet(null);
        }
        if (Array.isArray(favoritesData)) {
          setFavoriteCounselors(favoritesData);
        } else {
          console.error('Failed to fetch favorite counselors or data is not in expected format', favoritesRes);
          setFavoriteCounselors([]);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }

    const handleSessionUpdate = (updatedSession: Session) => {
      setSessions(prevSessions => 
        prevSessions.map(s => s._id === updatedSession._id ? updatedSession : s)
      );
    };

    const handleNewSession = (newSession: Session) => {
      setSessions(prevSessions => [...prevSessions, newSession]);
    };

    const handleWalletUpdate = (updatedWallet: Wallet) => {
      setWallet(updatedWallet);
    };

    if (socket) {
      socket.on('session-updated', handleSessionUpdate);
      socket.on('session-booked', handleNewSession);
      socket.on('wallet-updated', handleWalletUpdate);
  
      return () => {
        socket.off('session-updated', handleSessionUpdate);
        socket.off('session-booked', handleNewSession);
        socket.off('wallet-updated', handleWalletUpdate);
      };
    }

  }, [isAuthenticated, socket]);

  const renderWalletBalance = () => {
    if (wallet && typeof wallet.balance === 'number' && typeof wallet.currency === 'string') {
      return `${wallet.balance.toFixed(2)} ${wallet.currency.toUpperCase()}`;
    }
    return 'Loading...';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const upcomingSessions = Array.isArray(sessions)
    ? sessions.filter(s => s.status === 'upcoming' || s.status === 'paid').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];
  const completedSessions = Array.isArray(sessions) ? sessions.filter(s => s.status === 'completed') : [];

  return (
      <SidebarLayout activePath="/dashboard">
        <div className="p-4 md:p-6">
          <div className="flex items-center bg-dark justify-between mb-8">
            <h1 className="text-2xl font-semibold text-white">Welcome {user.firstName} {user.lastName}! 👋</h1>
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <Button variant="outline" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">My Profile</Button>
              </Link>
              <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                <Bell size={18} />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sessions card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Sessions so far</h2>
              <div className="flex flex-col md:flex-row items-center justify-center mb-6 gap-6 md:gap-0">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-4">
                    <Calendar size={24} className="text-green-600" />
                  </div>
                  <div className="ml-4 text-center">
                    <span className="text-3xl font-bold block">{completedSessions.length}</span>
                    <span className="text-gray-500">Completed</span>
                  </div>
                </div>
                <div className="w-24 h-px bg-gray-200 md:hidden"></div>
                <div className="border-l md:mx-8 h-12 hidden md:block"></div>
                <div className="flex items-center">
                  <div className="bg-primary/10 rounded-full p-4">
                    <Clock size={24} className="text-primary" />
                  </div>
                  <div className="ml-4 text-center">
                    <span className="text-3xl font-bold block">{upcomingSessions.length}</span>
                    <span className="text-gray-500">Upcoming</span>
                  </div>
                </div>
              </div>
              <Link to="/sessions">
                <Button className="w-full">View Sessions</Button>
              </Link>
            </div>
            
            {/* Next appointment card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Next appointment</h2>
              {upcomingSessions.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <MiniCalendar date={new Date(upcomingSessions[0]?.date || Date.now())} />
                  <p className="text-gray-600">
                    {new Date(upcomingSessions[0].date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <Link to="/sessions">
                    <Button>View</Button>
                  </Link>
                </div>
              ) : (
                <p className="text-center text-gray-500">No upcoming sessions</p>
              )}
            </div>

            {/* Favorite counsellors card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Favorite Counsellors ({favoriteCounselors.length})</h2>
                <Link to="/counselors?favorites=true">
                  <Button variant="link" className="text-primary">See all</Button>
                </Link>
              </div>
              {favoriteCounselors.length > 0 ? (
                <ul className="space-y-3">
                  {favoriteCounselors.slice(0, 3).map(counselor => (
                    <li key={counselor._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                          {counselor.firstName?.[0] || ''}{counselor.lastName?.[0] || ''}
                        </div>
                        <div className="ml-3">
                          <p className="font-semibold">{counselor.firstName} {counselor.lastName}</p>
                          <p className="text-sm text-gray-500">{counselor.specialties?.[0] || 'General'}</p>
                          {counselor.rating !== undefined && <StarRating rating={counselor.rating} />}
                        </div>
                      </div>

                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>You haven't added any favorite counselors yet.</p>
                  <Link to="/counselors">
                    <Button className="mt-4">Find Counselors</Button>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Notifications card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <Button variant="link" className="text-primary">Clear all</Button>
              </div>
              
              <div className="border-t py-4">
                <div className="flex items-start p-3 bg-primary/5 rounded-md">
                  <div className="bg-primary/10 rounded-full p-2 mr-3">
                    <Bell size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Profile setup</p>
                    <p className="text-sm text-gray-600">Complete your profile to get personalized recommendations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
  );
};

export default Dashboard;


