import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { API_BASE_URL, WS_BASE_URL } from '../config';

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
      const newSocket = io(WS_BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        timeout: 10000,
        path: '/socket.io',
        secure: true,
        rejectUnauthorized: false,
        forceNew: true,
        upgrade: true,
        autoConnect: false,
        query: {
          client: 'web'
        }
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

      // newSocket.on('connect_error', (err) => {
      //   console.error('Socket connection error:', err.message);
      //   setIsConnected(false);
      //   toast({ title: 'Real-time Error', description: `Connection failed: ${err.message}`, variant: 'destructive' });
      // });



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
