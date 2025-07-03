
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import FormField from '@/components/FormField';
import { useAuth } from '@/hooks/useAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/Group.png" 
      userType="client"
      heading="Login"
    >
      <p className="text-gray-500 text-sm mb-6">
        Enter your email and password to access your account
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
          <Link to="/signup" className="ml-1 text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
