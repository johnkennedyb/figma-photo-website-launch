import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const GlobalCallHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleIncomingCall = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { callerName, roomId } = customEvent.detail;

      toast.info(`Incoming video call from ${callerName}`, {
        action: {
          label: 'Accept',
          onClick: () => navigate(`/chat/${roomId}?video=true`),
        },
        duration: 10000, // 10 seconds
      });
    };

    window.addEventListener('incoming-call', handleIncomingCall);

    return () => {
      window.removeEventListener('incoming-call', handleIncomingCall);
    };
  }, [navigate]);

  return null; // This component does not render anything
};

export default GlobalCallHandler;
