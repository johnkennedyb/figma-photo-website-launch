import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const CounselorSettings: React.FC = () => {
  const { user, logout, loading: authLoading, loadUser } = useAuth();
  const navigate = useNavigate();
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nationality: '',
    countryOfResidence: '',
    cityOfResidence: '',
    maritalStatus: '',
    academicQualifications: '',
    relevantPositions: '',
    yearsOfExperience: '',
    issuesSpecialization: '',
    affiliations: '',
    sessionRate: 0,
    ngnSessionRate: 0,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        nationality: user.nationality || '',
        countryOfResidence: user.countryOfResidence || '',
        cityOfResidence: user.cityOfResidence || '',
        maritalStatus: user.maritalStatus || '',
        academicQualifications: user.academicQualifications || '',
        relevantPositions: user.relevantPositions || '',
        yearsOfExperience: user.yearsOfExperience || '',
        issuesSpecialization: user.issuesSpecialization || '',
        affiliations: user.affiliations || '',
        sessionRate: user.sessionRate || 50,
        ngnSessionRate: user.ngnSessionRate || 25000,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/counselor-onboarding', formData);
      await loadUser(); // Refresh user data
      toast.success('Your changes have been saved successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    toast.info('Sending password reset link...');
    try {
      await api.post('/api/auth/forgot-password', { email: formData.email });
      toast.success('Password reset link sent to your email.');
      setShowResetPasswordDialog(false);
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Failed to send reset link. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/counselor-login');
  };

  if (authLoading) {
    return (
      <CounselorSidebarLayout activePath="/counselor-settings">
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </CounselorSidebarLayout>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  }

  return (
    <CounselorSidebarLayout activePath="/counselor-settings">
      <div className="dashboard-background min-h-screen p-4 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Settings <SettingsIcon size={24} className="text-gray-600" />
          </h1>
        </div>
        
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-lg font-semibold">{getInitials(formData.name)}</span>
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" value={formData.email} onChange={handleChange} type="email" />
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="countryOfResidence">Country of Residence</Label>
                    <Input id="countryOfResidence" name="countryOfResidence" value={formData.countryOfResidence} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Input id="maritalStatus" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Professional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="academicQualifications">Academic Qualifications</Label>
                        <Input id="academicQualifications" name="academicQualifications" value={formData.academicQualifications} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="relevantPositions">Relevant Positions</Label>
                        <Input id="relevantPositions" name="relevantPositions" value={formData.relevantPositions} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                        <Input id="yearsOfExperience" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="issuesSpecialization">Issues of Specialization</Label>
                        <Input id="issuesSpecialization" name="issuesSpecialization" value={formData.issuesSpecialization} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="affiliations">Affiliations</Label>
                        <Input id="affiliations" name="affiliations" value={formData.affiliations} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="sessionRate">Session Rate (USD)</Label>
                        <Input id="sessionRate" name="sessionRate" type="number" value={formData.sessionRate} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="ngnSessionRate">Session Rate (NGN)</Label>
                        <Input id="ngnSessionRate" name="ngnSessionRate" type="number" value={formData.ngnSessionRate} onChange={handleChange} />
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end mb-6">
              <Button onClick={handleSaveChanges} className="bg-teal-600 hover:bg-teal-700" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </div>
            
            <div className="border-t pt-6">
              <div className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-gray-50" onClick={() => setShowResetPasswordDialog(true)}>
                <span className="font-medium">Reset Password</span>
                <span className="text-gray-400">›</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowLogoutDialog(true)} className="w-full border-red-200 text-red-600 hover:bg-red-50">
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-xl font-semibold">Reset Password</DialogTitle></DialogHeader>
            <div className="py-4">
              <p className="text-gray-600 mb-4">Enter your email address and we'll send you instructions to reset your password.</p>
              <Label htmlFor="resetEmail">Email</Label>
              <Input id="resetEmail" type="email" defaultValue={formData.email} className="mt-1" placeholder="Enter your email" readOnly />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowResetPasswordDialog(false)}>Cancel</Button>
              <Button onClick={handleResetPassword} className="bg-teal-600 hover:bg-teal-700">Send Reset Link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">Are you sure you want to log out?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">You will be logged out of your account on this device.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-medium">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700">Log Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CounselorSidebarLayout>
  );
};

export default CounselorSettings;
