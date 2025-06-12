import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

const CounselorOnboardingStep: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentStep = parseInt(step || '1');
  
  const [formData, setFormData] = useState({
    nationality: '',
    countryOfResidence: '',
    cityOfResidence: '',
    maritalStatus: '',
    academicQualifications: '',
    relevantPositions: '',
    yearsOfExperience: '',
    issuesSpecialization: '',
    affiliations: '',
    languages: {
      arabic: false,
      urdu: false,
      farsi: false,
      other: ''
    }
  });

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
      languages: { ...prev.languages, [language]: checked }
    }));
  };

  const handleLanguageInputChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      languages: { ...prev.languages, other: value }
    }));
  };

  const handleNext = () => {
    if (currentStep < 7) {
      navigate(`/counselor-onboarding/${currentStep + 1}`);
    } else {
      // Complete onboarding
      toast({
        title: "Onboarding completed",
        description: "Your profile has been created."
      });
      navigate('/counselor-dashboard');
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
        return (
          <div className="space-y-6">
            <h2 className="text-lg">2. Nationality</h2>
            <Input
              name="nationality"
              value={formData.nationality}
              onChange={handleInputChange}
              placeholder="Input"
              className="h-12 bg-teal-50 border-teal-600"
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-lg">3. Country of Residence</h2>
            <Input
              name="countryOfResidence"
              value={formData.countryOfResidence}
              onChange={handleInputChange}
              placeholder="Input"
              className="h-12 bg-teal-50 border-teal-600"
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-lg">4. City of Residence</h2>
            <Input
              name="cityOfResidence"
              value={formData.cityOfResidence}
              onChange={handleInputChange}
              placeholder="Input"
              className="h-12 bg-teal-50 border-teal-600"
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-lg">5. Marital Status</h2>
            <Select
              onValueChange={(value) => handleSelectChange('maritalStatus', value)}
              value={formData.maritalStatus}
            >
              <SelectTrigger className="h-12 bg-teal-50 border-teal-600">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="separated">Separated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-lg">6. Summary of Experience/Qualification</h2>
            <p className="text-sm text-gray-600">
              Please provide a brief summary of your background to help clients understand your expertise.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">
                  Academic Qualifications <span className="italic">(Degree, certifications in counselling, psychology, Islamic studies)</span>
                </label>
                <Input
                  name="academicQualifications"
                  value={formData.academicQualifications}
                  onChange={handleInputChange}
                  placeholder="Input the option applicable to you"
                  className="h-12 bg-teal-50 border-teal-600 mt-2"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">
                  Relevant Positions <span className="italic">(Imam, chaplain, therapist, community leader, marriage coach)</span>
                </label>
                <Input
                  name="relevantPositions"
                  value={formData.relevantPositions}
                  onChange={handleInputChange}
                  placeholder="Input the option applicable to you"
                  className="h-12 bg-teal-50 border-teal-600 mt-2"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">
                  Years of Experience in counselling individuals or couples
                </label>
                <Input
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                  placeholder="Input"
                  className="h-12 bg-teal-50 border-teal-600 mt-2"
                />
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-lg">Summary of Experience/Qualification</h2>
            <p className="text-sm text-gray-600">
              Please provide a brief summary of your background to help clients understand your expertise.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">
                  Types of Issues You Specialise in <span className="italic">(Marital conflict resolution, premarital counselling)</span>
                </label>
                <Input
                  name="issuesSpecialization"
                  value={formData.issuesSpecialization}
                  onChange={handleInputChange}
                  placeholder="Input the option applicable to you"
                  className="h-12 bg-teal-50 border-teal-600 mt-2"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">
                  Affiliations & Memberships <span className="italic">(Professional counselling bodies, Islamic organizations, community service groups)</span>
                </label>
                <Input
                  name="affiliations"
                  value={formData.affiliations}
                  onChange={handleInputChange}
                  placeholder="Input the option applicable to you"
                  className="h-12 bg-teal-50 border-teal-600 mt-2"
                />
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-lg">7. Languages Spoken</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="arabic" 
                  checked={formData.languages.arabic}
                  onCheckedChange={(checked) => handleCheckboxChange('arabic', checked === true)} 
                />
                <label htmlFor="arabic" className="text-sm">Arabic</label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="urdu" 
                  checked={formData.languages.urdu}
                  onCheckedChange={(checked) => handleCheckboxChange('urdu', checked === true)} 
                />
                <label htmlFor="urdu" className="text-sm">Urdu</label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="farsi" 
                  checked={formData.languages.farsi}
                  onCheckedChange={(checked) => handleCheckboxChange('farsi', checked === true)} 
                />
                <label htmlFor="farsi" className="text-sm">Farsi</label>
              </div>
              
              <Input
                name="other"
                value={formData.languages.other}
                onChange={(e) => handleLanguageInputChange(e.target.value)}
                placeholder="Other? Input"
                className="h-12 bg-teal-50 border-teal-600"
              />
            </div>
          </div>
        );
      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-600 bg-gradient-to-b from-teal-600 to-teal-700 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl">
        <div className="flex justify-center mb-8">
          <img src="/lovable-uploads/c47151cc-f491-4b1e-82ef-1ef8d837d9ba.png" alt="Quluub Logo" className="h-12" />
        </div>
        
        <div className="text-center mb-8">
          <p className="text-gray-600">Please fill in the correct information</p>
        </div>
        
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>
        
        <div className="flex justify-between mt-8">
          {currentStep > 1 ? (
            <Button
              onClick={handlePrevious}
              className="bg-teal-600 hover:bg-teal-700 px-8"
            >
              Previous
            </Button>
          ) : (
            <div></div>
          )}
          
          <Button
            onClick={handleNext}
            className="bg-white text-black border border-gray-300 hover:bg-gray-100 px-8"
          >
            {currentStep === 7 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CounselorOnboardingStep;
