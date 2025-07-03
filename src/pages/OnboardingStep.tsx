
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const OnboardingStep: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentStep = parseInt(step || '1');
  
  const [formData, setFormData] = useState({
    nationality: '',
    countryOfResidence: '',
    cityOfResidence: '',
    maritalStatus: '',
    counsellingTypes: {
      marital: false,
      premarital: false,
      mentalHealth: false,
      other: ''
    },
    languages: {
      yoruba: false,
      igbo: false,
      hausa: false
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCounsellingTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      counsellingTypes: { ...prev.counsellingTypes, [type]: checked }
    }));
  };

  const handleLanguageChange = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      languages: { ...prev.languages, [language]: checked }
    }));
  };

  const handleNext = () => {
    if (currentStep < 7) {
      navigate(`/onboarding/${currentStep + 1}`);
    } else {
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
      title: "Nationality",
      description: "Please enter your nationality"
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
      title: "Type of Counselling Required",
      description: "Please select the type(s) of counselling you need"
    },
    {
      title: "Languages Spoken",
      description: "Please select the languages you speak"
    }
  ];
  
  const currentConfig = stepConfigs[currentStep - 1] || stepConfigs[0];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Input
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            placeholder="Enter your nationality"
            className="h-12 bg-teal-50 border-teal-600"
          />
        );
      case 2:
        return (
          <Input
            name="countryOfResidence"
            value={formData.countryOfResidence}
            onChange={handleInputChange}
            placeholder="Enter your country of residence"
            className="h-12 bg-teal-50 border-teal-600"
          />
        );
      case 3:
        return (
          <Input
            name="cityOfResidence"
            value={formData.cityOfResidence}
            onChange={handleInputChange}
            placeholder="Enter your city of residence"
            className="h-12 bg-teal-50 border-teal-600"
          />
        );
      case 4:
        return (
          <Input
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleInputChange}
            placeholder="Enter your marital status"
            className="h-12 bg-teal-50 border-teal-600"
          />
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="marital" 
                checked={formData.counsellingTypes.marital}
                onCheckedChange={(checked) => handleCounsellingTypeChange('marital', checked === true)} 
              />
              <label htmlFor="marital" className="text-sm">Marital</label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="premarital" 
                checked={formData.counsellingTypes.premarital}
                onCheckedChange={(checked) => handleCounsellingTypeChange('premarital', checked === true)} 
              />
              <label htmlFor="premarital" className="text-sm">Premarital</label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="mentalHealth" 
                checked={formData.counsellingTypes.mentalHealth}
                onCheckedChange={(checked) => handleCounsellingTypeChange('mentalHealth', checked === true)} 
              />
              <label htmlFor="mentalHealth" className="text-sm">Mental Health Review</label>
            </div>
            
            <Input
              name="other"
              value={formData.counsellingTypes.other}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                counsellingTypes: { ...prev.counsellingTypes, other: e.target.value }
              }))}
              placeholder="Others (please specify)"
              className="h-12 bg-teal-50 border-teal-600"
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="yoruba" 
                checked={formData.languages.yoruba}
                onCheckedChange={(checked) => handleLanguageChange('yoruba', checked === true)} 
              />
              <label htmlFor="yoruba" className="text-sm">Yoruba</label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="igbo" 
                checked={formData.languages.igbo}
                onCheckedChange={(checked) => handleLanguageChange('igbo', checked === true)} 
              />
              <label htmlFor="igbo" className="text-sm">Igbo</label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="hausa" 
                checked={formData.languages.hausa}
                onCheckedChange={(checked) => handleLanguageChange('hausa', checked === true)} 
              />
              <label htmlFor="hausa" className="text-sm">Hausa</label>
            </div>
          </div>
        );
      default:
        return <div>Invalid step</div>;
    }
  };

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
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between bottom-0" style={{marginTop:'130px'}}>
          <Button 
            variant="outline" 
            onClick={handlePrevious}
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
          >
            {currentStep === 6 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep;
