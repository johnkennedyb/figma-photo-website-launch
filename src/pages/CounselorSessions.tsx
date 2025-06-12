
import React, { useState } from 'react';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Search, Bell } from 'lucide-react';

const CounselorSessions: React.FC = () => {
  const [activeTab, setActiveTab] = useState('past');

  const pastSessions = [
    { id: 1, client: "Mr. Quadri Ajetunmobi", date: "15th of May 2025" },
    { id: 2, client: "Mr. Kareem Abbasl", date: "23rd of April 2025" },
    { id: 3, client: "Mrs. Fatima Nouman", date: "17th of April 2025" },
    { id: 4, client: "Mr. Yusuf Khan", date: "9th of April 2025" },
    { id: 5, client: "Mrs. Hamza Farouq", date: "8th of April 2025" },
    { id: 6, client: "Ms. Hana Kareem", date: "7th of April 2025" },
    { id: 7, client: "Mrs. Laila Hashmi", date: "30th of March 2025" },
    { id: 8, client: "Mr. Sani Idris", date: "15th of January 2025" }
  ];

  const upcomingSessions = [
    { id: 1, client: "Mr. Quadri Ajetunmobi" },
    { id: 2, client: "Mrs.Zainab Abdullahi" },
    { id: 3, client: "Miss Laila Hashmi" },
    { id: 4, client: "Mr. Sani Idris" },
    { id: 5, client: "Mrs. Amina Usman" },
    { id: 6, client: "Mrs. Safiya Abubakar" }
  ];

  const bookSessions = [
    { id: 1, client: "Mr. Muhammad Jabril" },
    { id: 2, client: "Miss Aishat Lawal" },
    { id: 3, client: "Mr. Sodiq Alanni" },
    { id: 4, client: "Mrs. Nafisa Idris" }
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
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'past' 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past Sessions
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'upcoming' 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming Sessions
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-4 px-6 text-center font-medium ${
              activeTab === 'book' 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Book Sessions
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'past' && (
            <div className="space-y-3">
              {pastSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center">
                    <span className="w-6 text-gray-500">{session.id}.</span>
                    <span className="ml-4">Session with {session.client}</span>
                  </div>
                  <span className="text-gray-500">{session.date}</span>
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'upcoming' && (
            <div>
              <div className="flex mb-6">
                <button className="flex-1 py-2 px-4 text-center border-b-2 border-gray-300 font-medium">
                  Schedules
                </button>
                <button className="flex-1 py-2 px-4 text-center border-b-2 border-transparent font-medium text-gray-500">
                  Chats
                </button>
              </div>
              
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center">
                      <span className="w-6 text-gray-500">{session.id}.</span>
                      <span className="ml-4">Session with {session.client}</span>
                    </div>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      View Schedule
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'book' && (
            <div className="space-y-3">
              {bookSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center">
                    <span className="w-6 text-gray-500">{session.id}.</span>
                    <span className="ml-4">{session.client}</span>
                  </div>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                    Book Session
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CounselorSidebarLayout>
  );
};

export default CounselorSessions;
