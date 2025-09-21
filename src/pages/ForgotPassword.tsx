import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import FormField from '@/components/FormField';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const ForgotPassword: React.FC = () => {
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
        imageSrc="/lovable-uploads/Group.png" 
        userType="client"
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
            className="w-full mb-4"
          >
            Try Again
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/Group.png" 
      userType="client"
      heading="Forgot Password"
    >
      <p className="text-gray-500 text-sm mb-6">
        Enter your email address and we'll send you a link to reset your password
      </p>

      <form onSubmit={handleSubmit}>
        <FormField 
          label="Email" 
          type="email" 
          placeholder="your.email@example.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Button 
          type="submit" 
          className="w-full mt-4"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
