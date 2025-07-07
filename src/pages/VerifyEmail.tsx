
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import { useToast } from '@/components/ui/use-toast';

const VerifyEmail: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('Verification token not found.');
      return;
    }

    const verifyToken = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setVerificationStatus('success');
        toast({
          title: 'Email Verified',
          description: 'Your email has been successfully verified. You can now log in.',
        });
        // Redirect to login after a short delay
        setTimeout(() => navigate('/login'), 3000);
      } catch (error: any) {
        setVerificationStatus('error');
        const message = error.response?.data?.msg || 'Failed to verify email. The link may be invalid or expired.';
        setErrorMessage(message);
        toast({ title: 'Verification Failed', description: message, variant: 'destructive' });
      }
    };

    verifyToken();
  }, [searchParams, navigate, toast]);



  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/cc86111a-8114-49bc-93ec-7f3e94c0b305.png"
      heading="Verify Your Email"
    >
      <div className="flex flex-col items-center text-center">
        {verificationStatus === 'verifying' && (
          <>
            <h3 className="text-xl font-semibold mb-2">Verifying Your Email...</h3>
            <p className="text-gray-600">Please wait while we confirm your email address.</p>
            {/* You can add a spinner here */}
          </>
        )}
        {verificationStatus === 'success' && (
          <>
            <h3 className="text-xl font-semibold mb-2 text-green-600">Email Verified Successfully!</h3>
            <p className="text-gray-600">You will be redirected to the login page shortly.</p>
          </>
        )}
        {verificationStatus === 'error' && (
          <>
            <h3 className="text-xl font-semibold mb-2 text-red-600">Verification Failed</h3>
            <p className="text-gray-600">{errorMessage}</p>
            <Button onClick={() => navigate('/login')} className="w-full mt-4">
              Go to Login
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
