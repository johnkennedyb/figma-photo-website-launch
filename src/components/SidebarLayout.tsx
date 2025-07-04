
import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings, LogOut } from 'lucide-react';
import QuluubLogo from './QuluubLogo';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';

interface SidebarLayoutProps {
  children: ReactNode;
  activePath: string;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ 
  children,
  activePath
}) => {
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const location = useLocation();
  const { userProfile, signOut } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/counselors', label: 'Counsellors', icon: <Users size={20} /> },
    { path: '/sessions', label: 'Sessions', icon: <Calendar size={20} /> },
    { path: '/chat', label: 'Messages', icon: <MessageSquare size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground">
        <div className="p-6">
          <QuluubLogo variant="white" />
        </div>
        
        <div className="px-4 py-6">
          {/* User profile preview */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sidebar-accent-foreground text-sm">
                {userProfile?.first_name?.[0]?.toUpperCase()}{userProfile?.last_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {userProfile?.first_name} {userProfile?.last_name}
              </p>
              <p className="text-xs opacity-70">{userProfile?.email}</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  (activePath === item.path || location.pathname.startsWith(item.path)) 
                    ? 'bg-sidebar-accent text-white font-medium' 
                    : 'hover:bg-sidebar-accent/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            
            <button 
              onClick={() => setShowLogoutDialog(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors w-full text-left hover:bg-sidebar-accent/50"
            >
              <LogOut size={20} />
              <span>Log Out</span>
            </button>
          </nav>
        </div>
        
        {/* Footer logo */}
        <div className="mt-auto p-6 pb-4 absolute bottom-0">
          <QuluubLogo size="sm" variant="white" withText={false} />
        </div>
      </aside>
      
      {/* Main content */}
      <main className="w-full flex-1 ">
        {children}
      </main>
      
      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SidebarLayout;
