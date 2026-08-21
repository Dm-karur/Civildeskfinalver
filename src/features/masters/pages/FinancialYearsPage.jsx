import { Calendar } from 'lucide-react';
import { MasterCrudPage } from '../components/MasterCrudPage';
import { financialYearsApi } from '../../../api/apiservice';

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Masters' },
  { label: 'Financial Years' },
];

const columns = [
  { key: 'year_label', label: 'Year', className: 'w-32', cellClass: 'text-text-primary font-medium', render: (item) => item.year_label || item.name || '—' },
  { key: 'start_date', label: 'Start Date', className: 'w-28', cellClass: 'text-text-secondary', render: (item) => item.start_date ? item.start_date.split(' ')[0] : '—' },
  { key: 'end_date', label: 'End Date', className: 'w-28', cellClass: 'text-text-secondary', render: (item) => item.end_date ? item.end_date.split(' ')[0] : '—' },
  {
    key: 'is_current',
    label: 'Current',
    className: 'w-20 text-center',
    render: (item) => item.is_current ? (
      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">Current</span>
    ) : null,
  },
  {
    key: 'is_active',
    label: 'Status',
    className: 'w-20 text-center',
    render: (item) => (
      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${item.is_active ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'}`}>
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

const formFields = [
  { name: 'year_label', label: 'Year Label', required: true, placeholder: 'e.g. FY 2026-27' },
  { name: 'year_code', label: 'Year Code', required: true, placeholder: 'e.g. 2026-27' },
  { name: 'start_date', label: 'Start Date', type: 'date', required: true },
  { name: 'end_date', label: 'End Date', type: 'date', required: true },
];

const emptyForm = { year_label: '', year_code: '', start_date: '', end_date: '' };

const extractList = (res) => {
  if (Array.isArray(res)) return res;
  return res?.data?.financial_years ?? res?.financial_years ?? res?.data?.data ?? [];
};

export function FinancialYearsPage() {
  return (
    <MasterCrudPage
      title="Financial Years"
      icon={Calendar}
      breadcrumbs={breadcrumbs}
      api={financialYearsApi}
      extractList={extractList}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
      formId="financial-year-form"
      entityName="Financial Year"
      permissionPrefix="financial_year"
    />
  );
}
