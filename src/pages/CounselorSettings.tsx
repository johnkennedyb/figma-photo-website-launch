import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Loader2, Trash2, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface BankAccount {
  _id: string;
  accountType: 'local' | 'international';
  accountName: string;
  country: string;
  // Local
  bankName?: string;
  accountNumber?: string;
  // International
  iban?: string;
  swiftBic?: string;
}

const CounselorSettings: React.FC = () => {
  const { user, logout, loading: authLoading, loadUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [showAddAccountDialog, setShowAddAccountDialog] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [newAccountData, setNewAccountData] = useState({
    accountType: 'local' as 'local' | 'international',
    country: 'NG',
    accountName: '',
    bankName: '',
    accountNumber: '',
    iban: '',
    swiftBic: '',
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
  });

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        const res = await api.get('/wallet/bank-accounts');
        setBankAccounts(res.data);
      } catch (error) {
        toast({ title: 'Error', description: 'Could not fetch bank accounts.', variant: 'destructive' });
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    if (!authLoading) {
      fetchBankAccounts();
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
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
      }));
    }
  }, [user, authLoading, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const personalInfoPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        nationality: formData.nationality,
        countryOfResidence: formData.countryOfResidence,
        cityOfResidence: formData.cityOfResidence,
        maritalStatus: formData.maritalStatus,
      };

      const profilePayload = {
        academicQualifications: formData.academicQualifications,
        relevantPositions: formData.relevantPositions,
        yearsOfExperience: formData.yearsOfExperience,
        issuesSpecialization: formData.issuesSpecialization,
        affiliations: formData.affiliations,
      };

      // Consolidate payloads and send to the correct endpoint
      const combinedPayload = { ...personalInfoPayload, ...profilePayload };
      await api.put('/counselors/profile', combinedPayload);

      toast({ title: 'Success', description: 'Your changes have been saved.' });
      loadUser(); // Refresh user data from context
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    toast({ title: 'Info', description: 'Sending password reset link...' });
    try {
      await api.post('/auth/forgot-password', { email: formData.email });
      toast({ title: 'Success', description: 'Password reset link sent to your email.' });
      setShowResetPasswordDialog(false);
    } catch (error: unknown) {
      let errorMessage = 'Failed to send reset link. Please try again.';
      if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const handleAddAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAccountData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAccountTypeChange = (value: 'local' | 'international') => {
    setNewAccountData(prev => ({ ...prev, accountType: value }));
  };

  const handleAddAccount = async () => {
    setIsAddingAccount(true);
    try {
      const payload = {
        accountType: newAccountData.accountType,
        country: newAccountData.country,
        accountName: newAccountData.accountName,
        ...(newAccountData.accountType === 'local' ? {
          bankName: newAccountData.bankName,
          accountNumber: newAccountData.accountNumber,
        } : {
          iban: newAccountData.iban,
          swiftBic: newAccountData.swiftBic,
        })
      };
      const res = await api.post('/wallet/bank-accounts', payload);
      setBankAccounts(prev => [...prev, res.data]);
      toast({ title: 'Success', description: 'Bank account added successfully.' });
      setShowAddAccountDialog(false);
      setNewAccountData({
        accountType: 'local',
        country: 'NG',
        accountName: '',
        bankName: '',
        accountNumber: '',
        iban: '',
        swiftBic: '',
      });
    } catch (error: unknown) {
      let errorMessage = 'Failed to add bank account.';
      if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { msg?: string } } };
        errorMessage = apiError.response?.data?.msg || errorMessage;
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsAddingAccount(false);
    }
  };

  const openDeleteDialog = (account: BankAccount) => {
    setAccountToDelete(account);
    setShowDeleteDialog(true);
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      await api.delete(`/wallet/bank-accounts/${accountToDelete._id}`);
      setBankAccounts(prev => prev.filter(acc => acc._id !== accountToDelete._id));
      toast({ title: 'Success', description: 'Bank account removed.' });
      setShowDeleteDialog(false);
      setAccountToDelete(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove bank account.', variant: 'destructive' });
    }
  };

  if (authLoading) {
    return (
      <CounselorSidebarLayout activePath="/counselor/settings">
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </CounselorSidebarLayout>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  }

  return (
    <CounselorSidebarLayout activePath="/counselor/settings">
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
                  <span className="text-orange-600 text-lg font-semibold">{getInitials(formData.firstName, formData.lastName)}</span>
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
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
                </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Bank Accounts</h3>
              <Card>
                <CardContent className="p-6">
                  {isLoadingAccounts ? (
                    <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : (
                    <div className="space-y-4">
                      {bankAccounts.map(account => (
                        <div key={account._id} className="flex items-center justify-between p-3 rounded-md border">
                          <div>
                            <p className="font-medium">{account.accountName}</p>
                            <p className="text-sm text-gray-500">
                              {account.accountType === 'local' ? 
                                `${account.bankName} - ${account.accountNumber}` : 
                                `IBAN: ${account.iban}`}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(account)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      {bankAccounts.length === 0 && <p className="text-center text-gray-500">No bank accounts added.</p>}
                    </div>
                  )}
                  <Button variant="outline" className="mt-4 w-full" onClick={() => setShowAddAccountDialog(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
                  </Button>
                </CardContent>
              </Card>
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

        <Dialog open={showAddAccountDialog} onOpenChange={setShowAddAccountDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Bank Account</DialogTitle>
              <DialogDescription>Enter details for your local or international bank account.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select onValueChange={handleAddAccountTypeChange} defaultValue={newAccountData.accountType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local (Nigeria)</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" name="accountName" value={newAccountData.accountName} onChange={handleAddAccountChange} />
              </div>
              {newAccountData.accountType === 'local' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" name="bankName" value={newAccountData.bankName} onChange={handleAddAccountChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input id="accountNumber" name="accountNumber" value={newAccountData.accountNumber} onChange={handleAddAccountChange} />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input id="iban" name="iban" value={newAccountData.iban} onChange={handleAddAccountChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swiftBic">SWIFT/BIC Code</Label>
                    <Input id="swiftBic" name="swiftBic" value={newAccountData.swiftBic} onChange={handleAddAccountChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" name="country" value={newAccountData.country} onChange={handleAddAccountChange} />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddAccountDialog(false)}>Cancel</Button>
              <Button onClick={handleAddAccount} disabled={isAddingAccount}>
                {isAddingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Add Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this bank account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CounselorSidebarLayout>
  );
};

export default CounselorSettings;
