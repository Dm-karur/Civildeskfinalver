import { Calendar, Send } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { attendanceApi } from '../../../api/apiservice';

/* Backend: LabourAttendanceController → ok('...','labour_attendance_batches', [...])
   DB columns: attendance_date, shift_code, present_workers, absent_workers, total_workers */
const extract = (res) => res?.data?.labour_attendance_batches ?? res?.data?.data ?? [];

const STATUS = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' },
];

export function DailyAttendancePage() {
  return (
    <DocumentListPage
      title="Daily Attendance"
      icon={Calendar}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Labour & Attendance' }, { label: 'Daily Attendance' }]}
      api={attendanceApi}
      extractList={extract}
      columns={[
        { key: 'attendance_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'shift_code', label: 'Shift', className: 'w-20' },
        { key: 'project_name', label: 'Project', className: 'w-32' },
        { key: 'site_name', label: 'Site', className: 'w-32' },
        { key: 'present_workers', label: 'Present', className: 'w-20 text-right' },
        { key: 'absent_workers', label: 'Absent', className: 'w-20 text-right' },
        { key: 'total_workers', label: 'Total', className: 'w-20 text-right' },
        { key: 'total_regular_hours', label: 'Reg Hrs', className: 'w-20 text-right' },
        { key: 'total_overtime_hours', label: 'OT Hrs', className: 'w-20 text-right' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['project_name', 'site_name', 'shift_code']}
      statusOptions={STATUS}
      entityName="Attendance Batch"
      permissionPrefix="attendance"
      actions={[
        { name: 'submit', label: 'Submit', icon: <Send className="w-3.5 h-3.5 text-text-secondary hover:text-info" />, condition: (i) => String(i.status_name || '').toLowerCase().includes('draft') },
      ]}
    />
  );
}
