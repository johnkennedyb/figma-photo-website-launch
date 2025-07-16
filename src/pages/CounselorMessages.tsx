import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
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

const CounselorMessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await api.get<Conversation[]>('/messages');
        setConversations(data);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
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
  }, [toast]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <CounselorSidebarLayout activePath="/counselor/messages">
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
                  <Link to={`/counselor/chat/${convo.withUser._id}`}>
                    <div className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage src={convo.withUser.profilePicture || `https://ui-avatars.com/api/?name=${convo.withUser.firstName}+${convo.withUser.lastName}&background=random`} />
                        <AvatarFallback>{((convo.withUser.firstName?.[0] || '') + (convo.withUser.lastName?.[0] || '')).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{`${convo.withUser.firstName} ${convo.withUser.lastName}`}</h3>
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
    </CounselorSidebarLayout>
  );
};

export default CounselorMessagesPage;
