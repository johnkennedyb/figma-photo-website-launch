
import React, { useState } from 'react';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Bell } from 'lucide-react';

const CounselorSessions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('past');

  const pastSessions = [
    { id: 1, name: 'Mr. Mohammed Jibril', status: 'completed' },
    { id: 2, name: 'Miss Aisha Lawal', status: 'completed' },
    { id: 3, name: 'Mr. Sola Alanni', status: 'completed' },
    { id: 4, name: 'Mrs. Nifikiat Idris', status: 'completed' }
  ];

  const upcomingSessions = [
    { id: 1, name: 'Mr. Ahmed Hassan', time: '10:00 AM', date: 'Today' },
    { id: 2, name: 'Mrs. Fatima Bello', time: '2:00 PM', date: 'Tomorrow' }
  ];

  return (
    <CounselorSidebarLayout activePath="/counselor-sessions">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Welcome Musa! 👋</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700">
            <Search size={16} className="mr-2" />
            Search
          </Button>
          <Button size="icon" variant="ghost">
            <Bell size={18} />
          </Button>
        </div>
      </div>
      
      <Card className="bg-white">
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
                {pastSessions.map((session, index) => (
                  <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-4">{index + 1}.</span>
                      <span className="text-gray-700">{session.name}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Book Session
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-0">
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center">
                      <span className="text-gray-700">{session.name}</span>
                      <span className="text-gray-500 ml-4">{session.time} - {session.date}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Reschedule
                      </Button>
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                        Start Session
                      </Button>
                    </div>
                  </div>
                ))}
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
    </CounselorSidebarLayout>
  );
};

export default CounselorSessions;
