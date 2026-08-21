import { Shield, Clock } from 'lucide-react';
import { ReportPage } from '../../shared/components/ReportPage';
import { systemAdminApi } from '../../../api/apiservice';

export function AuditLogsPage() {
  return (
    <ReportPage
      title="Audit Logs"
      icon={Shield}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Administration' }, { label: 'Audit Logs' }]}
      fetchData={systemAdminApi.auditLogs}
      columns={[
        { key: 'created_at', label: 'Timestamp', className: 'w-36', format: 'date' },
        { key: 'user_name', label: 'User', className: 'w-28', cellClass: 'font-medium text-text-primary' },
        { key: 'action', label: 'Action', className: 'w-20' },
        { key: 'entity_type', label: 'Entity', className: 'w-28' },
        { key: 'entity_id', label: 'ID', className: 'w-16' },
        { key: 'description', label: 'Description', className: 'w-64' },
        { key: 'ip_address', label: 'IP', className: 'w-28' },
      ]}
      searchKeys={['user_name', 'action', 'entity_type', 'description']}
    />
  );
}
