import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { 
  LogOut, 
  Users, 
  List, 
  DollarSign, 
  LayoutDashboard, 
  Briefcase, 
  CalendarClock, 
  MessageSquareWarning,
  Menu
} from 'lucide-react';

interface AdminSidebarLayoutProps {
  children: React.ReactNode;
  activePath: string;
}

const AdminSidebarLayout: React.FC<AdminSidebarLayoutProps> = ({ children, activePath }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Dashboard' },
    { path: '/admin/clients', icon: <Users className="h-5 w-5" />, label: 'Clients' },
    { path: '/admin/users', icon: <Briefcase className="h-5 w-5" />, label: 'Counselors' },
    { path: '/admin/sessions', icon: <CalendarClock className="h-5 w-5" />, label: 'Sessions' },
    { path: '/admin/transactions', icon: <DollarSign className="h-5 w-5" />, label: 'Transactions' },
    { path: '/admin/complaints', icon: <MessageSquareWarning className="h-5 w-5" />, label: 'Complaints' }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors text-white ${
              activePath === item.path
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}>
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center mb-4">
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
            <p className="text-xs text-white/70">{user?.email}</p>
          </div>
        </div>
        <Button onClick={handleLogout} variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
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
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-teal-600">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-teal-600 border-r border-teal-700">
        {sidebarContent}
      </aside>

      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-transparent">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminSidebarLayout;
