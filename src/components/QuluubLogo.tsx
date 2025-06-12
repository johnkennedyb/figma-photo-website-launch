
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
  withText?: boolean;
}

const QuluubLogo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'default',
  withText = true 
}) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const colors = {
    default: 'text-primary',
    white: 'text-white',
  };

  return (
    <div className="flex items-center gap-2">
      <img 
        src="/lovable-uploads/118e5a2b-3804-47f3-8c97-eb95653a81a1.png" 
        alt="Quluub Logo" 
        className={sizes[size]}
      />
      {withText && size !== 'sm' && (
        <div className="flex flex-col">
          <span className={`text-xs ${colors[variant]} opacity-70`}>Counseling Platform</span>
        </div>
      )}
    </div>
  );
};

export default QuluubLogo;
