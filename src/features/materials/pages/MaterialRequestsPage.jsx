import { Send } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { materialManagementApi } from '../../../api/apiservice';

/* Backend: MaterialDocumentsController → ok('...','material_requests', [...]) 
   DB: material_requests → request_no, request_date, required_by_date, purpose */
const extract = (res) => res?.data?.material_requests ?? res?.data?.data ?? [];

const STATUS = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' },
];

export function MaterialRequestsPage() {
  return (
    <DocumentListPage
      title="Material Requests"
      icon={Send}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials & Inventory' }, { label: 'Material Requests' }]}
      api={materialManagementApi.requests}
      extractList={extract}
      columns={[
        { key: 'request_no', label: 'Request No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'request_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'required_by_date', label: 'Required By', className: 'w-24', format: 'date' },
        { key: 'project_name', label: 'Project', className: 'w-32' },
        { key: 'site_name', label: 'Site', className: 'w-28' },
        { key: 'purpose', label: 'Purpose', className: 'w-36' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['request_no', 'project_name', 'site_name', 'purpose']}
      statusOptions={STATUS}
      entityName="Material Request"
      permissionPrefix="materials"
    />
  );
}
