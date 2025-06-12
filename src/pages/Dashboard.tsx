
import React from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Bell } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-background">
      <SidebarLayout activePath="/dashboard">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-white">Welcome Quluub! 👋</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">My Profile</Button>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
              <Bell size={18} />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sessions card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/30">
            <h2 className="text-lg font-semibold mb-4 text-white">Sessions so far</h2>
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-4">
                  <Calendar size={24} className="text-white" />
                </div>
                <div className="ml-4 text-center">
                  <span className="text-3xl font-bold block text-white">0</span>
                  <span className="text-white/70">Sessions completed</span>
                </div>
              </div>
            </div>
            <Button className="w-full bg-teal-600 hover:bg-teal-700">Book a Session</Button>
          </div>
          
          {/* Next appointment card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/30">
            <h2 className="text-lg font-semibold mb-4 text-white">Next appointment date</h2>
            <div className="flex flex-col items-center justify-center py-8">
              <div className="mb-4 text-white/70">
                <Clock size={32} className="mx-auto mb-2" />
                <p>No upcoming sessions</p>
              </div>
              <Button className="w-full bg-teal-600 hover:bg-teal-700">Schedule Now</Button>
            </div>
          </div>
          
          {/* Favorite counsellors card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Favorite Counsellors</h2>
              <Button variant="link" className="text-white hover:text-white/80">See all</Button>
            </div>
            
            <div className="border-t border-white/30 py-4">
              <p className="text-white/70 text-center py-4">
                You haven't added any counsellors to your favorites yet
              </p>
              <Button variant="outline" className="w-full bg-white/20 text-white border-white/30 hover:bg-white/30">Find Counsellors</Button>
            </div>
          </div>
          
          {/* Notifications card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <Button variant="link" className="text-white hover:text-white/80">Clear all</Button>
            </div>
            
            <div className="border-t border-white/30 py-4">
              <div className="flex items-start p-3 bg-white/10 rounded-md">
                <div className="bg-white/20 rounded-full p-2 mr-3">
                  <Bell size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">Profile setup</p>
                  <p className="text-sm text-white/70">Complete your profile to get personalized recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </div>
  );
};

export default Dashboard;
