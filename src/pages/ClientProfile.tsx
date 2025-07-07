import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CounselorSidebarLayout from '@/components/CounselorSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClientProfileData {
  name: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  country: string;
  city: string;
  maritalStatus: string;
  occupation: string;
  reason: string;
}

const ClientProfile: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ClientProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClientProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication error. Please log in.');
        navigate('/counselor-login');
        return;
      }

      try {
        const res = await fetch(`http://localhost:3002/api/users/client/${clientId}`, {
          headers: { 'x-auth-token': token },
        });

        if (!res.ok) throw new Error('Failed to fetch client profile');

        const data = await res.json();
        setProfile(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientProfile();
  }, [clientId, navigate]);

  if (isLoading) {
    return (
      <CounselorSidebarLayout activePath="">
        <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </CounselorSidebarLayout>
    );
  }

  if (!profile) {
    return (
      <CounselorSidebarLayout activePath="">
        <div className="text-center p-8">Could not load client profile.</div>
      </CounselorSidebarLayout>
    );
  }

  return (
    <CounselorSidebarLayout activePath="">
      <div className="dashboard-background min-h-screen p-6">
        <h1 className="text-2xl font-semibold mb-8">Client Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>{profile.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Date of Birth:</strong> {new Date(profile.dateOfBirth).toLocaleDateString()}</div>
              <div><strong>Nationality:</strong> {profile.nationality}</div>
              <div><strong>Country:</strong> {profile.country}</div>
              <div><strong>City:</strong> {profile.city}</div>
              <div><strong>Marital Status:</strong> {profile.maritalStatus}</div>
              <div><strong>Occupation:</strong> {profile.occupation}</div>
              <div className="md:col-span-2"><strong>Reason for Seeking Counseling:</strong><p>{profile.reason}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CounselorSidebarLayout>
  );
};

export default ClientProfile;
