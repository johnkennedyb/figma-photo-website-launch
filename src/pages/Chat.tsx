import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Video, Phone, MoreHorizontal, ArrowLeft, CreditCard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WherebyVideoCall from '@/components/WherebyVideoCall';
import RequestPaymentModal from '@/components/RequestPaymentModal';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { SocketContext, SocketProvider } from '../context/SocketContext';


interface Message {
  _id: string;
  sender: { _id: string; firstName: string; lastName: string; };
  receiver: { _id: string; firstName: string; lastName: string; };
  content: string;
  timestamp: string;
}

interface Counselor {
  _id: string;
  firstName: string;
  lastName: string;
}

const ChatContent: React.FC = () => {
  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const { id: counselorId } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      } catch (error: unknown) {
        let errorMessage = 'Please try again later.';
        if (typeof error === 'object' && error !== null) {
          const apiError = error as { response?: { data?: { msg?: string } } };
          errorMessage = apiError.response?.data?.msg || 'Please try again later.';
        }
        console.error('Failed to load chat data:', error);
        toast({ title: 'Error', description: `Failed to load chat data: ${errorMessage}`, variant: 'destructive' });
        navigate('/counselors');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();

    if (socket) {
      const handleReceiveMessage = (message: Message) => {
        if (message.sender._id === counselorId || message.sender._id === user?._id) {
          setMessages((prevMessages) => {
            if (prevMessages.some((m) => m._id === message._id)) {
              return prevMessages;
            }
            return [...prevMessages, message];
          });
        }
      };

      const handleIncomingVideoCall = (data: { roomUrl: string; callerName: string; }) => {
        setIncomingVideoCall(data);
        toast({ title: 'Incoming Call', description: `Video call from ${data.callerName}`});
      };

      const handleVideoCallEnded = () => {
        setIsVideoCallActive(false);
        setVideoCallRoomUrl('');
        toast({ title: 'Call Ended', description: 'The video call has ended.' });
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
        const response = await api.post('/messages', {
          receiver: counselorId,
          content: newMessage,
        });
        setMessages((prev) => [...prev, response.data]);
        setNewMessage('');
      } catch (error: unknown) {
        let errorMessage = 'Please try again.';
        if (typeof error === 'object' && error !== null) {
          const apiError = error as { response?: { data?: { msg?: string }, status?: number } };
          if (apiError.response?.data) {
            errorMessage = `${apiError.response.data.msg} (Status code: ${apiError.response.status})`;
          }
        }
        console.error('Failed to send message:', error);
        toast({ title: 'Error', description: `Failed to send message: ${errorMessage}`, variant: 'destructive' });
      }
    }
  };

  const handlePaymentSubmit = async (amount: number, currency: 'usd' | 'ngn') => {
    if (!counselorId) return;
    setIsSubmittingPayment(true);
    try {
      const response = await api.post('/payment/create-checkout-session', {
        counselorId,
        currency,
      });
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      toast({ title: 'Error', description: 'Could not start payment. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmittingPayment(false);
      setIsPaymentModalOpen(false);
    }
  };

  const handleStartVideoCall = async () => {
    if (!socket || !user || !counselorId) return;

    try {
      const res = await api.post('/whereby/create-meeting');
      const { roomUrl } = res.data;

      setVideoCallRoomUrl(roomUrl);
      setIsVideoCallActive(true);

      socket.emit('start-video-call', { to: counselorId, roomUrl, callerName: `${user.firstName} ${user.lastName}` });
    } catch (error) {
      console.error('Error creating video call:', error);
      toast({ title: 'Error', description: 'Could not start video call. Please try again.', variant: 'destructive' });
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
        <div className="flex flex-col h-full">
          <header className="flex items-center p-4 border-b">
            <Link to="/counselors">
              <Button variant="ghost" size="icon">
                <ArrowLeft />
              </Button>
            </Link>
            <div className="ml-4 flex-1">
              <h2 className="text-lg font-bold truncate">{counselor.firstName} {counselor.lastName}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
            <div className="ml-auto flex items-center">
              {/* Desktop buttons */}
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => setIsPaymentModalOpen(true)}>
                  <CreditCard />
                </Button>
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
                              <DropdownMenuItem onClick={() => setIsPaymentModalOpen(true)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Pay for Session</span>
                    </DropdownMenuItem>
          </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
           </header>

           {/* Payment Modal */}
           <RequestPaymentModal
             isOpen={isPaymentModalOpen}
             onClose={() => setIsPaymentModalOpen(false)}
             onSubmit={handlePaymentSubmit}
             isSubmitting={isSubmittingPayment}
           />

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