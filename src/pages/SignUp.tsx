
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import FormField from '@/components/FormField';
import { useAuth } from '@/hooks/useAuth';

const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(email, password, firstName, lastName, 'client');
    
    if (!error) {
      navigate('/verify-email');
    }
    
    setIsLoading(false);
  };

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/OBJECTS.png" 
      userType="client"
      heading="Sign Up"
    >
      <p className="text-gray-500 text-sm mb-6">
        Create your account to get started with Quluub counseling
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="First Name" 
            placeholder="John" 
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          
          <FormField 
            label="Last Name" 
            placeholder="Doe" 
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        
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
        
        <FormField 
          label="Confirm Password" 
          type="password" 
          placeholder="••••••••" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <Button 
          type="submit" 
          className="w-full mt-4"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account? 
          <Link to="/login" className="ml-1 text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
