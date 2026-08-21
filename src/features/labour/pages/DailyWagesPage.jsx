import { Wallet } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { wagesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

/* Backend: LabourWagesController → ok('...','labour_wage_periods', [...])
   DB columns: period_code, period_start, period_end, gross_wages, total_additions, total_deductions, net_payable */
const extract = (res) => res?.data?.labour_wage_periods ?? res?.data?.data ?? [];

const STATUS = [
  { value: 'draft', label: 'Draft' }, { value: 'calculated', label: 'Calculated' },
  { value: 'submitted', label: 'Submitted' }, { value: 'approved', label: 'Approved' },
];

export function DailyWagesPage() {
  const { user } = useAuth();
  const isSupervisor = user?.role_code === 'supervisor' || String(user?.role_name || '').toLowerCase().includes('supervisor');
  const canSeeWageRates = !isSupervisor;

  const columns = [
    { key: 'period_code', label: 'Period Code', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
    { key: 'period_start', label: 'Start', className: 'w-24', format: 'date' },
    { key: 'period_end', label: 'End', className: 'w-24', format: 'date' },
    { key: 'project_name', label: 'Project', className: 'w-32' },
    { key: 'site_name', label: 'Site', className: 'w-28' },
    { key: 'contractor_name', label: 'Contractor', className: 'w-28' },
    ...(canSeeWageRates ? [
      { key: 'gross_wages', label: 'Gross', className: 'w-24 text-right', format: 'currency' },
      { key: 'total_deductions', label: 'Deductions', className: 'w-24 text-right', format: 'currency' },
      { key: 'net_payable', label: 'Net Payable', className: 'w-24 text-right', format: 'currency' },
    ] : []),
    { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
  ];

  return (
    <DocumentListPage
      title="Daily Wages"
      icon={Wallet}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Labour & Attendance' }, { label: 'Daily Wages' }]}
      api={wagesApi}
      extractList={extract}
      columns={columns}
      searchKeys={['period_code', 'project_name', 'site_name', 'contractor_name']}
      statusOptions={STATUS}
      entityName="Wage Period"
      permissionPrefix="wages"
    />
  );
}
