import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { format, isSameDay } from 'date-fns';
import '@/styles/SessionsCalendar.css';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Session {
  _id: string;
  counselor?: User;
  client?: User;
  date: string;
  time: string;
  status: 'booked' | 'cancelled' | 'pending' | 'upcoming' | 'completed' | 'paid' | 'rated';
}

const SessionsCalendar: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/sessions');
        if (Array.isArray(response)) {
          setSessions(response);
        } else {
          console.error('Session data is not an array:', response);
          setSessions([]);
        }
      } catch (error) {
        toast({
          title: 'Error fetching sessions',
          description: 'Could not load your session data. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchSessions();
  }, [toast]);

  const sessionsOnSelectedDate = selectedDate
    ? sessions.filter(session => isSameDay(new Date(session.date), selectedDate))
    : [];

  const getStatusVariant = (status: Session['status']) => {
    switch (status) {
      case 'booked':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <SidebarLayout activePath="/sessions-calendar">
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-4">My Sessions Calendar</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full"
                  modifiers={{
                    hasSession: sessions.map(s => new Date(s.date))
                  }}
                  modifiersClassNames={{
                    hasSession: 'has-session'
                  }}
                />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  Sessions on {selectedDate ? format(selectedDate, 'PPP') : 'N/A'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionsOnSelectedDate.length > 0 ? (
                  <ul className="space-y-4">
                    {sessionsOnSelectedDate.map(session => (
                      <li key={session._id} className="p-3 rounded-lg border">
                        <div className="font-semibold">With {session.counselor ? `${session.counselor.firstName} ${session.counselor.lastName}` : session.client ? `${session.client.firstName} ${session.client.lastName}` : 'N/A'}</div>
                        <div className="text-sm text-gray-600">Time: {session.time}</div>
                        <Badge variant={getStatusVariant(session.status)} className="mt-2 capitalize">
                          {session.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No sessions on this date.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default SessionsCalendar;
