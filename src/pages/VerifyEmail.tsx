
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const VerifyEmail: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle email verification from URL params
    const handleEmailVerification = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session && user) {
        // User is verified and logged in
        navigate('/dashboard');
      }
    };

    handleEmailVerification();
  }, [user, navigate]);

  const handleResendEmail = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user?.email || ''
    });
    
    if (!error) {
      // Show success message
    }
  };

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/cc86111a-8114-49bc-93ec-7f3e94c0b305.png"
      heading="Verify Your Email"
    >
      <div className="flex flex-col items-center">
        <div className="bg-primary/10 p-4 rounded-full mb-6">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="#009688" strokeWidth="2"/>
            <path d="M8 12L11 15L16 10" stroke="#009688" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">Verification Email Sent</h3>
        
        <p className="text-gray-600 text-center mb-8">
          We've sent a verification email to your inbox. Please check your email and verify your account to continue.
        </p>
        
        <Button onClick={handleResendEmail} className="w-full">
          Resend Verification Email
        </Button>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
