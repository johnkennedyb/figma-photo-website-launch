import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Props {
  clientId: string | null;
  open: boolean;
  onOpenChange: (val: boolean) => void;
}

interface ClientProfileData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  nationality?: string;
  country?: string;
  city?: string;
  maritalStatus?: string;
  occupation?: string;
  reason?: string;
}

const ClientProfileDialog: React.FC<Props> = ({ clientId, open, onOpenChange }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ClientProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';
  const initials = profile ? `${profile.firstName[0]}${profile.lastName[0]}` : '';

  useEffect(() => {
    if (!open || !clientId) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/${clientId}`);
        setProfile(data);
      } catch (err: any) {
        toast.error('Failed to load client profile');
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [clientId, open, onOpenChange]);

  

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        {loading || !profile ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{fullName}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 mt-4">
              <Avatar className="w-20 h-20 bg-teal-600 text-white text-2xl font-semibold">
                <AvatarFallback>{profile.firstName.charAt(0)}{profile.lastName.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="text-gray-600">{profile.email}</p>
            </div>
            <Card className="border-none shadow-none">
              <CardContent className="p-0 space-y-2 text-sm">
                <div><strong>Email:</strong> {profile.email}</div>
                {profile.dateOfBirth && (<div><strong>DOB:</strong> {new Date(profile.dateOfBirth).toLocaleDateString()}</div>)}
                {profile.nationality && (<div><strong>Nationality:</strong> {profile.nationality}</div>)}
                {profile.country && (<div><strong>Country:</strong> {profile.country}</div>)}
                {profile.city && (<div><strong>City:</strong> {profile.city}</div>)}
                {profile.maritalStatus && (<div><strong>Marital Status:</strong> {profile.maritalStatus}</div>)}
                {profile.occupation && (<div><strong>Occupation:</strong> {profile.occupation}</div>)}
                {profile.reason && (<div><strong>Reason:</strong> {profile.reason}</div>)}
              </CardContent>
            </Card>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button onClick={() => { onOpenChange(false); if(clientId) navigate(`/counselor/chat/${clientId}`); }}>
                Chat Client
              </Button>
            </div>
          </>
        )}
        <DialogClose asChild />
      </DialogContent>
    </Dialog>
  );
};

export default ClientProfileDialog;
