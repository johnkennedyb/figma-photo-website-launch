
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/components/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const CounselorSignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signUp(email, password, {
      user_type: 'counselor'
    });

    setIsLoading(false);

    if (!error) {
      navigate('/counselor-verify-email');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/Group2.png"
      userType="counselor"
      heading="Sign Up"
    >
      <p className="text-sm text-gray-500 mb-6">
        Create your account to start helping clients with Quluub.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email address*
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-teal-50 border-teal-600"
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password*
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-teal-50 border-teal-600 pr-10"
              placeholder="Create a password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff size={18} className="text-gray-500" />
              ) : (
                <Eye size={18} className="text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 h-12"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">OR</p>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-gray-300 h-12"
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/counselor-login" className="text-teal-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default CounselorSignUp;
