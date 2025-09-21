import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/components/AuthLayout';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const CounselorForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setIsEmailSent(true);
      toast({
        title: 'Reset email sent',
        description: 'Please check your email for password reset instructions.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.msg || 'Failed to send reset email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <AuthLayout 
        imageSrc="/lovable-uploads/XMLID_9_.png" 
        userType="counselor"
        heading="Check Your Email"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <Button 
            onClick={() => setIsEmailSent(false)}
            variant="outline"
            className="w-full mb-4 h-12"
          >
            Try Again
          </Button>
          <div className="text-center">
            <Link to="/counselor-login" className="text-sm text-teal-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/XMLID_9_.png" 
      userType="counselor"
      heading="Forgot Password"
    >
      <p className="text-gray-500 text-sm mb-6">
        Enter your email address and we'll send you a link to reset your password
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email address*
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-teal-50 border-teal-600"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-teal-600 hover:bg-teal-700 h-12"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <Link to="/counselor-login" className="text-sm text-teal-600 hover:underline">
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default CounselorForgotPassword;
