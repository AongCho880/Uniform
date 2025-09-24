// uniform-frontend/src/components/admin/DashboardOverview.tsx

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { adminApi } from '@/api/admin/adminApi';
import type { Institution } from '@/types/admin';
import {
  Building2,
  Users,
  User,
  FileText,
  Plus,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export function DashboardOverview() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ institutions: number; units: number; students: number; applications: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstitutions();
    (async () => {
      try {
        const s = await adminApi.getDashboard();
        setStats(s);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    })();
  }, []);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getInstitutions();
      setInstitutions(response.institutions);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstitution = () => {
    navigate({ to: '/admin/institutions', search: { create: '1' } });
  };

  const handleCreateAdmin = () => {
    navigate({ to: '/admin/admins', search: { create: '1' } });
  };

  const handleViewInstitutions = () => {
    navigate({ to: '/admin/institutions' });
  };

  const handleViewAdmins = () => {
    navigate({ to: '/admin/admins' });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome to the System Admin Dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? stats.units : '—'}</div>
            <p className="text-xs text-gray-500">System-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <User className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? stats.students : '—'}</div>
            <p className="text-xs text-gray-500">System-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? stats.applications : '—'}</div>
            <p className="text-xs text-gray-500">System-wide</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Activity tracking coming soon</h3>
              <p className="text-gray-500">This feature is not available in the current version.</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleCreateInstitution}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Institution
            </Button>
            <Button
              onClick={handleCreateAdmin}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Institution Admin
            </Button>
            <Button
              onClick={handleViewInstitutions}
              className="w-full justify-start"
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              View All Institutions
            </Button>
            <Button
              onClick={handleViewAdmins}
              className="w-full justify-start"
              variant="outline"
            >
              <Eye className="mr-2 h-4 w-4" />
              View All Admins
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
