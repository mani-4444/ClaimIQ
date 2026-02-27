import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useClaimsStore } from "../../store/claimsStore";
import { Breadcrumb } from "../../components/ui/Breadcrumb";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { RiskScoreGauge } from "../../components/domain/RiskScoreGauge";
import { CLAIM_STATUS_MAP, DECISION_MAP, SEVERITY_MAP } from "../../constants";
import { formatCurrency, formatDate } from "../../lib/utils";
import { apiDownloadReport } from "../../lib/api";
import type { ClaimDecision } from "../../types";
import {
  Download,
  Calendar,
  DollarSign,
  Hash,
  AlertTriangle,
  Zap,
  MapPin,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    current: claim,
    loading,
    error,
    fetchClaim,
  } = useClaimsStore();
  const [activeTab, setActiveTab] = useState<"photos" | "damage" | "costs">(
    "photos",
  );

  useEffect(() => {
    if (id) fetchClaim(id);
  }, [id, fetchClaim]);

  useEffect(() => {
    if (!id || !claim || claim.status !== "processing") return;

    const interval = setInterval(() => {
      fetchClaim(id);
    }, 2500);

    return () => clearInterval(interval);
  }, [id, claim?.status, fetchClaim]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!claim && !loading) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title="Claim not found"
          description={error || "This claim doesn't exist or has been removed."}
          action={
            <Link to="/claims">
              <Button variant="primary">Back to Claims</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const statusInfo = CLAIM_STATUS_MAP[claim.status] || {
    label: claim.status,
    color: "text-gray-400",
    bgColor: "bg-gray-500/15",
  };
  const decisionInfo = claim.decision
    ? DECISION_MAP[claim.decision as ClaimDecision]
    : null;

  const handleDownloadReport = async () => {
    if (!id) return;
    try {
      const blob = await apiDownloadReport(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ClaimIQ_Report_${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: "Claims", href: "/claims" },
          { label: claim.id.slice(0, 8) },
        ]}
      />

      {/* Processing error banner */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white font-mono">
              CLM-{claim.id.slice(0, 8).toUpperCase()}
            </h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}
            >
              {statusInfo.label}
            </span>
            {decisionInfo && (
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
            )}
          </div>
          <p className="text-gray-400 text-sm">
            {claim.user_description || "Motor vehicle damage claim"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {claim.status === "processed" && (
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              icon={<Download className="h-4 w-4" />}
            >
              Download Report
            </Button>
          )}
        </div>
      </div>

      {/* Processing indicator */}
      {claim.status === "processing" && (
        <Card padding="md" className="border-primary-500/30 bg-primary-500/5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-primary-400 animate-spin" />
            <div>
              <p className="text-sm font-medium text-primary-300">
                AI Analysis in Progress
              </p>
              <p className="text-xs text-gray-500">
                Detecting damage zones, estimating costs, and checking for
                fraud...
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Info */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Claim Details</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Policy</p>
                  <p className="text-sm font-medium text-gray-200">
                    {claim.policy_number}
                  </p>
                </div>
              </div>
              {claim.cost_total != null && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Estimated Cost</p>
                    <p className="text-sm font-medium text-emerald-400">
                      {formatCurrency(claim.cost_total)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-sm font-medium text-gray-200">
                    {formatDate(claim.created_at)}
                  </p>
                </div>
              </div>
              {claim.processed_at && (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Processed</p>
                    <p className="text-sm font-medium text-gray-200">
                      {formatDate(claim.processed_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs: Photos / Damage / Costs */}
          <Card padding="none">
            <div className="flex border-b border-white/[0.06]">
              {[
                {
                  key: "photos" as const,
                  label: "Photos",
                  count: claim.image_urls.length,
                },
                {
                  key: "damage" as const,
                  label: "Damage Zones",
                  count: claim.damage_zones?.length || 0,
                },
                {
                  key: "costs" as const,
                  label: "Cost Breakdown",
                  count: claim.cost_breakdown?.length || 0,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? "text-primary-400 border-primary-400"
                      : "text-gray-500 border-transparent hover:text-gray-300"
                  }`}
                >
                  {tab.label}{" "}
                  {tab.count > 0 && (
                    <span className="text-xs opacity-60">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Photos tab */}
              {activeTab === "photos" && (
                <div>
                  {claim.image_urls.length === 0 ? (
                    <EmptyState
                      icon={<ImageIcon className="h-10 w-10" />}
                      title="No photos uploaded"
                    />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {claim.image_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-video rounded-lg overflow-hidden border border-white/[0.06] hover:border-primary-500/40 transition-colors"
                        >
                          <img
                            src={url}
                            alt={`Damage ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Damage zones tab */}
              {activeTab === "damage" && (
                <div>
                  {!claim.damage_zones || claim.damage_zones.length === 0 ? (
                    <EmptyState
                      icon={<MapPin className="h-10 w-10" />}
                      title="No damage detected"
                      description={
                        claim.status === "uploaded"
                          ? "Run AI Analysis to detect damage zones."
                          : undefined
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {claim.damage_zones.map((zone, i) => {
                        const sev = SEVERITY_MAP[zone.severity] || {
                          label: zone.severity,
                          color: "text-gray-400",
                        };
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg border border-white/[0.04]"
                          >
                            <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5 text-primary-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-200">
                                  {zone.zone}
                                </p>
                                <p className={`text-xs ${sev.color}`}>
                                  {sev.label} damage
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-200">
                                {Math.round(zone.confidence * 100)}%
                              </p>
                              <p className="text-xs text-gray-500">
                                confidence
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Cost breakdown tab */}
              {activeTab === "costs" && (
                <div>
                  {!claim.cost_breakdown ||
                  claim.cost_breakdown.length === 0 ? (
                    <EmptyState
                      icon={<DollarSign className="h-10 w-10" />}
                      title="No cost estimate"
                      description={
                        claim.status === "uploaded"
                          ? "Run AI Analysis to get cost estimates."
                          : undefined
                      }
                    />
                  ) : (
                    <div className="space-y-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left py-2 text-gray-400 font-medium">
                              Zone
                            </th>
                            <th className="text-left py-2 text-gray-400 font-medium">
                              Severity
                            </th>
                            <th className="text-right py-2 text-gray-400 font-medium">
                              Parts
                            </th>
                            <th className="text-right py-2 text-gray-400 font-medium">
                              Labor
                            </th>
                            <th className="text-right py-2 text-gray-400 font-medium">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {claim.cost_breakdown.map((item, i) => (
                            <tr
                              key={i}
                              className="border-b border-white/[0.04]"
                            >
                              <td className="py-2 text-gray-200">
                                {item.zone}
                              </td>
                              <td className="py-2 capitalize text-gray-400">
                                {item.severity}
                              </td>
                              <td className="py-2 text-right text-gray-200">
                                {formatCurrency(item.base_cost)}
                              </td>
                              <td className="py-2 text-right text-gray-200">
                                {formatCurrency(item.labor_cost)}
                              </td>
                              <td className="py-2 text-right font-medium text-gray-200">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td
                              colSpan={4}
                              className="py-3 text-right font-semibold text-gray-300"
                            >
                              Total Estimate
                            </td>
                            <td className="py-3 text-right font-bold text-emerald-400">
                              {formatCurrency(claim.cost_total || 0)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* AI Explanation */}
          {claim.ai_explanation && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>AI Damage Explanation</CardTitle>
              </CardHeader>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {claim.ai_explanation}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Decision Card */}
          {decisionInfo && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>AI Decision</CardTitle>
              </CardHeader>
              <div className="text-center py-2">
                <Badge
                  variant={
                    decisionInfo.variant as
                      | "info"
                      | "success"
                      | "warning"
                      | "danger"
                      | "neutral"
                  }
                  className="text-base px-4 py-1.5"
                >
                  {decisionInfo.label}
                </Badge>
                {claim.decision_confidence != null && (
                  <p className="mt-2 text-sm text-gray-400">
                    Confidence:{" "}
                    <span className="text-gray-200 font-medium">
                      {Math.round(claim.decision_confidence * 100)}%
                    </span>
                  </p>
                )}
                {claim.risk_level && (
                  <p className="mt-1 text-sm text-gray-400">
                    Risk:{" "}
                    <span
                      className={`font-medium capitalize ${
                        claim.risk_level === "low"
                          ? "text-emerald-400"
                          : claim.risk_level === "medium"
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {claim.risk_level}
                    </span>
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Fraud Score */}
          {claim.fraud_score != null && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Fraud Risk Score</CardTitle>
              </CardHeader>
              <RiskScoreGauge score={claim.fraud_score} />
              {claim.fraud_flags && claim.fraud_flags.length > 0 && (
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-gray-500 font-medium">
                    Fraud Flags
                  </p>
                  <ul className="space-y-1">
                    {claim.fraud_flags.map((flag, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-1.5 text-xs text-amber-400"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Policy Summary */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Policy Summary</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Policy #</span>
                <span className="font-medium text-gray-200">
                  {claim.policy_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-200">Motor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              {claim.cost_total != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Est. Cost</span>
                  <span className="font-medium text-emerald-400">
                    {formatCurrency(claim.cost_total)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
