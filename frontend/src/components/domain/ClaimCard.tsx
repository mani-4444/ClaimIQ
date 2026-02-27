import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import { FileText, ArrowRight } from 'lucide-react';
import type { Claim } from '../../types';

interface ClaimCardProps {
  claim: Claim;
}

export function ClaimCard({ claim }: ClaimCardProps) {
  return (
    <Card variant="default" padding="none" className="hover:shadow-md transition-shadow">
      <Link to={`/claims/${claim.id}`} className="block p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-mono font-medium text-gray-900">
                {claim.claimNumber}
              </p>
              <p className="text-xs text-gray-500 capitalize">{claim.type} Claim</p>
            </div>
          </div>
          <ClaimStatusBadge status={claim.status} />
        </div>

        <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
          {claim.title}
        </h4>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {claim.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{formatCurrency(claim.amount)}</span>
            <span>{formatDate(claim.submittedAt)}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
      </Link>
    </Card>
  );
}
