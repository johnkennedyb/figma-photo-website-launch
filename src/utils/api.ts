import { toast } from '@/components/ui/use-toast';

export const api = {
  get: async (endpoint: string, token?: string) => {
    try {
      const response = await fetch(`/api${endpoint}`, {
        headers: {
          'x-auth-token': token || localStorage.getItem('token') || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      toast({
        title: 'API Error',
        description: error instanceof Error ? error.message : 'Failed to fetch data',
        variant: 'destructive'
      });
      throw error;
    }
  },

  post: async (endpoint: string, data: any, token?: string) => {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || localStorage.getItem('token') || ''
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      toast({
        title: 'API Error',
        description: error instanceof Error ? error.message : 'Failed to post data',
        variant: 'destructive'
      });
      throw error;
    }
  }
};
