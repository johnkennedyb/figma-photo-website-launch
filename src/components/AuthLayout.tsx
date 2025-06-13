
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
          <div className="mb-8 text-center" style={{textAlign:'center'}}>
          <div className="flex justify-center items-center mt-7 ">
  <QuluubLogo size="lg" />
</div>

          {userType && (
              <div className=" text-gray-700 font-large capitalize" style={{fontSize:'30px'}}>
                {userType}
              </div>
            )}
          </div>
          <div className="flex-grow flex items-center justify-center">
            <img 
              src={imageSrc} 
              alt="Quluub illustration" 
              className="max-h-74 mt-2 object-contain"
              style={{marginBottom:'-90px'}}
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
