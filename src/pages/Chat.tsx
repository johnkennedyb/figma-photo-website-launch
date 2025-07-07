import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Video, Phone, MoreHorizontal, ArrowLeft } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WherebyVideoCall from '@/components/WherebyVideoCall';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { SocketContext, SocketProvider } from '../context/SocketContext';


interface Message {
  _id: string;
  sender: { _id: string; name: string };
  receiver: { _id: string; name: string };
  content: string;
  timestamp: string;
}

interface Counselor {
  _id: string;
  name: string;
}

const ChatContent: React.FC = () => {
  const { id: counselorId } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();

  // State
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [counselor, setCounselor] = useState<Counselor | null>(null);
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
    if (!isAuthenticated || !user || !counselorId) {
      navigate('/login');
      return;
    }

    const loadChatData = async () => {
      setIsLoading(true);
      try {
        const [counselorRes, messagesRes] = await Promise.all([
                    api.get(`/counselors/${counselorId}`),
          api.get(`/messages/${counselorId}`),
        ]);
        setCounselor(counselorRes.data);
        setMessages(messagesRes.data);
      } catch (error: any) {
        console.error('Failed to load chat data:', error.response?.data || error);
        toast.error(`Failed to load chat data: ${error.response?.data?.msg || 'Please try again later.'}`);
        navigate('/counselors');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();

    if (socket) {
      const handleReceiveMessage = (message: Message) => {
        if (message.sender._id === counselorId || message.sender._id === user._id) {
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

      socket.on('receive-message', handleReceiveMessage);
      socket.on('incoming-video-call', handleIncomingVideoCall);
      socket.on('video-call-ended', handleVideoCallEnded);



      return () => {
        socket.off('receive-message', handleReceiveMessage);
        socket.off('incoming-video-call', handleIncomingVideoCall);
        socket.off('video-call-ended', handleVideoCallEnded);
      };
    }
  }, [socket, counselorId, user, isAuthenticated, navigate]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && user && counselorId) {
      try {
        await api.post('/messages', {
          receiver: counselorId,
          content: newMessage,
        });
        setNewMessage('');
      } catch (error: any) {
        console.error('Failed to send message:', error.response?.data || error);
        if (error.response?.data) {
          toast.error(`Failed to send message: ${error.response.data.msg} (Status code: ${error.response.status})`);
        } else {
          toast.error('Failed to send message. Please try again.');
        }
      }
    }
  };

  const handleStartVideoCall = async () => {
    if (!socket || !user || !counselorId) return;

    try {
      const res = await api.post('/whereby/create-meeting');
      const { roomUrl } = res.data;

      setVideoCallRoomUrl(roomUrl);
      setIsVideoCallActive(true);

      socket.emit('start-video-call', { to: counselorId, roomUrl, callerName: user.name });
    } catch (error) {
      console.error('Error creating video call:', error);
      toast.error('Could not start video call. Please try again.');
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
    if (socket && counselorId) {
      socket.emit('video-call-hang-up', { to: counselorId });
    }
    setIsVideoCallActive(false);
    setVideoCallRoomUrl('');
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return <SidebarLayout activePath="/chat"><div className="flex items-center justify-center h-full">Loading chat...</div></SidebarLayout>;
  }

  if (!user || !counselor) {
    return <SidebarLayout activePath="/chat"><div className="flex items-center justify-center h-full">Could not load chat details.</div></SidebarLayout>;
  }

  return (
    <>
      <SidebarLayout activePath="/chat">
        <Toaster richColors />
        <div className="flex flex-col h-full">
          <header className="flex items-center p-4 border-b">
            <Link to="/counselors">
              <Button variant="ghost" size="icon">
                <ArrowLeft />
              </Button>
            </Link>
            <div className="ml-4 flex-1">
              <h2 className="text-lg font-bold truncate">{counselor.name}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
            <div className="ml-auto flex items-center">
              {/* Desktop buttons */}
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={handleStartVideoCall}>
                  <Video />
                </Button>
                <Button variant="ghost" size="icon">
                  <Phone />
                </Button>
              </div>
              {/* Mobile dropdown */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleStartVideoCall}>
                      <Video className="mr-2 h-4 w-4" />
                      <span>Start Video Call</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Phone className="mr-2 h-4 w-4" />
                      <span>Call</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                >
                  <Card className={`p-3 max-w-xs lg:max-w-md ${message.sender._id === user._id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
      </SidebarLayout>

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

const Chat: React.FC = () => (
  <SocketProvider>
    <ChatContent />
  </SocketProvider>
);

export default Chat;