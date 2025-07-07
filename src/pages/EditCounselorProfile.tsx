import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface CounselorProfileData {
  name: string;
  specialty: string;
  bio: string;
  experience: string;
  education: string;
  certifications: string[];
  languages: string[];
  sessionRate: string;
  availability: string[];
}

const EditCounselorProfile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Partial<CounselorProfileData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:3002/api/auth', {
          headers: { 'x-auth-token': token },
        });

        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile({
          ...data,
          certifications: data.certifications || [],
          languages: data.languages || [],
          availability: data.availability || [],
        });
      } catch (error) {
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof CounselorProfileData) => {
    const { value } = e.target;
    setProfile(prev => ({ ...prev, [field]: value.split(',').map(item => item.trim()) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3002/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token!,
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      toast({ title: 'Success', description: 'Your profile has been updated.' });
      navigate('/counselor/dashboard'); // Or wherever counselors are redirected
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <SidebarLayout activePath="/counselor/profile/edit"><div>Loading...</div></SidebarLayout>;
  }

  return (
    <SidebarLayout activePath="/counselor/profile/edit">
      <Card>
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name">Name</label>
                <Input id="name" name="name" value={profile.name || ''} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="specialty">Specialty</label>
                <Input id="specialty" name="specialty" value={profile.specialty || ''} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label htmlFor="bio">Bio</label>
              <Textarea id="bio" name="bio" value={profile.bio || ''} onChange={handleChange} rows={5} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label htmlFor="experience">Experience (e.g., 5 years)</label>
                <Input id="experience" name="experience" value={profile.experience || ''} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="education">Education</label>
                <Input id="education" name="education" value={profile.education || ''} onChange={handleChange} />
              </div>
            </div>
             <div>
              <label htmlFor="sessionRate">Session Rate (e.g., $100 per hour)</label>
              <Input id="sessionRate" name="sessionRate" value={profile.sessionRate || ''} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="certifications">Certifications (comma-separated)</label>
              <Input id="certifications" name="certifications" value={profile.certifications?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'certifications')} />
            </div>
            <div>
              <label htmlFor="languages">Languages (comma-separated)</label>
              <Input id="languages" name="languages" value={profile.languages?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'languages')} />
            </div>
            <div>
              <label htmlFor="availability">Availability (comma-separated days)</label>
              <Input id="availability" name="availability" value={profile.availability?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'availability')} />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </SidebarLayout>
  );
};

export default EditCounselorProfile;
