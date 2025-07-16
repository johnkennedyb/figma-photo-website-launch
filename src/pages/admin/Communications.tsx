import React, { useState } from 'react';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

const Communications: React.FC = () => {
  const [recipientGroup, setRecipientGroup] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleSendEmail = async () => {
    if (!subject || !message) {
      toast({ title: 'Error', description: 'Subject and message are required.', variant: 'destructive' });
      return;
    }
    if (!token) return;

    setIsSending(true);
    try {
      await api.post('/admin/bulk-email', 
        { recipientGroup, subject, message }, 
        {
          headers: { 'x-auth-token': token },
        }
      );
      toast({ title: 'Success', description: 'Email has been sent to the queue.' });
      setSubject('');
      setMessage('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send email.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminSidebarLayout activePath="/admin/communications">
      <Card>
        <CardHeader>
          <CardTitle>Send Bulk Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="recipient-group" className="block text-sm font-medium text-gray-700">Recipient Group</label>
            <Select value={recipientGroup} onValueChange={setRecipientGroup}>
              <SelectTrigger id="recipient-group">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="clients">Clients Only</SelectItem>
                <SelectItem value="counselors">Counselors Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your message here..." rows={10} />
          </div>
          <Button onClick={handleSendEmail} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send Email'}
          </Button>
        </CardContent>
      </Card>
    </AdminSidebarLayout>
  );
};

export default Communications;
