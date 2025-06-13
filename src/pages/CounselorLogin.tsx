
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import FormField from '@/components/FormField';
import { useToast } from '@/hooks/use-toast';

const CounselorLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Login successful",
        description: "Welcome back to Quluub!"
      });
      navigate('/counselor-dashboard');
    }, 1500);
  };

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/XMLID_9_.png"
      userType="counselor"
      heading="Login"
      formSide="left"
    >
      <p className="text-gray-500 text-sm mb-6">
        Welcome back, keep making a difference.
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

        <FormField 
          label="Password" 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button 
          type="submit" 
          className="w-full mt-4"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account? 
          <Link to="/counselor-signup" className="ml-1 text-primary hover:underline">
            Sign up
          </Link>
        </p>
        
        <p className="text-sm text-gray-600 mt-2">
          <Link to="/counselor-signup" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default CounselorLogin;
