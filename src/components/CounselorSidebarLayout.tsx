
import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Wallet, Settings, LogOut } from 'lucide-react';
import QuluubLogo from './QuluubLogo';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

interface CounselorSidebarLayoutProps {
  children: ReactNode;
  activePath: string;
}

const CounselorSidebarLayout: React.FC<CounselorSidebarLayoutProps> = ({ 
  children,
  activePath
}) => {
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/counselor-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/counselor-requests', label: 'Requests', icon: <Users size={20} /> },
    { path: '/counselor-wallet', label: 'Wallet', icon: <Wallet size={20} /> },
    { path: '/counselor-sessions', label: 'Sessions', icon: <Calendar size={20} /> },
    { path: '/counselor-settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    // Logic to log out
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-teal-600 text-white">
        <div className="p-6">
          <QuluubLogo variant="white" />
        </div>
        
        <div className="px-4 py-6">
          {/* User profile preview */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-medium">AB</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Ahay Musa B</p>
              <p className="text-xs opacity-70">counselor@quluub.com</p>
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
                    ? 'bg-white/20 text-white font-medium' 
                    : 'hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            
            <button 
              onClick={() => setShowLogoutDialog(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors w-full text-left hover:bg-white/10"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
        
        {/* Footer logo */}
        <div className="mt-auto p-6 pb-4 absolute bottom-0">
          <QuluubLogo size="sm" variant="white" withText={false} />
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 p-6">
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

export default CounselorSidebarLayout;
