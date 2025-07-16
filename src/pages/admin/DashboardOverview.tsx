import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface OverviewData {
  userStats: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    totalCounselors: number;
    activeCounselors: number;
    inactiveCounselors: number;
  };
  sessionStats: {
    completed: number;
    ongoing: number;
    canceled: number;
    averageDuration: number;
  };
  revenueReport: { [currency: string]: number };
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

const DashboardOverview: React.FC = () => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get('/admin/dashboard-overview');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to fetch dashboard overview.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (!data) {
    return <div>No data available.</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        {/* User Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.userStats.totalClients}</p>
            <p className="text-sm text-muted-foreground">{data.userStats.activeClients} Active</p>
            <p className="text-sm text-muted-foreground">{data.userStats.inactiveClients} Inactive</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Counselors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.userStats.totalCounselors}</p>
            <p className="text-sm text-muted-foreground">{data.userStats.activeCounselors} Active</p>
            <p className="text-sm text-muted-foreground">{data.userStats.inactiveCounselors} Inactive</p>
          </CardContent>
        </Card>

        {/* Revenue Report */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(data.revenueReport).map(([currency, total]) => (
              <p key={currency} className="text-2xl font-bold">{formatCurrency(total, currency)}</p>
            ))}
             {Object.keys(data.revenueReport).length === 0 && <p className="text-muted-foreground">No revenue yet.</p>}
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.sessionStats.completed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ongoing Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.sessionStats.ongoing}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg. Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.sessionStats.averageDuration.toFixed(0)} mins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.complaints.pending}</p>
          </CardContent>
        </Card>

        {/* Most Active Counselors */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Most Active Counselors</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.userEngagement.mostActiveCounselors.map(c => (
                <li key={c.counselorId} className="flex justify-between items-center">
                  <span>{c.name}</span>
                  <span className="font-semibold">{c.sessionCount} sessions</span>
                </li>
              ))}
              {data.userEngagement.mostActiveCounselors.length === 0 && <p className="text-muted-foreground">No completed sessions yet.</p>}
            </ul>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DashboardOverview;
