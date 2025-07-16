import React, { useState, useEffect } from 'react';
import { Country, City } from 'country-state-city';
import { ICountry, ICity } from 'country-state-city/lib/interface';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

const ClientSettings: React.FC = () => {
  const { user, logout, loading, loadUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    country: user?.country || '',
    city: user?.city || '',
    maritalStatus: user?.maritalStatus || '',
    nationality: user?.nationality || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    resetPasswordEmail: user?.email || ''
  });
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);



  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  useEffect(() => {
    if (formData.country) {
      setCities(City.getCitiesOfCountry(formData.country) || []);
    } else {
      setCities([]);
    }
  }, [formData.country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'country' && { city: '' }), // Reset city when country changes
    }));
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      country: formData.country,
      city: formData.city,
      maritalStatus: formData.maritalStatus,
      nationality: formData.nationality,
    };

    try {
      await api.put('/users/personal-info', payload);
      toast({ title: 'Success', description: 'Personal information updated successfully' });
      loadUser(); // Refresh user data
    } catch (err: unknown) {
      let errorMessage = 'Failed to update personal information.';
      if (typeof err === 'object' && err !== null) {
        const apiError = err as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }

    const payload = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    };

    try {
      const response = await api.put('/users/change-password', payload);
      toast({ title: 'Success', description: response.data.msg || 'Password changed successfully' });
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: unknown) {
      let errorMessage = 'Failed to change password.';
      if (typeof err === 'object' && err !== null) {
        const apiError = err as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email: formData.resetPasswordEmail });
      toast({ title: 'Success', description: 'Password reset instructions sent to your email.' });
      setShowResetPasswordDialog(false);
    } catch (err: unknown) {
      let errorMessage = 'Failed to send reset link.';
      if (typeof err === 'object' && err !== null) {
        const apiError = err as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
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
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1" />
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
                    <Select name="country" value={formData.country} onValueChange={(value) => handleSelectChange('country', value)}>
                      <SelectTrigger className="mt-1">
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
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Select name="city" value={formData.city} onValueChange={(value) => handleSelectChange('city', value)} disabled={!formData.country || cities.length === 0}>
                      <SelectTrigger className="mt-1">
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
                  </div>
                  <div>
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select name="maritalStatus" value={formData.maritalStatus} onValueChange={(value) => handleSelectChange('maritalStatus', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select name="nationality" value={formData.nationality} onValueChange={(value) => handleSelectChange('nationality', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your nationality" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {countries.map((country) => (
                          <SelectItem key={country.name} value={country.name}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
