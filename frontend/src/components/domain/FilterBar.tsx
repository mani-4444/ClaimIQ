import { useState } from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { CLAIM_TYPES } from '../../constants';
import type { ClaimStatus } from '../../types';

interface FilterBarProps {
  onFilterChange: (filters: FilterValues) => void;
  className?: string;
}

export interface FilterValues {
  search: string;
  status: ClaimStatus | '';
  type: string;
  dateFrom: string;
  dateTo: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'INFO_NEEDED', label: 'Info Needed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'FLAGGED', label: 'Flagged' },
  { value: 'CLOSED', label: 'Closed' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  ...CLAIM_TYPES.map((t) => ({ value: t.value, label: t.label })),
];

export function FilterBar({ onFilterChange, className }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterValues, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const cleared: FilterValues = {
      search: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: '',
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters = filters.status || filters.type || filters.dateFrom || filters.dateTo;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="search"
            placeholder="Search claims..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-white/[0.08] rounded-lg bg-dark-700/50 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
          />
        </div>

        {/* Quick Filters (visible on md+) */}
        <div className="hidden md:flex items-center gap-3">
          <Select
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-40"
          />
          <Select
            options={TYPE_OPTIONS}
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-36"
          />
        </div>

        {/* Advanced filters toggle */}
        <Button
          variant={showAdvanced ? 'primary' : 'outline'}
          size="sm"
          icon={<SlidersHorizontal className="h-4 w-4" />}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="md:hidden">Filters</span>
          <span className="hidden md:inline">Advanced</span>
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="h-4 w-4" />}
            onClick={clearFilters}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="glass-card rounded-xl p-4 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mobile: show status and type here too */}
            <div className="md:hidden">
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
              />
            </div>
            <div className="md:hidden">
              <Select
                label="Type"
                options={TYPE_OPTIONS}
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
              />
            </div>
            <Input
              label="From Date"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
            />
            <Input
              label="To Date"
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
