
import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Wallet, Settings, LogOut, MessageSquare, Menu } from 'lucide-react';
import QuluubLogo from './QuluubLogo';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useAuth } from '../context/AuthContext';

interface CounselorSidebarLayoutProps {
  children: ReactNode;
  activePath: string;
}

const CounselorSidebarLayout: React.FC<CounselorSidebarLayoutProps> = ({ 
  children,
  activePath
}) => {
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/counselor/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/counselor/requests', label: 'Requests', icon: <Users size={20} /> },
    { path: '/counselor/wallet', label: 'Wallet', icon: <Wallet size={20} /> },
    { path: '/counselor/sessions', label: 'Sessions', icon: <Calendar size={20} /> },
    { path: '/counselor/messages', label: 'Messages', icon: <MessageSquare size={20} /> },
    { path: '/counselor/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <QuluubLogo variant="white" />
      </div>
      <div className="px-4 py-6 flex-grow">
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {loading ? '' : user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'QC'}
            </span>
          </div>
          <div className="ml-3">
            {loading ? (
              <div className="space-y-1">
                <div className="h-4 bg-gray-400 rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-gray-400 rounded w-32 animate-pulse"></div>
              </div>
            ) : (
              <div>
                <p className="font-semibold">{user ? `${user.firstName} ${user.lastName}` : ''}</p>
                <p className="text-xs opacity-70">{user?.email || ''}</p>
              </div>
            )}
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
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
          {user && user.role === 'admin' && (
            <Link 
              to="/admin/dashboard"
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                (location.pathname.startsWith('/admin')) 
                  ? 'bg-white/20 text-white font-medium' 
                  : 'hover:bg-white/10'
              }`}
            >
              <LayoutDashboard size={20} />
              <span>Admin Dashboard</span>
            </Link>
          )}
          <button 
            onClick={() => {
              setIsSidebarOpen(false);
              setShowLogoutDialog(true);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-md transition-colors w-full text-left hover:bg-white/10"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </div>
      <div className="p-6 pb-4">
        <QuluubLogo size="sm" variant="white" withText={false} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            aria-hidden="true"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-teal-600 text-white">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-teal-600 text-white">
        {sidebarContent}
      </aside>

      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-transparent">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
      
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
