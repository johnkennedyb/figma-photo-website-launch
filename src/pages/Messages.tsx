import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  _id: string;
  name: string;
  role: string;
}

interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  timestamp: string;
}

interface Conversation {
  withUser: User;
  lastMessage: Message;
}

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${apiUrl}/api/messages`, {
          headers: { 'x-auth-token': token },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const data = await res.json();
        setConversations(data);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Could not load conversations.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [navigate, toast]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SidebarLayout activePath="/messages">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Messages</h1>
        <Card className="p-4">
          {loading ? (
            <p>Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p>No conversations yet.</p>
          ) : (
            <ul className="space-y-2">
              {conversations.map((convo) => (
                <li key={convo.withUser._id}>
                  <Link to={`/chat/${convo.withUser._id}`}>
                    <div className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${convo.withUser.name.replace(' ', '+')}&background=random`} />
                        <AvatarFallback>{convo.withUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{convo.withUser.name}</h3>
                          <span className="text-xs text-gray-500">{formatTime(convo.lastMessage.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{convo.lastMessage.content}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default MessagesPage;
