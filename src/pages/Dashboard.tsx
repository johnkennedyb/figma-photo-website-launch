
import React from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Bell, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSessions, useNotifications } from '@/hooks/useData';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { sessions, loading: sessionsLoading } = useSessions();
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date());
  const nextSession = upcomingSessions.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

  return (
    <div className="dashboard-background">
      <SidebarLayout activePath="/dashboard">
      <div className="dashboard-background p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-white">
              Welcome {userProfile?.first_name}! 👋
            </h1>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                onClick={() => navigate('/settings')}
              >
                My Profile
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-white hover:bg-white/20 relative"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sessions card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Sessions so far</h2>
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center">
                <div className="bg-primary/10 rounded-full p-4">
                  <Calendar size={24} className="text-primary" />
                </div>
                <div className="ml-4 text-center">
                  <span className="text-3xl font-bold block">{completedSessions}</span>
                  <span className="text-gray-500">Sessions completed</span>
                </div>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => navigate('/counselors')}
            >
              <Plus size={16} className="mr-2" />
              Book a Session
            </Button>
          </div>
          
          {/* Next appointment card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Next appointment date</h2>
            <div className="flex flex-col items-center justify-center py-8">
              {nextSession ? (
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full p-4 mx-auto mb-4 w-fit">
                    <Calendar size={32} className="text-primary" />
                  </div>
                  <p className="font-semibold text-lg">
                    {new Date(nextSession.scheduled_at).toLocaleDateString()}
                  </p>
                  <p className="text-gray-500 mb-4">
                    {new Date(nextSession.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">{nextSession.title}</p>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/sessions')}
                  >
                    View Session
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Clock size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 mb-4">No upcoming sessions</p>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/counselors')}
                  >
                    Schedule Now
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Favorite counsellors card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Favorite Counsellors</h2>
              <Button variant="link" className="text-primary">See all</Button>
            </div>
            
            <div className="border-t py-4">
              <p className="text-gray-500 text-center py-4">
                You haven't added any counsellors to your favorites yet
              </p>
              <Button variant="outline" className="w-full">Find Counsellors</Button>
            </div>
          </div>
          
          {/* Notifications card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {notifications.length > 0 && (
                <Button variant="link" className="text-primary">Clear all</Button>
              )}
            </div>
            
            <div className="border-t py-4">
              {notifications.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className={`flex items-start p-3 rounded-md ${notification.is_read ? 'bg-gray-50' : 'bg-primary/5'}`}>
                      <div className="bg-primary/10 rounded-full p-2 mr-3">
                        <Bell size={16} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div></div>
       
      </SidebarLayout>
    </div>
  );
};

export default Dashboard;
