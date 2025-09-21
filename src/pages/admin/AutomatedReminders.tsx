import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { Clock, Plus, Trash2, Calendar, Mail } from 'lucide-react';

interface Reminder {
  id: string;
  subject: string;
  recipients: string;
  scheduleType: string;
  isActive: boolean;
  nextRun: string;
}

const AutomatedReminders: React.FC = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    recipients: 'clients',
    subject: '',
    message: '',
    scheduleType: 'weekly',
    scheduleDate: '',
    frequency: '1'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const { data: reminders = [], refetch } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: () => api.get('/reminders').then(res => res.data)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast({ title: 'Error', description: 'Subject and message are required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/reminders/schedule', formData);
      toast({ title: 'Success', description: 'Reminder scheduled successfully' });
      setShowCreateDialog(false);
      setFormData({
        recipients: 'clients',
        subject: '',
        message: '',
        scheduleType: 'weekly',
        scheduleDate: '',
        frequency: '1'
      });
      refetch();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to schedule reminder', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/reminders/${id}`);
      toast({ title: 'Success', description: 'Reminder cancelled successfully' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to cancel reminder', variant: 'destructive' });
    }
  };

  const getScheduleTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecipientLabel = (recipients: string) => {
    switch (recipients) {
      case 'clients': return 'All Clients';
      case 'counselors': return 'All Counselors';
      case 'approved-counselors': return 'Approved Counselors';
      case 'active-clients': return 'Active Clients';
      default: return recipients;
    }
  };

  return (
    <AdminSidebarLayout activePath="/admin/reminders">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Automated Reminders</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Reminder
          </Button>
        </div>

        <div className="grid gap-4">
          {reminders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reminders Set</h3>
                <p className="text-muted-foreground mb-4">
                  Create automated reminders to keep users engaged.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  Create First Reminder
                </Button>
              </CardContent>
            </Card>
          ) : (
            reminders.map(reminder => (
              <Card key={reminder.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{reminder.subject}</h3>
                        <Badge className={getScheduleTypeColor(reminder.scheduleType)}>
                          {reminder.scheduleType}
                        </Badge>
                        <Badge variant={reminder.isActive ? 'default' : 'secondary'}>
                          {reminder.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Recipients: {getRecipientLabel(reminder.recipients)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Next run: {new Date(reminder.nextRun).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reminder.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automated Reminder</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Recipients</label>
                  <Select 
                    value={formData.recipients} 
                    onValueChange={(value) => setFormData({...formData, recipients: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clients">All Clients</SelectItem>
                      <SelectItem value="counselors">All Counselors</SelectItem>
                      <SelectItem value="approved-counselors">Approved Counselors</SelectItem>
                      <SelectItem value="active-clients">Active Clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule</label>
                  <Select 
                    value={formData.scheduleType} 
                    onValueChange={(value) => setFormData({...formData, scheduleType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Reminder subject"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Use {{firstName}} and {{lastName}} for personalization"
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {{firstName}} and {{lastName}} for personalization
                </p>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Scheduling...' : 'Schedule Reminder'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminSidebarLayout>
  );
};

export default AutomatedReminders;
