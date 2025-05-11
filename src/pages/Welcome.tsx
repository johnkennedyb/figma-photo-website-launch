
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';

const Welcome: React.FC = () => {
  return (
    <AuthLayout 
      imageSrc="/lovable-uploads/c47151cc-f491-4b1e-82ef-1ef8d837d9ba.png" 
      heading="Welcome to Quluub!"
    >
      <div className="flex flex-col space-y-4">
        <p className="text-gray-600 mb-6">
          Choose how you'd like to proceed with Quluub's counseling platform.
        </p>
        
        <Link to="/login" className="w-full">
          <Button className="w-full">Client</Button>
        </Link>
        
        <Link to="/counselor-login" className="w-full">
          <Button variant="outline" className="w-full">Counsellor</Button>
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Welcome;
