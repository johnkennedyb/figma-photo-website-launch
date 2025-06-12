
import React from 'react';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Search, Bell } from 'lucide-react';

const CounselorRequests: React.FC = () => {
  const requests = [
    { name: "Mr. Abdulmalk Nuhu", status: "pending" },
    { name: "Mrs. Hadiza Kabiru", status: "pending" },
    { name: "Mrs. Zainab Abdullahi", status: "pending" },
    { name: "Usman Garba Nuhu", status: "pending" },
    { name: "Maryam Bashirat Aliyu", status: "pending" },
    { name: "Amina Folake Kareem", status: "pending" }
  ];

  return (
    <CounselorSidebarLayout activePath="/counselor-requests">
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
      
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Client's Requests</h2>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {requests.map((request, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <span className="text-gray-700">{request.name} sent you a request</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                  <Button variant="outline" size="sm">
                    Accept
                  </Button>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CounselorSidebarLayout>
  );
};

export default CounselorRequests;
