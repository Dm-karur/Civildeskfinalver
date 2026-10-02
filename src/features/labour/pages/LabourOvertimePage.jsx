import { Clock } from 'lucide-react';
import { MasterCrudPage } from '../../masters/pages/MasterCrudPage';
import { labourOvertimeApi } from '../../../api/apiservice';

export function LabourOvertimePage() {
  return (
    <MasterCrudPage
      title="Labour Overtime Register"
      subtitle="Manage overtime hours logged for site workers and extra shift approvals"
      icon={Clock}
      apiService={labourOvertimeApi}
      dataKey="overtime_records"
      codeField="worker_name"
      nameField="ot_hours"
      extraFields={[
        { name: 'date', label: 'Date', type: 'date' },
        { name: 'ot_hours', label: 'OT Hours', type: 'number', placeholder: '2' },
        { name: 'rate_multiplier', label: 'Rate Multiplier', type: 'number', placeholder: '1.5' }
      ]}
    />
  );
}

export default LabourOvertimePage;
