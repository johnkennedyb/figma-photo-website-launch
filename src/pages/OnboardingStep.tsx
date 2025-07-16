import React, { useState, useEffect } from 'react';
import { Country, City } from 'country-state-city';
import { ICountry, ICity } from 'country-state-city/lib/interface';
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
    counsellingType: '',
    otherCounsellingType: '',
    language: '',
    otherLanguage: '',
  });
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const currentStep = parseInt(step || '1');

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (formData.country) {
      const countryInfo = Country.getCountryByCode(formData.country);
      if (countryInfo) {
        setCities(City.getCitiesOfCountry(countryInfo.isoCode) || []);
      }
    } else {
      setCities([]);
    }
  }, [formData.country]);

  const handleNext = async () => {
    // Age validation for step 1
    if (currentStep === 1 && formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }

      if (age < 18) {
        toast({
          title: 'Age restriction',
          description: 'You must be at least 18 years old to sign up.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validation logic
    const currentField = fieldMapping[currentStep];
    let isValid = true;
    let errorMessage = `Please fill in the ${stepConfigs[currentStep - 1].title.toLowerCase()} field.`

    if (!formData[currentField]) {
      isValid = false;
    } else if (currentField === 'counsellingType' && formData.counsellingType === 'Other' && !formData.otherCounsellingType) {
      isValid = false;
      errorMessage = 'Please specify the type of counselling.';
    } else if (currentField === 'language' && formData.language === 'Other' && !formData.otherLanguage) {
      isValid = false;
      errorMessage = 'Please specify your language.';
    }

    if (!isValid) {
      toast({
        title: 'Field Required',
        description: errorMessage,
        variant: 'destructive',
      });
      return;
    }

    if (currentStep < 7) {
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
      } catch (error: unknown) {
        console.error(error);
        let errorMessage = 'Failed to save onboarding data';
        if (typeof error === 'object' && error !== null) {
          const apiError = error as { response?: { data?: { msg?: string } } };
          errorMessage = apiError.response?.data?.msg || errorMessage;
        }
        toast({
          title: 'Error',
          description: errorMessage,
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
    6: 'counsellingType',
    7: 'language',
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
    },
    {
      title: "Type of counselling required",
      description: "Please select the type of counselling you require."
    },
    {
      title: "Languages spoken",
      description: "Please select a language you are comfortable with."
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
            <Select onValueChange={(value) => setFormData({ ...formData, country: value, city: '' })} value={formData.country}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {countries.map((country) => (
                  <SelectItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {currentStep === 3 && (
            <Select onValueChange={(value) => setFormData({ ...formData, city: value })} value={formData.city} disabled={!formData.country || cities.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={!formData.country ? "Select a country first" : cities.length === 0 ? "No cities available" : "Select your city"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Select onValueChange={(value) => setFormData({ ...formData, nationality: value })} value={formData.nationality}>
              <SelectTrigger>
                <SelectValue placeholder="Select your nationality" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.isoCode} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {currentStep === 6 && (
            <>
              <Select onValueChange={(value) => setFormData({ ...formData, counsellingType: value })} value={formData.counsellingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type of counselling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marital">Marital</SelectItem>
                  <SelectItem value="Pre-marital">Pre-marital</SelectItem>
                  <SelectItem value="Mental Health Review">Mental Health Review</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formData.counsellingType === 'Other' && (
                <Input
                  placeholder="Please specify"
                  value={formData.otherCounsellingType}
                  onChange={(e) => setFormData({ ...formData, otherCounsellingType: e.target.value })}
                  className="mt-4"
                />
              )}
            </>
          )}
          {currentStep === 7 && (
            <>
              <Select onValueChange={(value) => setFormData({ ...formData, language: value })} value={formData.language}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yoruba">Yoruba</SelectItem>
                  <SelectItem value="Igbo">Igbo</SelectItem>
                  <SelectItem value="Hausa">Hausa</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {formData.language === 'Other' && (
                <Input
                  placeholder="Please specify"
                  value={formData.otherLanguage}
                  onChange={(e) => setFormData({ ...formData, otherLanguage: e.target.value })}
                  className="mt-4"
                />
              )}
            </>
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
            {currentStep === 7 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep;
