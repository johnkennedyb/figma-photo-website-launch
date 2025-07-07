
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const OnboardingStep: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loadUser } = useAuth();
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    country: '',
    city: '',
    maritalStatus: '',
    nationality: '',
  });
  const currentStep = parseInt(step || '1');

    const handleNext = async () => {
    // Basic validation
    if (!formData[fieldMapping[currentStep]]) {
      toast({
        title: 'Field required',
        description: `Please enter your ${stepConfigs[currentStep - 1].title.toLowerCase()}.`,
        variant: 'destructive',
      });
      return;
    }

    if (currentStep < 5) {
      navigate(`/onboarding/${currentStep + 1}`);
    } else {
      // Last step completed
      try {
        await api.put('/users/onboarding', formData);

        await loadUser(); // Refresh user data in context

        toast({
          title: 'Onboarding complete',
          description: 'Your profile has been set up successfully',
        });
        navigate('/dashboard');
      } catch (error: any) {
        console.error(error);
        toast({
          title: 'Error',
          description: error.response?.data?.msg || 'Failed to save onboarding data',
          variant: 'destructive',
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      navigate(`/onboarding/${currentStep - 1}`);
    } else {
      navigate('/signup');
    }
  };

  const fieldMapping: { [key: number]: keyof typeof formData } = {
    1: 'dateOfBirth',
    2: 'country',
    3: 'city',
    4: 'maritalStatus',
    5: 'nationality',
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
        
                <div className="mb-8 w-full md:w-1/2">
          {currentStep === 1 && (
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full"
            />
          )}
          {currentStep === 2 && (
            <Input
              placeholder="Enter your country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          )}
          {currentStep === 3 && (
            <Input
              placeholder="Enter your city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          )}
          {currentStep === 4 && (
            <Select onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })} value={formData.maritalStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          )}
          {currentStep === 5 && (
            <Input
              placeholder="Enter your nationality"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            />
          )}
        </div>
        
                <div className="flex justify-between items-center mt-auto pt-8">
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
