
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FormField from '@/components/FormField';
import { useToast } from '@/hooks/use-toast';

const OnboardingStep: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [value, setValue] = useState('');
  const currentStep = parseInt(step || '1');

  const handleNext = () => {
    if (currentStep < 5) {
      navigate(`/onboarding/${currentStep + 1}`);
    } else {
      // Last step completed
      toast({
        title: "Onboarding complete",
        description: "Your profile has been set up successfully"
      });
      navigate('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      navigate(`/onboarding/${currentStep - 1}`);
    } else {
      navigate('/signup');
    }
  };

  const stepConfigs = [
    {
      title: "Date of Birth",
      description: "Please enter your date of birth"
    },
    {
      title: "Country of Residence",
      description: "Please fill the country information"
    },
    {
      title: "City of Residence",
      description: "Please fill the city information"
    },
    {
      title: "Marital Status",
      description: "Please select the correct information applicable to you"
    },
    {
      title: "Nationality",
      description: "Please fill the correct information"
    }
  ];
  
  const currentConfig = stepConfigs[currentStep - 1] || stepConfigs[0];

  return (
    <div className="auth-layout">
<div className="bg-white rounded-lg shadow-md w-full max-w-[1067px] h-[520px] p-8">
<div className="flex items-center justify-center mb-6">
          <img src="/lovable-uploads/quluublogosmall.png" alt="" />
        </div>
        
        <h2 className="text-xl font-medium mb-1">Please fill the correct information</h2>
        
        <div className="mb-8">
          <h3 className="font-medium text-lg mb-2 flex items-center">
            <span className="bg-primary w-6 h-6 rounded-full flex items-center justify-center text-white text-sm mr-3">
              {currentStep}
            </span>
            {currentConfig.title}
          </h3>
          <p className="text-gray-600 text-sm">{currentConfig.description}</p>
        </div>
        
        <div className="mb-8 w-1/2">
          <FormField 
            label={currentConfig.title}
            placeholder={`Enter ${currentConfig.title.toLowerCase()}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        
        <div className="flex justify-between bottom-0" style={{marginTop:'130px'}} >
          <Button 
            variant="outline" 
            onClick={handlePrevious}
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
          >
            {currentStep === 5 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep;
