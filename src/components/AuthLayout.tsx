
import React, { ReactNode } from 'react';
import QuluubLogo from './QuluubLogo';

interface AuthLayoutProps {
  children: ReactNode;
  imageSrc: string;
  userType?: 'client' | 'counselor';
  heading?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  imageSrc, 
  userType,
  heading
}) => {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        {/* Left side with logo and image */}
        <div className="w-1/2 bg-white p-8 flex flex-col">
          <div className="mb-8">
            <QuluubLogo size="md" />
            {userType && (
              <div className="mt-2 text-gray-700 font-medium capitalize">
                {userType}
              </div>
            )}
          </div>
          <div className="flex-grow flex items-center justify-center">
            <img 
              src={imageSrc} 
              alt="Quluub illustration" 
              className="max-h-64 object-contain"
            />
          </div>
        </div>
        
        {/* Right side with content */}
        <div className="w-1/2 p-8 bg-white">
          {heading && (
            <h2 className="text-2xl font-semibold mb-6">{heading}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
