import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, MoreHorizontal, ArrowLeft, CalendarPlus, CreditCard, Video } from 'lucide-react';
import WherebyVideoCall from '@/components/WherebyVideoCall';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ScheduleSessionModal from '@/components/ScheduleSessionModal';
import RequestPaymentModal from '@/components/RequestPaymentModal';
import { SocketContext, SocketProvider } from '@/context/SocketContext';

// Type Definitions
interface Message {
  _id: string;
  sender: { _id: string; firstName: string; lastName: string };
  receiver: { _id: string; firstName: string; lastName: string };
  content: string;
  timestamp: string;
}

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

// Main Chat Component Logic
const CounselorChatContent: React.FC = () => {
  // Hooks
  const { id: clientId } = useParams<{ id: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [videoCallRoomUrl, setVideoCallRoomUrl] = useState('');
  const [incomingVideoCall, setIncomingVideoCall] = useState<{ roomUrl: string; callerName: string; } | null>(null);

  // Effect for scrolling to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect for initialization, data fetching, and socket handling
  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) {
      navigate('/counselor-login');
      return;
    }
    if (user.role !== 'counselor' || !clientId) {
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
        toast({ title: 'Error', description: 'Failed to load chat data.', variant: 'destructive' });
        navigate('/counselor-dashboard/messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadChatData();

    if (socket) {
      const handleReceiveMessage = (message: Message) => {
        if (message.sender._id === clientId || message.receiver._id === clientId) {
          setMessages((prev) => [...prev, message]);
        }
      };
      const handleIncomingVideoCall = (data: { roomUrl: string; callerName: string; }) => setIncomingVideoCall(data);
      const handleVideoCallEnded = () => {
        setIsVideoCallActive(false);
        setVideoCallRoomUrl('');
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
  }, [socket, clientId, isAuthenticated, navigate, loading, user, toast]);

  // Handlers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !clientId) return;

    const content = newMessage.trim();
    setNewMessage(''); // Optimistically clear the input

    try {
      // The backend will save the message and emit it back via WebSocket.
      // The 'receive-message' listener will then update the state.
      await api.post('/messages', {
        receiver: clientId,
        content: content,
      });
    } catch (error: any) {
      console.error('Failed to send message:', error);
      setNewMessage(content); // Revert optimistic clear if sending fails
      const errorMsg = error.response?.data?.msg || 'Could not send message. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMsg,
      });
    }
  };

  const handlePaymentSubmit = async (amount: number, currency: 'usd' | 'ngn') => {
    if (!clientId || !user || !client?.email) {
      toast({ title: 'Error', description: 'Client information is missing.', variant: 'destructive' });
      return;
    }
    setIsSubmittingPayment(true);
    const endpoint = currency === 'usd' ? '/stripe/create-checkout-session' : '/paystack/create-payment';
    const payload = { counselorId: user._id, clientId, amount: Math.round(amount * 100), currency, email: client.email };
    try {
      const response = await api.post(endpoint, payload);
      const { url } = response.data;
      if (url) {
        window.location.href = url;
      } else {
        toast({ title: 'Error', description: 'Could not get payment URL.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Payment request failed', error);
      toast({ title: 'Error', description: 'Failed to create payment request.', variant: 'destructive' });
    } finally {
      setIsSubmittingPayment(false);
      setIsPaymentModalOpen(false);
    }
  };

  const handleStartVideoCall = async () => {
    if (!socket || !user || !clientId) return;
    try {
      const res = await api.post('/whereby/create-meeting');
      const { roomUrl } = res.data;
      setVideoCallRoomUrl(roomUrl);
      setIsVideoCallActive(true);
      socket.emit('start-video-call', { to: clientId, roomUrl, callerName: `${user.firstName} ${user.lastName}` });
    } catch (error) {
      console.error('Error creating video call:', error);
      toast({ title: 'Error', description: 'Failed to start video call.', variant: 'destructive' });
    }
  };

  const handleAcceptVideoCall = () => {
    if (incomingVideoCall) {
      setVideoCallRoomUrl(incomingVideoCall.roomUrl);
      setIsVideoCallActive(true);
      setIncomingVideoCall(null);
    }
  };

  const handleDeclineVideoCall = () => setIncomingVideoCall(null);

  const handleVideoCallClose = () => {
    if (socket && clientId) socket.emit('video-call-hang-up', { to: clientId });
    setIsVideoCallActive(false);
    setVideoCallRoomUrl('');
  };
  
  const handleSessionScheduled = (session: any) => {
    console.log('Session scheduled:', session);
    toast({ title: 'Success', description: 'Session has been scheduled.' });
  };

  const formatTimestamp = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Conditional Rendering for Loading/Error States
  if (loading || isLoading) return <CounselorSidebarLayout activePath="/counselor/chat"><div className="flex items-center justify-center h-full">Loading chat...</div></CounselorSidebarLayout>;
  if (!user || !client) return <CounselorSidebarLayout activePath="/counselor/chat"><div className="flex items-center justify-center h-full">Could not load chat details.</div></CounselorSidebarLayout>;

  // Main Render
  return (
    <>
      <CounselorSidebarLayout activePath="/counselor/chat">
        <div className="flex flex-col h-full bg-transparent">
          <header className="flex items-center p-4 border-b">
            <Link to="/counselor-dashboard/messages">
              <Button variant="ghost" size="icon"><ArrowLeft /></Button>
            </Link>
            <div className="ml-4">
              <h2 className="text-lg font-bold">{client.firstName} {client.lastName}</h2>
              <p className="text-sm text-gray-500">Online</p>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={handleStartVideoCall} title="Start Video Call"><Video className="h-6 w-6" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setIsSchedulingModalOpen(true)} title="Schedule Session"><CalendarPlus className="h-6 w-6" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setIsPaymentModalOpen(true)} title="Request Payment"><CreditCard className="h-6 w-6" /></Button>
              <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message._id} className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                  <Card className={`p-3 max-w-xs lg:max-w-md ${message.sender._id === user._id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p>{message.content}</p>
                    <span className="text-xs text-right block mt-1 opacity-75">{formatTimestamp(message.timestamp)}</span>
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="p-4 border-t bg-gray-50">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <Button variant="ghost" size="icon"><Paperclip /></Button>
              <Input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1" />
              <Button type="submit" size="icon"><Send /></Button>
            </form>
          </footer>
        </div>
      </CounselorSidebarLayout>

      {/* Modals and Overlays */}
      {isVideoCallActive && <WherebyVideoCall roomUrl={videoCallRoomUrl} onClose={handleVideoCallClose} />}

      {incomingVideoCall && !isVideoCallActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 text-center">
            <h3 className="text-lg font-semibold">Incoming Video Call from {incomingVideoCall.callerName}</h3>
            <div className="mt-4 flex gap-4">
              <Button variant="outline" onClick={handleDeclineVideoCall}>Decline</Button>
              <Button className="bg-transparent hover:bg-green-600" onClick={handleAcceptVideoCall}>Accept</Button>
            </div>
          </Card>
        </div>
      )}

      {clientId && (
        <>
          <ScheduleSessionModal isOpen={isSchedulingModalOpen} onClose={() => setIsSchedulingModalOpen(false)} client={client} counselor={user} onSessionScheduled={handleSessionScheduled} />
          <RequestPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onSubmit={handlePaymentSubmit} isSubmitting={isSubmittingPayment} />
        </>
      )}
    </>
  );
};

// Component Wrapper with Socket Provider
const CounselorChat: React.FC = () => (
  <SocketProvider>
    <CounselorChatContent />
  </SocketProvider>
);

export default CounselorChat;
