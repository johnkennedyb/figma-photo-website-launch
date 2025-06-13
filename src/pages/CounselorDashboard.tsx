
import React from 'react';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Search, Bell } from 'lucide-react';

const CounselorDashboard: React.FC = () => {
  return (
    <div className="dashboard-background">
      <CounselorSidebarLayout activePath="/counselor-dashboard">
      <div className="dashboard-background min-h-screen p-6">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-white">Welcome Musa! 👋</h1>
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
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Current Clients */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Current Clients</h3>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-teal-600 mb-2">8</div>
                  <div className="text-gray-500">Sessions</div>
                </div>
              </div>
            </div>
            
            {/* Next Session Date */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Next session date</h3>
              <div className="flex items-center justify-center py-6">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">📅</div>
                  <div className="text-lg font-medium">9th of May 2025</div>
                  <div className="text-gray-500">11:30 am</div>
                  <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
                    Reschedule
                  </Button>
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
                <span className="font-semibold">#850,800</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Year</span>
                <span className="font-semibold">#400,800</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Month</span>
                <span className="font-semibold">#80,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Week</span>
                <span className="font-semibold">#15,000</span>
              </div>
            </div>
          </div>
        </div>
        </ div>
      </CounselorSidebarLayout>
    </div>
  );
};

export default CounselorDashboard;
