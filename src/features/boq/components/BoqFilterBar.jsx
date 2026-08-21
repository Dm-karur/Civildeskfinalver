import { Filter, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';

export function BoqFilterBar({ searchQuery = '', onSearchChange, onAdd, canCreate = false, filters, onFilterChange }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <div className="w-full sm:w-[200px]">
          <SearchField placeholder="Search BOQs..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} />
        </div>
        <Select
          className="w-full sm:w-[130px]"
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'draft', label: 'Draft' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
          value={filters.status}
          onChange={(value) => onFilterChange('status', value)}
        />
      </div>
      <div className="flex items-center gap-2 w-full lg:w-auto justify-end mt-2 lg:mt-0">
        {canCreate && (
          <Button variant="primary" className="h-9 px-3 text-[13px]" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={onAdd}>
            Add BOQ
          </Button>
        )}
      </div>
    </div>
  );
}
