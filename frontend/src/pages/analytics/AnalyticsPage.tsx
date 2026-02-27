import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatsCard } from '../../components/domain/StatsCard';
import { MOCK_DASHBOARD_STATS, MOCK_CHART_DATA } from '../../data/mockData';
import { formatCurrency } from '../../lib/utils';
import { FileText, TrendingUp, Clock, Shield } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const PIE_DATA = [
  { name: 'Auto', value: 45, color: '#818cf8' },
  { name: 'Home', value: 25, color: '#34d399' },
  { name: 'Health', value: 15, color: '#fbbf24' },
  { name: 'Property', value: 10, color: '#f87171' },
  { name: 'Liability', value: 5, color: '#a78bfa' },
];

const PROCESSING_DATA = [
  { month: 'Sep', avgDays: 5.2 },
  { month: 'Oct', avgDays: 4.8 },
  { month: 'Nov', avgDays: 4.5 },
  { month: 'Dec', avgDays: 5.0 },
  { month: 'Jan', avgDays: 4.2 },
  { month: 'Feb', avgDays: 3.8 },
];

export function AnalyticsPage() {
  const stats = MOCK_DASHBOARD_STATS;

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Analytics' }]} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Comprehensive overview of claims performance and trends.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Claims"
          value={stats.totalClaims}
          trend={stats.trend.totalClaims}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Value"
          value={formatCurrency(stats.totalAmount)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Avg. Processing"
          value={`${stats.averageProcessingTime} days`}
          trend={-8}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatsCard
          title="Fraud Flagged"
          value={stats.flaggedClaims}
          icon={<Shield className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Claims by month */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Claims by Month</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="submitted" name="Submitted" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="denied" name="Denied" fill="#f87171" radius={[4, 4, 0, 0]} />
                <Bar dataKey="flagged" name="Flagged" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Claims by type */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Claims by Type</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PIE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {PIE_DATA.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Processing time trend */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Average Processing Time (Days)</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PROCESSING_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avgDays"
                  name="Avg. Days"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ fill: '#4f46e5', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
