import React from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const BookingCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SidebarLayout activePath="/counselors">
      <div className="dashboard-background p-6 flex items-center justify-center">
        <div className="text-center bg-white/90 p-10 rounded-lg shadow-lg">
          <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Booking Canceled</h1>
          <p className="text-gray-600 mb-6">Your booking process was canceled. You have not been charged.</p>
          <Button onClick={() => navigate('/counselors')}>Back to Counselors</Button>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default BookingCancel;
