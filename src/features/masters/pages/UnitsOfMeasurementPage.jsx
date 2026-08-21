import { Ruler } from 'lucide-react';
import { MasterCrudPage } from '../components/MasterCrudPage';
import { unitsApi } from '../../../api/apiservice';

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Masters' },
  { label: 'Units of Measurement' },
];

const columns = [
  { key: 'unit_name', label: 'Unit Name', className: 'w-40', cellClass: 'text-text-primary font-medium', render: (item) => item.unit_name || item.name || '—' },
  { key: 'unit_code', label: 'Code', className: 'w-20', cellClass: 'font-mono font-semibold text-text-primary', render: (item) => item.unit_code || item.code || '—' },
  { key: 'unit_symbol', label: 'Symbol', className: 'w-16', cellClass: 'text-text-primary', render: (item) => item.unit_symbol || item.symbol || '—' },
  { key: 'unit_type', label: 'Type', className: 'w-28', cellClass: 'text-text-secondary', render: (item) => item.unit_type || item.type_name || '—' },
  { key: 'description', label: 'Description', className: '', cellClass: 'text-text-secondary truncate' },
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
  { name: 'unit_name', label: 'Unit Name', required: true, placeholder: 'e.g. Square Meter' },
  { name: 'unit_code', label: 'Unit Code', required: true, placeholder: 'e.g. SQM' },
  { name: 'unit_symbol', label: 'Symbol', placeholder: 'e.g. m²' },
  { name: 'decimal_places', label: 'Decimal Places', type: 'number', min: '0', max: '6', step: '1', placeholder: '2' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

const emptyForm = { unit_name: '', unit_code: '', unit_symbol: '', decimal_places: '2', description: '' };

const extractList = (res) => {
  if (Array.isArray(res)) return res;
  return res?.data?.units ?? res?.data?.units_of_measurement ?? res?.units ?? res?.data?.data ?? [];
};

export function UnitsOfMeasurementPage() {
  return (
    <MasterCrudPage
      title="Units of Measurement"
      icon={Ruler}
      breadcrumbs={breadcrumbs}
      api={unitsApi}
      extractList={extractList}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
      formId="unit-form"
      entityName="Unit"
      permissionPrefix="master"
    />
  );
}
