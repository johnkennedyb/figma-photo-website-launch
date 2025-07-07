
import React from 'react';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const CounselorVerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVerify = () => {
    // Simulate verification
    toast({
      title: "Email verified",
      description: "Let's complete your profile."
    });
    navigate('/counselor-onboarding/1');
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
          onClick={handleVerify} 
          className="bg-teal-600 hover:bg-teal-700 w-full md:w-32"
        >
          Verify
        </Button>
      </div>
    </AuthLayout>
  );
};

export default CounselorVerifyEmail;
