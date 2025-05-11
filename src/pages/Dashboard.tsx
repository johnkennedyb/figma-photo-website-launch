
import React from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Bell } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <SidebarLayout activePath="/dashboard">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Welcome Quluub! 👋</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">My Profile</Button>
          <Button size="icon" variant="ghost">
            <Bell size={18} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sessions card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Sessions so far</h2>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center">
              <div className="bg-primary/10 rounded-full p-4">
                <Calendar size={24} className="text-primary" />
              </div>
              <div className="ml-4 text-center">
                <span className="text-3xl font-bold block">0</span>
                <span className="text-gray-500">Sessions completed</span>
              </div>
            </div>
          </div>
          <Button className="w-full">Book a Session</Button>
        </div>
        
        {/* Next appointment card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Next appointment date</h2>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 text-gray-500">
              <Clock size={32} className="mx-auto mb-2" />
              <p>No upcoming sessions</p>
            </div>
            <Button className="w-full">Schedule Now</Button>
          </div>
        </div>
        
        {/* Favorite counsellors card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
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
        <div className="bg-white rounded-lg shadow-sm p-6">
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
    </SidebarLayout>
  );
};

export default Dashboard;
