
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
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
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
      <div className={`${sizes[size]} relative`}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={colors[variant]}>
          <path 
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" 
            fill="currentColor"
          />
          <path 
            d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" 
            fill="currentColor"
          />
          <path 
            d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm1 5h-2v-2h2v2z" 
            fill="currentColor"
          />
        </svg>
      </div>
      {withText && (
        <div className="flex flex-col">
          <span className={`font-medium ${textSizes[size]} ${colors[variant]}`}>Quluub</span>
          {size !== 'sm' && <span className={`text-xs ${colors[variant]}`}>Counseling Platform</span>}
        </div>
      )}
    </div>
  );
};

export default QuluubLogo;
