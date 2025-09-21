import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/components/AuthLayout';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const CounselorResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      navigate('/counselor-forgot-password');
    }
  }, [token, navigate, toast]);

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

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
      navigate('/counselor-login');
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
    <AuthLayout 
      imageSrc="/lovable-uploads/XMLID_9_.png" 
      userType="counselor" 
      heading="Reset Password"
    >
      <p className="text-gray-500 text-sm mb-6">Enter your new password below</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            New Password*
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-teal-50 border-teal-600 pr-20"
              placeholder="Enter new password"
              required
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
                onClick={generatePassword}
                title="Generate password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm New Password*
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 bg-teal-50 border-teal-600 pr-10"
              placeholder="Confirm new password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-teal-600 hover:bg-teal-700 h-12" 
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
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

export default CounselorResetPassword;
