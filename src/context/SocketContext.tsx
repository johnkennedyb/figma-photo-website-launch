import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      const apiUrl = import.meta.env.PROD
      ? 'https://figma-photo-website-launch.onrender.com'
      : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
            const newSocket = io(apiUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setIsConnected(false);
        toast({ title: 'Real-time Error', description: `Connection failed: ${err.message}`, variant: 'destructive' });
      });



      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, toast]);

  const contextValue = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
