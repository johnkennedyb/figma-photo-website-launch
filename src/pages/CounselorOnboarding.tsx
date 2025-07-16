import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Country, City } from 'country-state-city';

const steps = [
  { id: 1, title: 'Nationality' },
  { id: 2, title: 'Country of Residence' },
  { id: 3, title: 'City of Residence' },
  { id: 4, title: 'Marital Status & DOB' },
  { id: 5, title: 'Qualifications' },
  { id: 6, title: 'Specializations & Languages' },
  { id: 7, title: 'About You' },
];

const stepDescriptions = [
  'Select your nationality.',
  'Select your country of residence.',
  'Select your city of residence.',
  'Provide your marital status and date of birth.',
  'Enter your qualifications (university, license, specialization, experience).',
  'Choose your specializations and languages.',
  'Write a brief bio about yourself.'
];

const defaultFormData = {
  nationality: '',
  countryOfResidence: '',
  countryOfResidenceCode: '',
  cityOfResidence: '',
  maritalStatus: '',
  dateOfBirth: '',
  university: '',
  licenseNumber: '',
  fieldOfSpecialization: '',
  yearsOfExperience: '',
  specialization: '',
  otherSpecialization: '',
  language: '',
  otherLanguage: '',
  bio: '',
};

const CounselorOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { step } = useParams();
  const currentStep = parseInt(step || '1', 10);
  const { loadUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('counselorOnboardingData');
    const parsedData = savedData ? JSON.parse(savedData) : {};
    return { ...defaultFormData, ...parsedData };
  });

  useEffect(() => {
    localStorage.setItem('counselorOnboardingData', JSON.stringify(formData));
  }, [formData]);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(() => formData.countryOfResidenceCode ? City.getCitiesOfCountry(formData.countryOfResidenceCode) : [], [formData.countryOfResidenceCode]);

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      if (name === 'countryOfResidence') {
        const country = countries.find(c => c.name === value);
        newState.countryOfResidenceCode = country ? country.isoCode : '';
        newState.cityOfResidence = '';
      }
      return newState;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name: 'specializations' | 'languages', value: string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      navigate(`/counselor-onboarding/${currentStep + 1}`);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      navigate(`/counselor-onboarding/${currentStep - 1}`);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const dataToSend = {
        ...formData,
        yearsOfExperience: parseInt(formData.yearsOfExperience, 10) || 0,
      };

      await api.post('/counselors/onboarding', dataToSend);
      await loadUser();
      localStorage.removeItem('counselorOnboardingData');
      toast.success('Onboarding completed successfully!');
      navigate('/counselor/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.msg || 'Failed to save onboarding data.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
            <Select onValueChange={(value) => handleSelectChange('nationality', value)} value={formData.nationality}>
                <SelectTrigger><SelectValue placeholder="Select your nationality" /></SelectTrigger>
                <SelectContent>{countries.map(c => <SelectItem key={c.isoCode} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
        );
      case 2:
        return (
            <Select onValueChange={(value) => handleSelectChange('countryOfResidence', value)} value={formData.countryOfResidence}>
                <SelectTrigger><SelectValue placeholder="Select your country of residence" /></SelectTrigger>
                <SelectContent>{countries.map(c => <SelectItem key={c.isoCode} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
        );
      case 3:
        return (
            <Select onValueChange={(value) => handleSelectChange('cityOfResidence', value)} value={formData.cityOfResidence} disabled={!formData.countryOfResidenceCode}>
                <SelectTrigger><SelectValue placeholder="Select your city of residence" /></SelectTrigger>
                <SelectContent>{cities.length > 0 ? cities.map(city => <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>) : <SelectItem value="" disabled>No cities found</SelectItem>}</SelectContent>
            </Select>
        );
      case 4:
        return (
            <div className="space-y-4 w-full">
                <Select onValueChange={(value) => handleSelectChange('maritalStatus', value)} value={formData.maritalStatus}>
                    <SelectTrigger><SelectValue placeholder="Select your marital status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                </Select>
                <Input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
            </div>
        );
      case 5:
        return (
          <div className="space-y-4 w-full">
            <Input name="university" value={formData.university} onChange={handleChange} placeholder="University / Institution" />
            <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="License / Qualification Number" />
            <Input name="fieldOfSpecialization" value={formData.fieldOfSpecialization} onChange={handleChange} placeholder="Field of Specialization" />
            <Input name="yearsOfExperience" type="number" value={formData.yearsOfExperience} onChange={handleChange} placeholder="Years of Experience" />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4 w-full">
            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <Select value={formData.specialization} onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value, otherSpecialization: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                <SelectContent>
                  {['Marital', 'Pre-marital', 'Mental Health', 'Addiction', 'Grief', 'Family', 'Trauma', 'Other'].map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.specialization === 'Other' && (
                <Input className="mt-2" placeholder="Enter specialization" value={formData.otherSpecialization} onChange={(e) => setFormData(prev => ({ ...prev, otherSpecialization: e.target.value }))} />
              )}
            </div>
            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value, otherLanguage: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                <SelectContent>
                  {['English', 'Yoruba', 'Igbo', 'Hausa', 'Arabic', 'French', 'Other'].map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.language === 'Other' && (
                <Input className="mt-2" placeholder="Enter language" value={formData.otherLanguage} onChange={(e) => setFormData(prev => ({ ...prev, otherLanguage: e.target.value }))} />
              )}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="w-full">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." rows={6} />
          </div>
        );
      default:
        navigate('/counselor-onboarding/1');
        return null;
    }
  };

  return (
    <div className="auth-layout">
      <div className="bg-white rounded-lg shadow-md w-full max-w-[1067px] h-[520px] p-8">
        <div className="flex items-center justify-center mb-6">
          <img src="/lovable-uploads/quluublogosmall.png" alt="Quluub Logo" />
        </div>

        <h2 className="text-xl font-medium mb-1">Please fill the correct information</h2>
        <div className="mb-8">
          <h3 className="font-medium text-lg mb-2 flex items-center">
            <span className="bg-primary w-6 h-6 rounded-full flex items-center justify-center text-white text-sm mr-3">
              {currentStep}
            </span>
            {steps[currentStep - 1]?.title}
          </h3>
          <p className="text-gray-600 text-sm">{stepDescriptions[currentStep - 1]}</p>
        </div>

        <div className="mb-8 w-full md:w-1/2">
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isLoading}>Back</Button>
          {currentStep < steps.length ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Finish Onboarding'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selected, onChange }) => {
  const handleSelect = (option: string) => {
    const currentSelected = Array.isArray(selected) ? selected : [];
    const newSelected = currentSelected.includes(option)
      ? currentSelected.filter(item => item !== option)
      : [...currentSelected, option];
    onChange(newSelected);
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md">
      {options.map(option => (
        <Button key={option} type="button" variant={(selected || []).includes(option) ? 'default' : 'outline'} onClick={() => handleSelect(option)}>
          {option}
        </Button>
      ))}
    </div>
  );
};

export default CounselorOnboarding;
