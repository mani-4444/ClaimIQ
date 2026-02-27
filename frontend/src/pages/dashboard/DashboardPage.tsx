import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatsCard } from '../../components/domain/StatsCard';
import { ClaimCard } from '../../components/domain/ClaimCard';
import { MOCK_CLAIMS, MOCK_DASHBOARD_STATS, MOCK_CHART_DATA } from '../../data/mockData';
import { formatCurrency } from '../../lib/utils';
import { UI_PERMISSIONS } from '../../constants';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'policyholder';
  const permissions = UI_PERMISSIONS[role];
  const stats = MOCK_DASHBOARD_STATS;
  const recentClaims = MOCK_CLAIMS.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your claims today.
          </p>
        </div>
        {permissions.canCreateClaim && (
          <Link to="/claims/new">
            <Button icon={<Plus className="h-4 w-4" />}>New Claim</Button>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Claims"
          value={stats.totalClaims}
          trend={stats.trend.totalClaims}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingClaims}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatsCard
          title="Approved"
          value={stats.approvedClaims}
          trend={stats.trend.approvedClaims}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        {permissions.canViewRiskScore ? (
          <StatsCard
            title="Flagged"
            value={stats.flaggedClaims}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        ) : (
          <StatsCard
            title="Denied"
            value={stats.deniedClaims}
            trend={stats.trend.deniedClaims}
            icon={<XCircle className="h-5 w-5" />}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claims chart */}
        {permissions.canAccessAnalytics && (
          <Card padding="md" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Claims Overview</CardTitle>
              <Link
                to="/analytics"
                className="text-sm text-primary-400 hover:text-primary-300 font-medium inline-flex items-center gap-1 transition-colors"
              >
                View details <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(31,41,55,0.95)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      color: '#e5e7eb',
                    }}
                    itemStyle={{ color: '#e5e7eb' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Legend />
                  <Bar dataKey="submitted" name="Submitted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="denied" name="Denied" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Quick summary */}
        <Card padding="md" className={permissions.canAccessAnalytics ? '' : 'lg:col-span-3'}>
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-sm text-gray-400">Total Claims Value</span>
              <span className="text-sm font-semibold text-gray-200">
                {formatCurrency(stats.totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-sm text-gray-400">Avg. Processing Time</span>
              <span className="text-sm font-semibold text-gray-200">
                {stats.averageProcessingTime} days
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-sm text-gray-400">Approval Rate</span>
              <span className="text-sm font-semibold text-emerald-400">
                {Math.round((stats.approvedClaims / stats.totalClaims) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">Denial Rate</span>
              <span className="text-sm font-semibold text-red-400">
                {Math.round((stats.deniedClaims / stats.totalClaims) * 100)}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent claims */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Claims</h2>
          <Link
            to="/claims"
            className="text-sm text-primary-400 hover:text-primary-300 font-medium inline-flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentClaims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      </div>
    </div>
  );
}
