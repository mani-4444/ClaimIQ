import { useMemo, useEffect } from "react";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { StatsCard } from "../../components/domain/StatsCard";
import { useClaimsStore } from "../../store/claimsStore";
import { formatCurrency } from "../../lib/utils";
import { FileText, TrendingUp, Clock, Shield } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  backgroundColor: "rgba(31,41,55,0.95)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  color: "#e5e7eb",
};

export function AnalyticsPage() {
  const { claims, fetchClaims } = useClaimsStore();

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const stats = useMemo(() => {
    const total = claims.length;
    const processed = claims.filter((c) => c.status === "processed").length;
    const totalCost = claims.reduce((s, c) => s + (c.cost_total ?? 0), 0);
    const fraudFlagged = claims.filter(
      (c) => (c.fraud_score ?? 0) > 0.5,
    ).length;
    return { total, processed, totalCost, fraudFlagged };
  }, [claims]);

  const pieData = useMemo(() => {
    const d = { pre_approved: 0, manual_review: 0, rejected: 0, pending: 0 };
    claims.forEach((c) => {
      if (c.decision && c.decision in d) d[c.decision as keyof typeof d]++;
      else d.pending++;
    });
    return [
      { name: "Pre-Approved", value: d.pre_approved, color: "#10b981" },
      { name: "Manual Review", value: d.manual_review, color: "#f59e0b" },
      { name: "Rejected", value: d.rejected, color: "#ef4444" },
      { name: "Pending", value: d.pending, color: "#6b7280" },
    ].filter((e) => e.value > 0);
  }, [claims]);

  const barData = useMemo(() => {
    const map: Record<
      string,
      { month: string; uploaded: number; processed: number; error: number }
    > = {};
    claims.forEach((c) => {
      const m = new Date(c.created_at).toLocaleString("en-US", {
        month: "short",
      });
      if (!map[m]) map[m] = { month: m, uploaded: 0, processed: 0, error: 0 };
      if (c.status === "processed") map[m].processed++;
      else if (c.status === "error") map[m].error++;
      else map[m].uploaded++;
    });
    return Object.values(map);
  }, [claims]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: "Analytics" }]} />
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Comprehensive overview of claims performance and trends.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Claims"
          value={stats.total}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Cost"
          value={formatCurrency(stats.totalCost)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatsCard
          title="Processed"
          value={stats.processed}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatsCard
          title="Fraud Flagged"
          value={stats.fraudFlagged}
          icon={<Shield className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Claims by Month</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#e5e7eb" }}
                  labelStyle={{ color: "#9ca3af" }}
                />
                <Legend />
                <Bar
                  dataKey="uploaded"
                  name="Uploaded"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="processed"
                  name="Processed"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="error"
                  name="Error"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>AI Decision Breakdown</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
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
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ color: "#e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
