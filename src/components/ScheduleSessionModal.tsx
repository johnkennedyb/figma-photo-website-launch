import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Counselor } from '../types';

import { User } from '../types';

interface ScheduleSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  counselor?: Counselor;
  client?: User;
  onSessionScheduled: (session: any) => void;
}

const ScheduleSessionModal: React.FC<ScheduleSessionModalProps> = ({ isOpen, onClose, counselor, client, onSessionScheduled }) => {
  const [sessionDate, setSessionDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!sessionDate || sessionDate.trim() === '') {
      toast({ title: 'Error', description: 'Please select a date and time.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      let payload = {};
      // When a counselor books for a client, both IDs are needed.
      if (counselor && counselor._id && client && client._id) {
        payload = { counselorId: counselor._id, clientId: client._id, date: sessionDate };
      } 
      // When a client books for themselves, only the counselorId is needed.
      else if (counselor && counselor._id) {
        payload = { counselorId: counselor._id, date: sessionDate };
      } 
      // When a counselor books from the chat, the client object is passed.
      // The counselor's ID is also needed to determine the session rate.
      else if (client && client._id && counselor && counselor._id) {
        payload = { clientId: client._id, counselorId: counselor._id, date: sessionDate };
      } 
      // If neither is present, scheduling cannot proceed.
      else {
        toast({ title: 'Error', description: 'Client or counselor data is missing. Cannot schedule.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const response = await api.post('/sessions/schedule', payload);
      toast({ title: 'Success', description: 'Session scheduled successfully.' });
      onSessionScheduled(response.data);
      onClose();
    } catch (error) {
      // Improved error logging for backend error response
      let errorMsg = 'Failed to schedule session. Please try again.';
      if (error.response && error.response.data && error.response.data.msg) {
        errorMsg = error.response.data.msg;
      }
      console.error('Failed to schedule session:', errorMsg, error);
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Schedule a New Session</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <label htmlFor="session-time" className="block text-sm font-medium text-gray-300 mb-1">Select Date and Time</label>
          <Input
            id="session-time"
            type="datetime-local"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="text-white border-gray-600 hover:bg-gray-700">
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
            {isLoading ? 'Scheduling...' : 'Schedule Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleSessionModal;
