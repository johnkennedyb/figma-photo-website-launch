import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const stepConfigs = [
  { id: 1, title: 'Full Name', description: 'Please enter your full name as you want it to appear to clients.', fields: ['name'] },
  { id: 2, title: 'Nationality', description: 'Please enter your nationality.', fields: ['nationality'] },
  { id: 3, title: 'Country of Residence', description: 'Where do you currently live?', fields: ['countryOfResidence'] },
  { id: 4, title: 'City of Residence', description: 'Please provide your city.', fields: ['cityOfResidence'] },
  { id: 5, title: 'Marital Status', description: 'Please select your marital status.', fields: ['maritalStatus'] },
  { id: 6, title: 'Professional Background', description: 'Tell us about your qualifications and experience.', fields: ['academicQualifications', 'relevantPositions', 'yearsOfExperience'] },
  { id: 7, title: 'Specialization & Affiliations', description: 'What are your areas of expertise?', fields: ['issuesSpecialization', 'affiliations'] },
  { id: 8, title: 'Languages Spoken', description: 'What languages do you speak?', fields: ['languageProficiency'] },
  { id: 9, title: 'Session Rates', description: 'Set your rates per session.', fields: ['sessionRate', 'ngnSessionRate'] },
];

const CounselorOnboardingStep: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading, loadUser } = useAuth();
  const currentStep = parseInt(step || '1');

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('counselorOnboardingData');
    const defaultData = {
      name: '',
      nationality: '',
      countryOfResidence: '',
      cityOfResidence: '',
      maritalStatus: '',
      academicQualifications: '',
      relevantPositions: '',
      yearsOfExperience: '',
      issuesSpecialization: '',
      affiliations: '',
      languageProficiency: {
        english: false,
        hausa: false,
        yoruba: false,
        other: ''
      },
      sessionRate: '',
      ngnSessionRate: ''
    };

    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Deep merge for languageProficiency to ensure all keys exist
      const mergedLanguageProficiency = {
        ...defaultData.languageProficiency,
        ...(parsedData.languageProficiency || {}),
      };
      return { ...defaultData, ...parsedData, languageProficiency: mergedLanguageProficiency };
    }

    return defaultData;
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/counselor-login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem('counselorOnboardingData', JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      languageProficiency: { ...prev.languageProficiency, [language]: checked }
    }));
  };

  const handleLanguageInputChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      languageProficiency: { ...prev.languageProficiency, other: value }
    }));
  };

  const validateStep = () => {
    const currentFields = stepConfigs.find(s => s.id === currentStep)?.fields || [];
    for (const field of currentFields) {
      const value = formData[field as keyof typeof formData];
      if (field === 'languageProficiency') {
        const { english, hausa, yoruba, other } = formData.languageProficiency;
        if (!english && !hausa && !yoruba && !other.trim()) {
          toast({
            title: "Validation Error",
            description: "Please select at least one language or specify 'other'.",
            variant: "destructive",
          });
          return false;
        }
      } else if (!value || (typeof value === 'string' && !value.trim())) {
        toast({ title: 'Validation Error', description: `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`, variant: 'destructive' });
        return false;
      } else if (['yearsOfExperience', 'sessionRate', 'ngnSessionRate'].includes(field) && isNaN(Number(value))) {
        toast({ title: 'Validation Error', description: `Please enter a valid number for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`, variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep < stepConfigs.length) {
      navigate(`/counselor-onboarding/${currentStep + 1}`);
    } else {
      if (!isAuthenticated) {
        toast({ title: 'Authentication Error', description: 'You are not logged in.', variant: 'destructive' });
        return;
      }
      try {
        const languages = Object.entries(formData.languageProficiency)
          .filter(([, isChecked]) => isChecked)
          .map(([lang]) => lang === 'other' ? formData.languageProficiency.other : lang.charAt(0).toUpperCase() + lang.slice(1))
          .filter(Boolean) // Remove any empty strings from 'other'
          .join(', ');

        const finalData = { ...formData, languageProficiency: languages };

        await api.put('/users/counselor-onboarding', finalData);
        await loadUser(); // Refresh user data

        toast({
          title: 'Onboarding Complete',
          description: 'Your profile has been successfully set up.',
        });
        localStorage.removeItem('counselorOnboardingData');
        navigate('/counselor-dashboard');
      } catch (error: any) {
        console.error('Onboarding submission failed:', error.response?.data || error);
        toast({
          title: 'Submission Failed',
          description: error.response?.data?.msg || 'An unexpected error occurred. Please check the console for details.',
          variant: 'destructive',
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      navigate(`/counselor-onboarding/${currentStep - 1}`);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Dr. Aisha Al-Fulan" />;
      case 2:
        return <Input name="nationality" value={formData.nationality} onChange={handleInputChange} placeholder="e.g., Emirati" />;
      case 3:
        return <Input name="countryOfResidence" value={formData.countryOfResidence} onChange={handleInputChange} placeholder="e.g., United Arab Emirates" />;
      case 4:
        return <Input name="cityOfResidence" value={formData.cityOfResidence} onChange={handleInputChange} placeholder="e.g., Dubai" />;
      case 5:
        return (
          <Select name="maritalStatus" onValueChange={(value) => handleSelectChange('maritalStatus', value)} value={formData.maritalStatus}>
            <SelectTrigger><SelectValue placeholder="Select marital status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        );
      case 6:
        return (
          <div className="space-y-4">
            <Input name="academicQualifications" value={formData.academicQualifications} onChange={handleInputChange} placeholder="Academic Qualifications (e.g., PhD in Psychology)" />
            <Input name="relevantPositions" value={formData.relevantPositions} onChange={handleInputChange} placeholder="Relevant Positions Held" />
            <Input name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleInputChange} placeholder="Years of Experience" type="number" />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <Input name="issuesSpecialization" value={formData.issuesSpecialization} onChange={handleInputChange} placeholder="Issues of Specialization (e.g., Family, Marriage)" />
            <Input name="affiliations" value={formData.affiliations} onChange={handleInputChange} placeholder="Affiliations & Memberships" />
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="sessionRate" className="text-sm font-medium">Session Rate (USD)</label>
              <Input id="sessionRate" name="sessionRate" value={formData.sessionRate} onChange={handleInputChange} placeholder="e.g., 50" type="number" />
            </div>
            <div>
              <label htmlFor="ngnSessionRate" className="text-sm font-medium">Session Rate (NGN)</label>
              <Input id="ngnSessionRate" name="ngnSessionRate" value={formData.ngnSessionRate} onChange={handleInputChange} placeholder="e.g., 25000" type="number" />
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <label>Select all applicable languages</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2"><Checkbox id="english" checked={formData.languageProficiency.english} onCheckedChange={(checked) => handleCheckboxChange('english', checked === true)} /><label htmlFor="english">English</label></div>
              <div className="flex items-center space-x-2"><Checkbox id="hausa" checked={formData.languageProficiency.hausa} onCheckedChange={(checked) => handleCheckboxChange('hausa', checked === true)} /><label htmlFor="hausa">Hausa</label></div>
              <div className="flex items-center space-x-2"><Checkbox id="yoruba" checked={formData.languageProficiency.yoruba} onCheckedChange={(checked) => handleCheckboxChange('yoruba', checked === true)} /><label htmlFor="yoruba">Yoruba</label></div>
            </div>
            <Input name="other" value={formData.languageProficiency.other} onChange={(e) => handleLanguageInputChange(e.target.value)} placeholder="Other language(s), comma separated" />
          </div>
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  const currentConfig = stepConfigs.find(s => s.id === currentStep) || stepConfigs[0];

  return (
    <div className="auth-layout">
      <div className="bg-white rounded-lg shadow-md w-full max-w-[1067px] min-h-[520px] p-8 flex flex-col">
        <div className="flex items-center justify-center mb-6">
          <img src="/lovable-uploads/quluublogosmall.png" alt="Quluub Logo" />
        </div>
        
        <h2 className="text-xl font-medium mb-1 text-center">Please fill the correct information</h2>
        
        <div className="my-8">
          <h3 className="font-medium text-lg mb-2 flex items-center">
            <span className="bg-primary w-6 h-6 rounded-full flex items-center justify-center text-white text-sm mr-3">
              {currentStep}
            </span>
            {currentConfig.title}
          </h3>
          <p className="text-gray-600 text-sm ml-9">{currentConfig.description}</p>
        </div>
        
        <div className="mb-8 w-full md:w-3/4 lg:w-1/2">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between items-center mt-auto pt-8">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
          >
            {currentStep === stepConfigs.length ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CounselorOnboardingStep;
