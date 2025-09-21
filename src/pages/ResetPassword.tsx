import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import FormField from '@/components/FormField';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid reset link',
        description: 'This password reset link is invalid or has expired.',
        variant: 'destructive',
      });
      navigate('/forgot-password');
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast({
        title: 'Password reset successful',
        description: 'Your password has been reset. You can now log in.',
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Reset failed',
        description: error.response?.data?.msg || 'Failed to reset password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  return (
    <AuthLayout imageSrc="/lovable-uploads/Group.png" userType="client" heading="Reset Password">
      <p className="text-gray-500 text-sm mb-6">Enter your new password below</p>
      <form onSubmit={handleSubmit}>
        <FormField 
          label="New Password" 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          showPasswordToggle={true}
          showPasswordGenerator={true}
          onPasswordGenerate={(gen) => { setPassword(gen); setConfirmPassword(gen); }}
          required
        />
        <FormField 
          label="Confirm New Password" 
          type="password" 
          placeholder="••••••••" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          showPasswordToggle={true}
          required
        />
        <Button type="submit" className="w-full mt-4" disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
