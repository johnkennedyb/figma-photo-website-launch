import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface RescheduleSessionModalProps {
  session: { _id: string; date: string };
  isOpen: boolean;
  onClose: () => void;
  onSessionRescheduled: (updatedSession: any) => void;
}

export const RescheduleSessionModal: React.FC<RescheduleSessionModalProps> = ({ session, isOpen, onClose, onSessionRescheduled }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(session.date));
  const { toast } = useToast();

  const handleReschedule = async () => {
    if (!selectedDate) {
      toast({ title: 'Error', description: 'Please select a new date.', variant: 'destructive' });
      return;
    }

    try {
      const response = await api.put(`/sessions/${session._id}/reschedule`, {
        date: selectedDate.toISOString(),
      });

      if (response.data) {
        toast({ title: 'Success', description: 'Session rescheduled successfully.' });
        onSessionRescheduled(response.data);
        onClose();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reschedule session.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Session</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleReschedule}>Confirm Reschedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
