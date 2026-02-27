import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ClaimCard } from '../../components/domain/ClaimCard';
import { ClaimStatusBadge } from '../../components/domain/ClaimStatusBadge';
import { FilterBar, type FilterValues } from '../../components/domain/FilterBar';
import { MOCK_CLAIMS } from '../../data/mockData';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { UI_PERMISSIONS } from '../../constants';
import { Plus, FileText, List, LayoutGrid } from 'lucide-react';

export function ClaimsListPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'policyholder';
  const permissions = UI_PERMISSIONS[role];

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
  });

  const filteredClaims = useMemo(() => {
    return MOCK_CLAIMS.filter((claim) => {
      if (
        filters.search &&
        !claim.claimNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
        !claim.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !claim.policyholderName.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.status && claim.status !== filters.status) return false;
      if (filters.type && claim.type !== filters.type) return false;
      if (filters.dateFrom && new Date(claim.submittedAt) < new Date(filters.dateFrom))
        return false;
      if (filters.dateTo && new Date(claim.submittedAt) > new Date(filters.dateTo))
        return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Claims' }]} />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claims</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredClaims.length} claim{filteredClaims.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600',
              )}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600',
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

      {/* Filters */}
      <FilterBar onFilterChange={setFilters} />

      {/* Claims list */}
      {filteredClaims.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No claims found"
          description="Try adjusting your filters or create a new claim."
          action={
            permissions.canCreateClaim ? (
              <Link to="/claims/new">
                <Button icon={<Plus className="h-4 w-4" />}>File a New Claim</Button>
              </Link>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClaims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Claim #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Policyholder</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/claims/${claim.id}`}
                        className="font-mono text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {claim.claimNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900 max-w-[200px] truncate">
                      {claim.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{claim.type}</td>
                    <td className="px-4 py-3">
                      <ClaimStatusBadge status={claim.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatCurrency(claim.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(claim.submittedAt)}</td>
                    <td className="px-4 py-3 text-gray-500">{claim.policyholderName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {filteredClaims.length} of {MOCK_CLAIMS.length} claims
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
