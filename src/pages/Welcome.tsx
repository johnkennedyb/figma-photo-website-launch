
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';

const Welcome: React.FC = () => {

  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/couple.png" 
    >
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex flex-col  space-y-4 w-full max-w-sm">
          <Link to="/login" className="w-full">
            <Button className="w-full">Client</Button>
          </Link>
          <Link to="/counselor-login" className="w-full">
            <Button variant="outline" className="w-full">Counsellor</Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Welcome;
