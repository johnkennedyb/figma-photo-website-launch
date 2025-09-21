import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, User, MessageSquare, Calendar, Heart, Settings, LogIn, LogOut } from 'lucide-react';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useLocation } from 'react-router-dom';

interface ActivityLogEntry {
  _id: string;
  action: string;
  details: string;
  timestamp: string;
  metadata?: any;
}

const ActivityLogs: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const { data: activities = [], isLoading } = useQuery<ActivityLogEntry[]>({
    queryKey: ['activity-logs', user?._id],
    queryFn: () => api.get('/users/activity-logs').then(res => res.data),
    enabled: !!user
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="w-4 h-4 text-green-500" />;
      case 'logout':
        return <LogOut className="w-4 h-4 text-red-500" />;
      case 'message_sent':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'session_booked':
      case 'session_completed':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'favorite_added':
      case 'favorite_removed':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'profile_updated':
      case 'settings_updated':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-red-100 text-red-800';
      case 'message_sent':
        return 'bg-blue-100 text-blue-800';
      case 'session_booked':
      case 'session_completed':
        return 'bg-purple-100 text-purple-800';
      case 'favorite_added':
      case 'favorite_removed':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hour${Math.floor(diffHours) !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} day${Math.floor(diffDays) !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout activePath={location.pathname}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading activity logs...</div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout activePath={location.pathname}>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Activity Log</h1>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Your activity history will appear here as you use the platform.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity._id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getActivityColor(activity.action)}>
                          {activity.action.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{activity.details}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default ActivityLogs;
