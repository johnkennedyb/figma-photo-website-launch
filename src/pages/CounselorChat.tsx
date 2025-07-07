import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Video, Phone, MoreHorizontal, ArrowLeft } from 'lucide-react';
import WherebyVideoCall from '@/components/WherebyVideoCall';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { SocketContext, SocketProvider } from '@/context/SocketContext';
import axios from 'axios';

interface Message {
  _id: string;
  sender: { _id: string; name: string };
  receiver: { _id: string; name: string };
  content: string;
  timestamp: string;
}

interface Client {
  _id: string;
  name: string;
}

const CounselorChatContent: React.FC = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const { user: counselor, isAuthenticated, loading } = useAuth();
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();

  // State
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Jitsi State
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [videoCallRoomUrl, setVideoCallRoomUrl] = useState('');
  const [incomingVideoCall, setIncomingVideoCall] = useState<{ roomUrl: string; callerName: string; } | null>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat data and set up socket listeners
    useEffect(() => {
    // Wait for the authentication status to be determined
    if (loading) {
      return;
    }

    // Redirect if not authenticated or user data is not available
    if (!isAuthenticated || !counselor) {
      toast.error('Authentication required. Redirecting to login.');
      navigate('/counselor-login');
      return;
    }

    // Ensure the user is a counselor
    if (counselor.role !== 'counselor') {
      toast.error('Access Denied. You do not have permission to view this page.');
      navigate('/counselor-login');
      return;
    }
    
    // Ensure we have a client ID from the URL
    if (!clientId) {
      toast.error('No client specified.');
      navigate('/counselor-dashboard/messages');
      return;
    }

    const loadChatData = async () => {
      setIsLoading(true);
      try {
        const [clientRes, messagesRes] = await Promise.all([
          api.get(`/users/${clientId}`),
          api.get(`/messages/${clientId}`),
        ]);
        setClient(clientRes.data);
        setMessages(messagesRes.data);
      } catch (error) {
        console.error('Failed to load chat data:', error);
        toast.error('Failed to load chat data. Please try again later.');
        navigate('/counselor-dashboard/messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();

    if (socket) {
      const handleReceiveMessage = (message: Message) => {
        // Ensure the message is part of the current conversation
        if (message.sender._id === clientId || (message.sender._id === counselor._id && message.receiver._id === clientId)) {
          setMessages((prev) => [...prev, message]);
        }
      };

      const handleIncomingVideoCall = (data: { roomUrl: string; callerName: string; }) => {
        setIncomingVideoCall(data);
        toast.info(`Incoming video call from ${data.callerName}`);
      };

      const handleVideoCallEnded = () => {
        setIsVideoCallActive(false);
        setVideoCallRoomUrl('');
        toast.info('Video call has ended.');
      };

      const handleMessageError = (error: { message: string }) => {
        toast.error(`Failed to send message: ${error.message}`);
      };

      socket.on('receive-message', handleReceiveMessage);
      socket.on('incoming-video-call', handleIncomingVideoCall);
      socket.on('video-call-ended', handleVideoCallEnded);
      socket.on('message-error', handleMessageError);

      // Cleanup function
      return () => {
        socket.off('receive-message', handleReceiveMessage);
        socket.off('incoming-video-call', handleIncomingVideoCall);
        socket.off('video-call-ended', handleVideoCallEnded);
        socket.off('message-error', handleMessageError);
      };
    }
  }, [socket, clientId, counselor, isAuthenticated, navigate, loading]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket && counselor && clientId) {
      const messageData = {
        sender: counselor._id,
        receiver: clientId,
        content: newMessage,
      };
      socket.emit('send-message', messageData);
      setNewMessage('');
    }
  };

  const handleStartVideoCall = async () => {
    if (!socket || !counselor || !clientId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/whereby/create-meeting', {}, {
        headers: { 'x-auth-token': token }
      });
      const { roomUrl } = res.data;

      setVideoCallRoomUrl(roomUrl);
      setIsVideoCallActive(true);

      socket.emit('start-video-call', { to: clientId, roomUrl, callerName: counselor.name });
    } catch (error) {
      console.error('Error creating video call:', error);
    }
  };

  const handleAcceptVideoCall = () => {
    if (incomingVideoCall) {
      setVideoCallRoomUrl(incomingVideoCall.roomUrl);
      setIsVideoCallActive(true);
      setIncomingVideoCall(null);
    }
  };

  const handleDeclineVideoCall = () => {
    setIncomingVideoCall(null);
  };

  const handleVideoCallClose = () => {
    if (socket && clientId) {
      socket.emit('video-call-hang-up', { to: clientId });
    }
    setIsVideoCallActive(false);
    setVideoCallRoomUrl('');
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return <CounselorSidebarLayout activePath="/counselor/chat"><div className="flex items-center justify-center h-full">Loading chat...</div></CounselorSidebarLayout>;
  }

  if (!counselor || !client) {
    return <CounselorSidebarLayout activePath="/counselor/chat"><div className="flex items-center justify-center h-full">Could not load chat details.</div></CounselorSidebarLayout>;
  }

  return (
    <>
      <CounselorSidebarLayout activePath="/counselor/chat">
        <Toaster richColors />
        <div className="flex flex-col h-full">
          <header className="flex items-center p-4 border-b">
            <Link to="/counselor/chats">
              <Button variant="ghost" size="icon">
                <ArrowLeft />
              </Button>
            </Link>
            <div className="ml-4">
              <h2 className="text-lg font-bold">{client.name}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
            <div className="ml-auto flex items-center space-x-2">
                            <Button variant="ghost" size="icon" onClick={handleStartVideoCall}>
                <Video />
              </Button>
              <Button variant="ghost" size="icon">
                <Phone />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.sender._id === counselor._id ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`p-3 max-w-xs lg:max-w-md ${message.sender._id === counselor._id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p>{message.content}</p>
                    <span className="text-xs text-right block mt-1 opacity-75">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <Button variant="ghost" size="icon">
                <Paperclip />
              </Button>
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send />
              </Button>
            </form>
          </footer>
        </div>
      </CounselorSidebarLayout>

            {isVideoCallActive && (
        <WherebyVideoCall
          roomUrl={videoCallRoomUrl}
          onClose={handleVideoCallClose}
        />
      )}

            {incomingVideoCall && !isVideoCallActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 text-center">
                        <h3 className="text-lg font-semibold">Incoming Video Call from {incomingVideoCall.callerName}</h3>
            <div className="mt-4 flex gap-4">
                            <Button variant="outline" onClick={handleDeclineVideoCall}>Decline</Button>
                            <Button className="bg-green-500 hover:bg-green-600" onClick={handleAcceptVideoCall}>Accept</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

const CounselorChat: React.FC = () => (
  <SocketProvider>
    <CounselorChatContent />
  </SocketProvider>
);

export default CounselorChat;
