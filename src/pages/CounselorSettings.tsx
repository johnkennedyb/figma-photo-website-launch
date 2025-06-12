
import React, { useState } from 'react';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Bell, Settings as SettingsIcon } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const CounselorSettings: React.FC = () => {
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Ahaj',
    lastName: 'Musa Bello',
    dateOfBirth: '5th of May, 1993',
    nationality: 'Nigerian',
    state: 'Lagos, Nigeria',
    language: 'English, Yoruba',
    maritalStatus: 'Married',
    email: 'belomusa09@gmail.com',
    degree: 'University Degree',
    specialty: 'Therapist',
    experience: 'Professional Counselling Bodies',
    yearsExperience: '7 Years'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    toast.success('Personal information updated successfully');
  };

  const handleResetPassword = () => {
    toast.success('Password reset link sent to your email');
    setShowResetPasswordDialog(false);
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  return (
    <CounselorSidebarLayout activePath="/counselor-settings">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          Settings <SettingsIcon size={24} className="text-gray-600" />
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-teal-600 text-white border-teal-600 hover:bg-teal-700">
            <Search size={16} className="mr-2" />
            Search
          </Button>
          <Button size="icon" variant="ghost">
            <Bell size={18} />
          </Button>
        </div>
      </div>
      
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            
            <div className="flex items-start gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 text-lg font-semibold">AM</span>
              </div>
              
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm text-gray-600">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm text-gray-600">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-sm text-gray-600">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="degree" className="text-sm text-gray-600">Educational Background</Label>
                  <Input
                    id="degree"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="nationality" className="text-sm text-gray-600">Nationality</Label>
                  <Input
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="specialty" className="text-sm text-gray-600">Specialization</Label>
                  <Input
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm text-gray-600">State/Country</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="experience" className="text-sm text-gray-600">Professional Affiliation</Label>
                  <Input
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="language" className="text-sm text-gray-600">Language(s)</Label>
                  <Input
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="yearsExperience" className="text-sm text-gray-600">Years of Experience</Label>
                  <Input
                    id="yearsExperience"
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="maritalStatus" className="text-sm text-gray-600">Marital Status</Label>
                  <Input
                    id="maritalStatus"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className="mt-1 border-gray-200"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mb-6">
              <Button onClick={handleSaveChanges} className="bg-teal-600 hover:bg-teal-700">
                Edit
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <div 
              className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
              onClick={() => setShowResetPasswordDialog(true)}
            >
              <span className="font-medium">Reset Password</span>
              <span className="text-gray-400">›</span>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowLogoutDialog(true)}
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            <Label htmlFor="resetEmail">Email</Label>
            <Input
              id="resetEmail"
              type="email"
              defaultValue={formData.email}
              className="mt-1"
              placeholder="Enter your email"
            />
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowResetPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleResetPassword} className="bg-teal-600 hover:bg-teal-700">
              Send Reset Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold">Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              You will be logged out of your account on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout} 
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CounselorSidebarLayout>
  );
};

export default CounselorSettings;
