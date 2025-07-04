import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useCounselors = () => {
  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCounselors = async () => {
    try {
      const { data, error } = await supabase
        .from('counselor_profiles')
        .select(`
          *,
          profiles!inner(first_name, last_name, email)
        `)
        .eq('is_verified', true);

      if (error) throw error;
      setCounselors(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching counselors",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  return { counselors, loading, refetch: fetchCounselors };
};

export const useSessions = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          client_profiles:profiles!sessions_client_id_fkey(first_name, last_name, email),
          counselor_profiles:profiles!sessions_counselor_id_fkey(first_name, last_name, email)
        `)
        .or(`client_id.eq.${user.id},counselor_id.eq.${user.id}`)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching sessions",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  return { sessions, loading, refetch: fetchSessions };
};

export const useRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('counselor_requests')
        .select(`
          *,
          client_profiles:profiles!counselor_requests_client_id_fkey(first_name, last_name, email),
          counselor_profiles:profiles!counselor_requests_counselor_id_fkey(first_name, last_name, email)
        `)
        .or(`client_id.eq.${user.id},counselor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching requests",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('counselor_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;
      
      await fetchRequests();
      toast({
        title: "Request updated",
        description: `Request has been ${status}`
      });
    } catch (error: any) {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  return { requests, loading, refetch: fetchRequests, updateRequestStatus };
};

export const useEarnings = () => {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('earnings')
        .select(`
          *,
          sessions(title, scheduled_at)
        `)
        .eq('counselor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setEarnings(data || []);
      const total = data?.reduce((sum, earning) => sum + Number(earning.amount), 0) || 0;
      setTotalEarnings(total);
    } catch (error: any) {
      toast({
        title: "Error fetching earnings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  return { earnings, totalEarnings, loading, refetch: fetchEarnings };
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotifications(data || []);
      const unread = data?.filter(n => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error: any) {
      toast({
        title: "Error fetching notifications",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      await fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error updating notification",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return { notifications, unreadCount, loading, refetch: fetchNotifications, markAsRead };
};