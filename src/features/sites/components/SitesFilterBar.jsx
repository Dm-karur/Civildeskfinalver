import { Filter, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';

export function SitesFilterBar({ searchQuery = '', onSearchChange, onAdd, canCreate = false, filters, onFilterChange, masters = {} }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <div className="w-full sm:w-[200px]">
          <SearchField
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <Select
          className="w-full sm:w-[130px]"
          options={[{ value: 'all', label: 'All Status' }, ...(masters.site_statuses ?? []).map((item) => ({ value: String(item.id), label: item.name || item.status_name }))]}
          value={filters.status_id}
          onChange={(value) => onFilterChange('status_id', value)}
        />

        <Select
          className="w-full sm:w-[130px]"
          options={[{ value: 'all', label: 'All Types' }, ...(masters.site_types ?? []).map((item) => ({ value: String(item.id), label: item.name || item.type_name }))]}
          value={filters.site_type_id}
          onChange={(value) => onFilterChange('site_type_id', value)}
        />
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto justify-end mt-2 lg:mt-0">
        <Button variant="outline" className="h-9 px-3 text-[13px]" leftIcon={<Filter className="w-3.5 h-3.5" />}>
          Filter
        </Button>
        {canCreate && (
          <Button
            variant="primary"
            className="h-9 px-3 text-[13px]"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onAdd}
          >
            Add Site
          </Button>
        )}
      </div>
    </div>
  );
}
