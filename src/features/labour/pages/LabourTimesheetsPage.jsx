import { FileText } from 'lucide-react';
import { MasterCrudPage } from '../../masters/pages/MasterCrudPage';
import { labourTimesheetsApi } from '../../../api/apiservice';

export function LabourTimesheetsPage() {
  return (
    <MasterCrudPage
      title="Labour Weekly Timesheets"
      subtitle="Track worker shift logs, weekly hours, and activity allocations"
      icon={FileText}
      apiService={labourTimesheetsApi}
      dataKey="timesheets"
      codeField="timesheet_code"
      nameField="worker_name"
      extraFields={[
        { name: 'period_start', label: 'Period Start', type: 'date' },
        { name: 'period_end', label: 'Period End', type: 'date' },
        { name: 'total_hours', label: 'Total Hours', type: 'number', placeholder: '48' }
      ]}
    />
  );
}

export default LabourTimesheetsPage;
