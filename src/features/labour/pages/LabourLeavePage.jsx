import { Calendar } from 'lucide-react';
import { MasterCrudPage } from '../../masters/pages/MasterCrudPage';
import { labourLeaveApi } from '../../../api/apiservice';

export function LabourLeavePage() {
  return (
    <MasterCrudPage
      title="Labour Leave Register"
      subtitle="Manage worker leave requests, approvals, and absence tracking"
      icon={Calendar}
      apiService={labourLeaveApi}
      dataKey="leave_records"
      codeField="worker_name"
      nameField="leave_type"
      extraFields={[
        { name: 'start_date', label: 'Start Date', type: 'date' },
        { name: 'end_date', label: 'End Date', type: 'date' },
        { name: 'days_count', label: 'Days Count', type: 'number', placeholder: '1' }
      ]}
    />
  );
}

export default LabourLeavePage;
