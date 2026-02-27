import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { ClaimStatusBadge } from '../../components/domain/ClaimStatusBadge';
import { ClaimTimeline } from '../../components/domain/ClaimTimeline';
import { RiskScoreGauge } from '../../components/domain/RiskScoreGauge';
import { ActivityFeed } from '../../components/domain/ActivityFeed';
import { DecisionPanel } from '../../components/domain/DecisionPanel';
import { MOCK_CLAIMS } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../lib/utils';
import { UI_PERMISSIONS } from '../../constants';
import {
  FileText,
  Download,
  ExternalLink,
  Calendar,
  DollarSign,
  User,
  Hash,
  AlertTriangle,
} from 'lucide-react';

export function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'policyholder';
  const permissions = UI_PERMISSIONS[role];

  const claim = MOCK_CLAIMS.find((c) => c.id === id);
  const [activeTab, setActiveTab] = useState('timeline');

  if (!claim) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title="Claim not found"
          description="This claim doesn't exist or has been removed."
          action={
            <Link to="/claims">
              <Button variant="primary">Back to Claims</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const tabs = [
    { id: 'timeline', label: 'Timeline', count: claim.timeline.length },
    { id: 'documents', label: 'Documents', count: claim.documents.length },
    { id: 'activity', label: 'Activity', count: claim.notes.length },
  ];

  const handleDecision = (decision: string, notes: string) => {
    console.log('Decision:', decision, 'Notes:', notes);
    // In a real app, this would call an API
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb
        items={[
          { label: 'Claims', href: '/claims' },
          { label: claim.claimNumber },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{claim.claimNumber}</h1>
            <ClaimStatusBadge status={claim.status} />
          </div>
          <p className="text-gray-600">{claim.title}</p>
        </div>
        {permissions.canApproveDeny && claim.status !== 'APPROVED' && claim.status !== 'DENIED' && claim.status !== 'CLOSED' && (
          <DecisionPanel claimNumber={claim.claimNumber} onDecision={handleDecision} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Claim Details</CardTitle>
            </CardHeader>
            <p className="text-sm text-gray-600 mb-4">{claim.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Policy</p>
                  <p className="text-sm font-medium text-gray-900">{claim.policyNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(claim.amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(claim.submittedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Policyholder</p>
                  <p className="text-sm font-medium text-gray-900">{claim.policyholderName}</p>
                </div>
              </div>
              {claim.assignedTo && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="text-sm font-medium text-gray-900">{claim.assignedTo}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs content */}
          <Card padding="none">
            <div className="px-6 pt-4">
              <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
            </div>

            <div className="p-6">
              {activeTab === 'timeline' && (
                <ClaimTimeline events={claim.timeline} />
              )}

              {activeTab === 'documents' && (
                <div>
                  {claim.documents.length === 0 ? (
                    <EmptyState
                      icon={<FileText className="h-10 w-10" />}
                      title="No documents uploaded"
                      description="No documents have been attached to this claim yet."
                    />
                  ) : (
                    <ul className="space-y-2">
                      {claim.documents.map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(doc.size / 1024).toFixed(0)} KB · {formatDate(doc.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              aria-label={`Preview ${doc.name}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              aria-label={`Download ${doc.name}`}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <ActivityFeed notes={claim.notes} />
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Score - only for adjusters/admins */}
          {permissions.canViewRiskScore && claim.riskScore !== undefined && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>AI Risk Assessment</CardTitle>
              </CardHeader>
              <RiskScoreGauge score={claim.riskScore} />
              <p className="text-xs text-gray-500 text-center mt-4">
                AI-powered fraud detection analysis based on claim patterns and historical data.
              </p>
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
                <span className="font-medium text-gray-900">{claim.policyNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-medium text-gray-900 capitalize">{claim.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Holder</span>
                <span className="font-medium text-gray-900">{claim.policyholderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Claim Value</span>
                <span className="font-medium text-gray-900">{formatCurrency(claim.amount)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
