
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import CounselorSettings from './CounselorSettings';
import ClientSettings from './ClientSettings';
import SidebarLayout from '@/components/SidebarLayout';

const SettingsPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SidebarLayout activePath="/settings">
        <div className="p-6">Loading...</div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return (
      <SidebarLayout activePath="/settings">
        <div className="p-6">Please log in to view settings.</div>
      </SidebarLayout>
    );
  }

  if (user.role === 'counselor') {
    return <CounselorSettings />;
  }

  return <ClientSettings />;
};

export default SettingsPage;

