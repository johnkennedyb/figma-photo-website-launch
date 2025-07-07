import React, { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

const ClientSettings: React.FC = () => {
  const { user, logout, loading, loadUser } = useAuth();
  const navigate = useNavigate();
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    country: '',
    city: '',
    maritalStatus: '',
    nationality: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    resetPasswordEmail: ''
  });

  useEffect(() => {
    if (user) {
      const formattedDate = user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '';
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: formattedDate,
        country: user.country || '',
        city: user.city || '',
        maritalStatus: user.maritalStatus || '',
        nationality: user.nationality || '',
        resetPasswordEmail: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    const payload = {
      name: formData.name,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      country: formData.country,
      city: formData.city,
      maritalStatus: formData.maritalStatus,
      nationality: formData.nationality,
    };

    try {
      await api.put('/users/personal-info', payload);
      toast.success('Personal information updated successfully');
      loadUser(); // Refresh user data
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update personal information.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    const payload = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    };

    try {
      const response = await api.put('/users/change-password', payload);
      toast.success(response.data.msg || 'Password changed successfully');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to change password.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email: formData.resetPasswordEmail });
      toast.success('Password reset instructions sent to your email.');
      setShowResetPasswordDialog(false);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to send reset link.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <SidebarLayout activePath="/settings">
      <div className="p-4 md:p-6 dashboard-background  min-h-screen">

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>
      
      <Tabs defaultValue="personal" className="mb-6">
        <div className="relative w-full overflow-x-auto">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="password">Password & Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="personal" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={formData.email} disabled className="mt-1 bg-gray-100" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" value={formData.country} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Input id="maritalStatus" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} className="mt-1" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleChangePasswordSubmit}>
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowResetPasswordDialog(true)}
                  >
                    Forgot Password?
                  </Button>
                  <Button type="submit">Change Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Account Actions</h2>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Log Out</h3>
                    <p className="text-sm text-gray-600">Sign out from all devices</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    Log Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
              <p className="text-gray-500">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPasswordSubmit}>
            <div className="p-4 md:p-6">
              <p className="text-gray-600 mb-4">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              <Label htmlFor="resetPasswordEmail">Email</Label>
              <Input
                id="resetPasswordEmail"
                name="resetPasswordEmail"
                type="email"
                value={formData.resetPasswordEmail}
                onChange={handleChange}
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
              <Button type="submit">Send Reset Link</Button>
            </DialogFooter>
          </form>
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
              className="bg-primary text-white hover:bg-primary/90"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </SidebarLayout>
  );
};

export default ClientSettings;
