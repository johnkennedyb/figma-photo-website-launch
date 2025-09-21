import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { Mail, Users, Send } from 'lucide-react';

const BulkEmail: React.FC = () => {
  const [formData, setFormData] = useState({
    recipients: 'all',
    userType: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast({ title: 'Error', description: 'Subject and message are required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/admin/bulk-email', formData);
      toast({ title: 'Success', description: `Email sent to ${response.data.count} users` });
      setFormData({ recipients: 'all', userType: '', subject: '', message: '' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.msg || 'Failed to send emails', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminSidebarLayout activePath="/admin/bulk-email">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Bulk Email</h1>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Bulk Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recipients</label>
                <Select 
                  value={formData.recipients} 
                  onValueChange={(value) => setFormData({...formData, recipients: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        All Users
                      </div>
                    </SelectItem>
                    <SelectItem value="clients">All Clients</SelectItem>
                    <SelectItem value="counselors">All Counselors</SelectItem>
                    <SelectItem value="approved-counselors">Approved Counselors Only</SelectItem>
                    <SelectItem value="pending-counselors">Pending Counselors Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Email subject"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Email message (use {{firstName}} for personalization)"
                  rows={8}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {{firstName}} and {{lastName}} for personalization
                </p>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Send className="w-4 h-4 mr-2 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Bulk Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminSidebarLayout>
  );
};

export default BulkEmail;