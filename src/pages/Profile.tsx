import React from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <SidebarLayout activePath="/profile">
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-8">My Profile</h1>
          <p>Could not load user profile. Please try logging in again.</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout activePath="/profile">
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-white mb-8">My Profile</h1>
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p>{user.firstName} {user.lastName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Email Address</p>
              <p>{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Phone Number</p>
              <p>{user.phone || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Country</p>
              <p>{user.country || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">City</p>
              <p>{user.city || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Marital Status</p>
              <p>{user.maritalStatus || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Nationality</p>
              <p>{user.nationality || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Profile;
