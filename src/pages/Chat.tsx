
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, Paperclip } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'counselor';
  timestamp: Date;
}

const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! How can I help you today?",
      sender: "counselor",
      timestamp: new Date(2024, 4, 10, 14, 30)
    },
    {
      id: 2,
      content: "I've been feeling anxious about some family issues.",
      sender: "user",
      timestamp: new Date(2024, 4, 10, 14, 32)
    },
    {
      id: 3,
      content: "I'm sorry to hear that. Would you like to tell me more about what's causing your anxiety?",
      sender: "counselor",
      timestamp: new Date(2024, 4, 10, 14, 35)
    }
  ]);

  const counselor = {
    id: Number(id),
    name: 'Dr. Abdullah Malik',
    status: 'Online',
    specialty: 'Family Counseling'
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: messages.length + 1,
        content: newMessage,
        sender: 'user',
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
    <SidebarLayout activePath="/counselors">
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Chat header */}
        <Card className="p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
              <span className="text-primary text-sm font-semibold">
                {counselor.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{counselor.name}</h2>
              <p className="text-gray-600 text-sm">{counselor.specialty}</p>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs ${
            counselor.status === 'Online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {counselor.status}
          </div>
        </Card>
        
        {/* Chat messages */}
        <div className="flex-grow overflow-y-auto mb-4 bg-gray-50 rounded-lg p-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-4 max-w-[80%] ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}
            >
              <div className={`p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white border rounded-bl-none'
              }`}>
                {message.content}
              </div>
              <div className={`text-xs mt-1 text-gray-500 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Message input */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Paperclip size={18} />
          </Button>
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-grow"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default Chat;
