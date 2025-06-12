
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Video, Phone, MoreHorizontal, ArrowLeft, Search, Bell } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  sender: 'client' | 'counselor';
  timestamp: Date;
}

const CounselorChat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello Ahaji, I've been feeling really overwhelmed lately",
      sender: "client",
      timestamp: new Date(2024, 4, 10, 14, 47)
    },
    {
      id: 2,
      content: "Thank You. Please let me a current session with you. When can it happen?",
      sender: "counselor",
      timestamp: new Date(2024, 4, 10, 15, 35)
    },
    {
      id: 3,
      content: "Alright, I'll check my schedule and let you know. I'm really looking forward to the counselor session",
      sender: "client",
      timestamp: new Date(2024, 4, 10, 22, 43)
    }
  ]);

  const client = {
    id: Number(id),
    name: 'Mr. Quadri Ajetunmobi',
    status: 'Online'
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: messages.length + 1,
        content: newMessage,
        sender: 'counselor',
        timestamp: new Date()
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <CounselorSidebarLayout activePath="/counselor-chat">
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Welcome Musa! 👋</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700">
              <Search size={16} className="mr-2" />
              Search
            </Button>
            <Button size="icon" variant="ghost">
              <Bell size={18} />
            </Button>
          </div>
        </div>

        {/* Chat header */}
        <Card className="p-4 mb-4 flex items-center justify-between bg-white">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft size={20} />
            </Button>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
              <span className="text-orange-600 text-sm font-semibold">QA</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{client.name}</h2>
              <p className="text-gray-600 text-sm flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                179 Messages Left
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700">
              <Video size={18} />
            </Button>
            <Button variant="outline" size="icon" className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700">
              <Phone size={18} />
            </Button>
            <Button variant="outline" size="icon" className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700">
              <MoreHorizontal size={18} />
            </Button>
          </div>
        </Card>
        
        {/* Date separator */}
        <div className="text-center text-gray-500 text-sm mb-4">
          Yesterday
        </div>
        
        {/* Chat messages */}
        <div className="flex-grow overflow-y-auto mb-4 bg-gray-50 rounded-lg p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'counselor' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${message.sender === 'counselor' ? 'order-2' : 'order-1'}`}>
                {message.sender === 'client' && (
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mr-2">
                      <span className="text-orange-600 text-xs font-semibold">QA</span>
                    </div>
                  </div>
                )}
                <div className={`p-3 rounded-lg ${
                  message.sender === 'counselor' 
                    ? 'bg-teal-600 text-white rounded-br-none' 
                    : 'bg-white border rounded-bl-none'
                }`}>
                  {message.content}
                </div>
                <div className={`text-xs mt-1 text-gray-500 ${message.sender === 'counselor' ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Message input */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border">
          <Input
            placeholder="Type Message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow border-0 shadow-none focus-visible:ring-0"
          />
          <Button variant="ghost" size="icon">
            <Paperclip size={18} />
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim()}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </CounselorSidebarLayout>
  );
};

export default CounselorChat;
