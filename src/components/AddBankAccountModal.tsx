import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Country, State, City } from 'country-state-city';

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

const AddBankAccountModal: React.FC<AddBankAccountModalProps> = ({ isOpen, onClose, onAccountAdded }) => {
  const [accountType, setAccountType] = useState<'local' | 'international'>('local');
  const [country, setCountry] = useState('NG'); // Default to Nigeria
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        accountType,
        country,
      };
      await api.post('/wallet/bank-accounts', payload);
      toast.success('Bank account added successfully!');
      onAccountAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to add bank account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Bank Account</DialogTitle>
          <DialogDescription>Select account type and fill in the details.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Select onValueChange={(value: 'local' | 'international') => setAccountType(value)} defaultValue={accountType}>
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local (Nigeria)</SelectItem>
              <SelectItem value="international">International</SelectItem>
            </SelectContent>
          </Select>

          {accountType === 'local' ? (
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankName" onChange={handleInputChange} placeholder="e.g., Guaranty Trust Bank" />
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input id="accountNumber" name="accountNumber" onChange={handleInputChange} placeholder="0123456789" />
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" name="accountName" onChange={handleInputChange} placeholder="John Doe" />
            </div>
          ) : (
            <div className="space-y-2">
               <Label htmlFor="country">Country</Label>
              <Select onValueChange={setCountry} value={country}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {Country.getAllCountries().map(c => (
                    <SelectItem key={c.isoCode} value={c.isoCode}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" name="iban" onChange={handleInputChange} placeholder="e.g., DE89370400440532013000" />
              <Label htmlFor="swiftBic">SWIFT / BIC</Label>
              <Input id="swiftBic" name="swiftBic" onChange={handleInputChange} placeholder="e.g., COBADEFFXXX" />
               <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" name="accountName" onChange={handleInputChange} placeholder="John Doe" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBankAccountModal;
