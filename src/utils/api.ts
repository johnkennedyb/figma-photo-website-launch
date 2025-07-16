import { toast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '../config';

export const api = {
  get: async (endpoint: string, token?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      // Always use the API base URL, even in development
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || localStorage.getItem('token') || '',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
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
