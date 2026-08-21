import { Users } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { labourApi } from '../../../api/apiservice';

/* Backend key: LabourAssignmentsController → ok('...','assignments', [...]) 
   BUT the actual response wraps under data.assignments via the LabourApiController base */
const extract = (res) => res?.data?.assignments ?? res?.data?.data ?? [];

export function LabourDeploymentPage() {
  return (
    <DocumentListPage
      title="Labour Deployment"
      icon={Users}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Labour & Attendance' }, { label: 'Labour Deployment' }]}
      api={labourApi.assignments}
      extractList={extract}
      columns={[
        { key: 'worker_name', label: 'Worker', className: 'w-36', cellClass: 'font-medium text-text-primary' },
        { key: 'category_name', label: 'Category', className: 'w-28' },
        { key: 'project_name', label: 'Project', className: 'w-36' },
        { key: 'site_name', label: 'Site', className: 'w-32' },
        { key: 'shift_name', label: 'Shift', className: 'w-20' },
        { key: 'assigned_from', label: 'From', className: 'w-24', format: 'date' },
        { key: 'assigned_until', label: 'Until', className: 'w-24', format: 'date' },
        { key: 'agreed_wage_rate', label: 'Rate', className: 'w-20 text-right', format: 'currency' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['worker_name', 'project_name', 'site_name', 'category_name']}
      entityName="Deployment"
      permissionPrefix="labour"
    />
  );
}
