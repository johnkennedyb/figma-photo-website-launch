import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, DollarSign, CheckCircle, Clock, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminSidebarLayout from '@/components/AdminSidebarLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface DashboardOverview {
  userStats: {
    totalClients: number;
    totalCounselors: number;
  };
  sessionStats: {
    completed: number;
    ongoing: number;
    canceled: number;
  };
  revenueReport: {
    [currency: string]: number;
  };
  userEngagement: {
    mostActiveCounselors: {
      counselorId: string;
      name: string;
      sessionCount: number;
    }[];
  };
  complaints: {
    pending: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchOverview = async () => {
      if (!token) {
        setIsLoading(false);
        setError("Authentication token not found.");
        return;
      }
      
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(`${apiUrl}/api/admin/dashboard-overview`, {
          headers: {
            'x-auth-token': token,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Failed to fetch dashboard overview.');
        }

        const data: DashboardOverview = await response.json();
        setOverview(data);
      } catch (err) {
        setError((err as Error).message);
        toast({
          title: 'Error',
          description: 'Could not load dashboard data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, [token, toast]);

  if (isLoading) {
    return (
      <AdminSidebarLayout activePath="/admin/dashboard">
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminSidebarLayout>
    );
  }
  
  if (error) {
    return (
      <AdminSidebarLayout activePath="/admin/dashboard">
        <div className="text-red-500 p-4">Error: {error}</div>
      </AdminSidebarLayout>
    );
  }

  return (
    <AdminSidebarLayout activePath="/admin/dashboard">
      <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
        <h2 className="text-2xl font-bold mb-4">Platform Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.userStats.totalClients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Counselors</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.userStats.totalCounselors}</div>
            </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{overview?.complaints.pending}</div>
                  <Link to="/admin/complaints" className="text-xs text-muted-foreground hover:underline">View Details</Link>
              </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.sessionStats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ongoing Sessions</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.sessionStats.ongoing}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Canceled Sessions</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.sessionStats.canceled}</div>
            </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
              {overview?.revenueReport && Object.keys(overview.revenueReport).length > 0 ? (
                  Object.entries(overview.revenueReport).map(([currency, total]) => (
                  <div key={currency} className="text-xl font-bold">
                      {total.toLocaleString(undefined, { style: 'currency', currency: currency.toUpperCase() })}
                  </div>
                  ))
              ) : (
                  <div className="text-xl font-bold">$0.00</div>
              )}
              </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-4">User Engagement</h2>
        <Card>
          <CardHeader>
            <CardTitle>Most Active Counselors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {overview?.userEngagement.mostActiveCounselors.map((c) => (
                <li key={c.counselorId} className="flex justify-between items-center">
                  <span>{c.name}</span>
                  <span className="font-semibold">{c.sessionCount} sessions</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminSidebarLayout>
  );
};

export default AdminDashboard;
