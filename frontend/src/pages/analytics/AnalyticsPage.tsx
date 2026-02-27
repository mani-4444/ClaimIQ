import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatsCard } from '../../components/domain/StatsCard';
import { MOCK_DASHBOARD_STATS, MOCK_CHART_DATA } from '../../data/mockData';
import { formatCurrency } from '../../lib/utils';
import { FileText, TrendingUp, Clock, Shield } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const PIE_DATA = [
  { name: 'Auto', value: 45, color: '#3b82f6' },
  { name: 'Home', value: 25, color: '#10b981' },
  { name: 'Health', value: 15, color: '#f59e0b' },
  { name: 'Property', value: 10, color: '#ef4444' },
  { name: 'Liability', value: 5, color: '#8b5cf6' },
];

const PROCESSING_DATA = [
  { month: 'Sep', avgDays: 5.2 },
  { month: 'Oct', avgDays: 4.8 },
  { month: 'Nov', avgDays: 4.5 },
  { month: 'Dec', avgDays: 5.0 },
  { month: 'Jan', avgDays: 4.2 },
  { month: 'Feb', avgDays: 3.8 },
];

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(31,41,55,0.95)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  color: '#e5e7eb',
};

export function AnalyticsPage() {
  const stats = MOCK_DASHBOARD_STATS;

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Analytics' }]} />
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Comprehensive overview of claims performance and trends.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Claims" value={stats.totalClaims} trend={stats.trend.totalClaims} icon={<FileText className="h-5 w-5" />} />
        <StatsCard title="Total Value" value={formatCurrency(stats.totalAmount)} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Avg. Processing" value={`${stats.averageProcessingTime} days`} trend={-8} icon={<Clock className="h-5 w-5" />} />
        <StatsCard title="Fraud Flagged" value={stats.flaggedClaims} icon={<Shield className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader><CardTitle>Claims by Month</CardTitle></CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af' }} />
                <Legend />
                <Bar dataKey="submitted" name="Submitted" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="denied" name="Denied" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged" name="Flagged" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>Claims by Type</CardTitle></CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {PIE_DATA.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <CardHeader><CardTitle>Average Processing Time (Days)</CardTitle></CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PROCESSING_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" domain={[0, 'auto']} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#e5e7eb' }} labelStyle={{ color: '#9ca3af' }} />
                <Line type="monotone" dataKey="avgDays" name="Avg. Days" stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#1e293b', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
