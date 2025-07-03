
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const CounselorVerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Handle email verification from URL params
    const handleEmailVerification = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session && user) {
        // User is verified and logged in
        navigate('/counselor-dashboard');
      }
    };

    handleEmailVerification();
  }, [user, navigate]);

  const handleResendEmail = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user?.email || ''
    });
  };

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/Group 2.png"
      userType="counselor"
      heading="Verify Your Email"
    >
      <div className="text-center">
        <p className="text-gray-600 mb-8">
          Before we proceed please verify your email address by clicking the button below.
        </p>
        
        <Button 
          onClick={handleResendEmail} 
          className="bg-teal-600 hover:bg-teal-700 w-full md:w-32"
        >
          Resend Email
        </Button>
      </div>
    </AuthLayout>
  );
};

export default CounselorVerifyEmail;
