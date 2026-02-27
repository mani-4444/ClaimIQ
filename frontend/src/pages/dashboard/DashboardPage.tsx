import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useClaimsStore } from "../../store/claimsStore";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { StatsCard } from "../../components/domain/StatsCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { CLAIM_STATUS_MAP, DECISION_MAP } from "../../constants";
import { formatCurrency, formatDate } from "../../lib/utils";
import { UI_PERMISSIONS } from "../../constants";
import type { ClaimDecision } from "../../types";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "policyholder";
  const permissions = UI_PERMISSIONS[role];

  const { claims, loading, fetchClaims } = useClaimsStore();

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Compute stats from real claims
  const stats = useMemo(() => {
    const total = claims.length;
    const uploaded = claims.filter((c) => c.status === "uploaded").length;
    const processing = claims.filter((c) => c.status === "processing").length;
    const processed = claims.filter((c) => c.status === "processed").length;
    const preApproved = claims.filter(
      (c) => c.decision === "pre_approved",
    ).length;
    const manualReview = claims.filter(
      (c) => c.decision === "manual_review",
    ).length;
    const rejected = claims.filter((c) => c.decision === "rejected").length;
    const totalCost = claims.reduce((sum, c) => sum + (c.cost_total || 0), 0);
    return {
      total,
      uploaded,
      processing,
      processed,
      preApproved,
      manualReview,
      rejected,
      totalCost,
    };
  }, [claims]);

  const recentClaims = claims.slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: "Dashboard" }]} />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your motor claims.
          </p>
        </div>
        {permissions.canCreateClaim && (
          <Link to="/claims/new">
            <Button icon={<Plus className="h-4 w-4" />}>New Claim</Button>
          </Link>
        )}
      </div>

      {/* Stats grid */}
      {loading && claims.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Claims"
            value={stats.total}
            icon={<FileText className="h-5 w-5" />}
          />
          <StatsCard
            title="Pending Upload"
            value={stats.uploaded}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatsCard
            title="Pre-Approved"
            value={stats.preApproved}
            icon={<CheckCircle className="h-5 w-5" />}
          />
          <StatsCard
            title="Manual Review"
            value={stats.manualReview}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick summary */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Summary</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-sm text-gray-400">
                Total Estimated Cost
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                {formatCurrency(stats.totalCost)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-sm text-gray-400">Processed Claims</span>
              <span className="text-sm font-semibold text-gray-200">
                {stats.processed}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
              <span className="text-sm text-gray-400">Pre-Approval Rate</span>
              <span className="text-sm font-semibold text-emerald-400">
                {stats.total > 0
                  ? Math.round((stats.preApproved / stats.total) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-400">Rejection Rate</span>
              <span className="text-sm font-semibold text-red-400">
                {stats.total > 0
                  ? Math.round((stats.rejected / stats.total) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </Card>

        {/* Decision breakdown */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>AI Decisions</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              {
                label: "Pre-Approved",
                value: stats.preApproved,
                variant: "success" as const,
                color: "bg-emerald-500",
              },
              {
                label: "Manual Review",
                value: stats.manualReview,
                variant: "warning" as const,
                color: "bg-amber-500",
              },
              {
                label: "Rejected",
                value: stats.rejected,
                variant: "danger" as const,
                color: "bg-red-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-400">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-200">
                  {item.value}
                </span>
              </div>
            ))}
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
        {recentClaims.length === 0 ? (
          <Card padding="md">
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No claims yet</p>
              {permissions.canCreateClaim && (
                <Link to="/claims/new">
                  <Button
                    className="mt-3"
                    icon={<Plus className="h-4 w-4" />}
                    size="sm"
                  >
                    File Your First Claim
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentClaims.map((claim) => {
              const statusInfo = CLAIM_STATUS_MAP[claim.status] || {
                label: claim.status,
                color: "text-gray-400",
                bgColor: "bg-gray-500/15",
              };
              const decisionInfo = claim.decision
                ? DECISION_MAP[claim.decision as ClaimDecision]
                : null;
              return (
                <Link
                  key={claim.id}
                  to={`/claims/${claim.id}`}
                  className="block"
                >
                  <div className="glass-card rounded-xl p-4 hover:bg-white/[0.03] transition-colors h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-primary-400">
                        CLM-{claim.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 mb-2 line-clamp-2">
                      {claim.user_description || "Motor damage claim"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{claim.policy_number}</span>
                      <span>{formatDate(claim.created_at)}</span>
                    </div>
                    {claim.cost_total != null && (
                      <div className="mt-2 text-sm font-medium text-emerald-400">
                        {formatCurrency(claim.cost_total)}
                      </div>
                    )}
                    {decisionInfo && (
                      <div className="mt-2">
                        <Badge
                          variant={
                            decisionInfo.variant as
                              | "info"
                              | "success"
                              | "warning"
                              | "danger"
                              | "neutral"
                          }
                        >
                          {decisionInfo.label}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
