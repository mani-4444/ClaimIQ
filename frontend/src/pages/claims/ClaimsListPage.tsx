import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useClaimsStore } from "../../store/claimsStore";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { CLAIM_STATUS_MAP, DECISION_MAP } from "../../constants";
import { formatCurrency, formatDate, cn } from "../../lib/utils";
import { UI_PERMISSIONS } from "../../constants";
import type { ClaimDecision } from "../../types";
import { Plus, FileText, List, LayoutGrid, Search } from "lucide-react";

export function ClaimsListPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "policyholder";
  const permissions = UI_PERMISSIONS[role];

  const { claims, loading, fetchClaims } = useClaimsStore();
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      if (
        search &&
        !claim.id.toLowerCase().includes(search.toLowerCase()) &&
        !(claim.user_description || "")
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        !claim.policy_number.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter && claim.status !== statusFilter) return false;
      return true;
    });
  }, [claims, search, statusFilter]);

  if (loading && claims.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: "Claims" }]} />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Motor Claims</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredClaims.length} claim
            {filteredClaims.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center border border-white/[0.08] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "table"
                  ? "bg-white/[0.08] text-gray-200"
                  : "text-gray-500 hover:text-gray-300",
              )}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-white/[0.08] text-gray-200"
                  : "text-gray-500 hover:text-gray-300",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {permissions.canCreateClaim && (
            <Link to="/claims/new">
              <Button icon={<Plus className="h-4 w-4" />}>New Claim</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Simple filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claims..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/[0.08] bg-dark-700/50 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["", "uploaded", "processing", "processed", "error"] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full border transition-colors",
                  statusFilter === s
                    ? "bg-primary-500/20 text-primary-300 border-primary-500/30"
                    : "bg-dark-700/50 text-gray-400 border-white/[0.06] hover:text-gray-300",
                )}
              >
                {s === "" ? "All" : CLAIM_STATUS_MAP[s]?.label || s}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Claims list */}
      {filteredClaims.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No claims found"
          description={
            claims.length === 0
              ? "You haven't filed any claims yet. Upload vehicle damage photos to get started."
              : "Try adjusting your filters."
          }
          action={
            permissions.canCreateClaim && claims.length === 0 ? (
              <Link to="/claims/new">
                <Button icon={<Plus className="h-4 w-4" />}>
                  File a New Claim
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClaims.map((claim) => {
            const statusInfo = CLAIM_STATUS_MAP[claim.status] || {
              label: claim.status,
              color: "text-gray-400",
              bgColor: "bg-gray-500/15",
            };
            const decisionInfo = claim.decision
              ? DECISION_MAP[claim.decision as ClaimDecision]
              : null;
            return (
              <Link key={claim.id} to={`/claims/${claim.id}`} className="block">
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
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-white/[0.06] bg-dark-700/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-400">
                    Claim ID
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">
                    Description
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">
                    Policy
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">
                    Decision
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">
                    Cost
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const statusInfo = CLAIM_STATUS_MAP[claim.status] || {
                    label: claim.status,
                    color: "text-gray-400",
                    bgColor: "bg-gray-500/15",
                  };
                  const decisionInfo = claim.decision
                    ? DECISION_MAP[claim.decision as ClaimDecision]
                    : null;
                  return (
                    <tr
                      key={claim.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/claims/${claim.id}`}
                          className="font-mono text-primary-400 hover:text-primary-300 font-medium transition-colors"
                        >
                          CLM-{claim.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-200 max-w-[200px] truncate">
                        {claim.user_description || "Motor damage claim"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {claim.policy_number}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {decisionInfo ? (
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
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-200 font-medium">
                        {claim.cost_total != null
                          ? formatCurrency(claim.cost_total)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDate(claim.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-dark-700/30">
            <p className="text-sm text-gray-500">
              Showing {filteredClaims.length} of {claims.length} claims
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
