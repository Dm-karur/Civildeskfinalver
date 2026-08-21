import { useState, useEffect, useMemo } from 'react';
import {
  Calendar, CheckCircle2, XCircle, Clock, Users, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowLeft, ArrowRight,
  Sun, Moon, ShieldCheck, Check, AlertCircle, Sparkles, Send
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { attendanceApi, labourApi, projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const DEFAULT_ATTENDANCE_RECORDS = [
  {
    id: 1,
    worker_id: 6,
    worker_code: 'LAB-0001',
    worker_name: 'K. Selvam',
    category_name: 'Mason',
    contractor_name: 'Sri Murugan Labour Services',
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    site_name: 'Tower A Core - Level 2',
    attendance_date: '2026-08-21',
    shift_name: 'General Day Shift',
    shift_type: 'Day',
    in_time: '08:00 AM',
    out_time: '06:00 PM',
    status: 'Present',
    regular_hours: 8.0,
    overtime_hours: 1.0,
    base_wage: 950,
    ot_wage: 150,
    total_wage: 1100,
    notes: 'Completed column C1-C6 shuttering line alignment.'
  },
  {
    id: 2,
    worker_id: 5,
    worker_code: 'LAB-0002',
    worker_name: 'P. Ravi',
    category_name: 'General Helper',
    contractor_name: 'Sri Murugan Labour Services',
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    site_name: 'Tower A Core - Level 2',
    attendance_date: '2026-08-21',
    shift_name: 'General Day Shift',
    shift_type: 'Day',
    in_time: '08:05 AM',
    out_time: '06:00 PM',
    status: 'Present',
    regular_hours: 8.0,
    overtime_hours: 1.0,
    base_wage: 780,
    ot_wage: 120,
    total_wage: 900,
    notes: 'Assisted in cement mortar transport.'
  },
  {
    id: 3,
    worker_id: 4,
    worker_code: 'LAB-0003',
    worker_name: 'S. Kavitha',
    category_name: 'General Helper',
    contractor_name: 'Direct Company Roll',
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    site_name: 'Basement 1 & 2 Utility Zone',
    attendance_date: '2026-08-21',
    shift_name: 'General Day Shift',
    shift_type: 'Day',
    in_time: '08:00 AM',
    out_time: '05:00 PM',
    status: 'Present',
    regular_hours: 8.0,
    overtime_hours: 0.0,
    base_wage: 750,
    ot_wage: 0,
    total_wage: 750,
    notes: 'Basement sump dewatering watch.'
  },
  {
    id: 4,
    worker_id: 3,
    worker_code: 'LW-1613023321',
    worker_name: 'API Test Worker',
    category_name: 'Skilled Bar Bender',
    contractor_name: 'API Test Labour Contractor',
    project_id: 2,
    project_code: 'PRJ-2026-002',
    project_name: 'Highway Expansion Package 3',
    site_name: 'Ch. 16+300 Box Culvert Site',
    attendance_date: '2026-08-21',
    shift_name: 'Night Shift',
    shift_type: 'Night',
    in_time: '08:00 PM',
    out_time: '05:00 AM',
    status: 'Present',
    regular_hours: 8.0,
    overtime_hours: 1.0,
    base_wage: 1200,
    ot_wage: 200,
    total_wage: 1400,
    notes: 'Fabricated 16mm rebar bent-up bars.'
  },
  {
    id: 5,
    worker_id: 2,
    worker_code: 'LWRK_1665132475',
    worker_name: 'API Worker 1665132475',
    category_name: 'Carpenter',
    contractor_name: 'API Test Labour Contractor',
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    site_name: 'Tower A Core - Level 2',
    attendance_date: '2026-08-21',
    shift_name: 'General Day Shift',
    shift_type: 'Day',
    in_time: '—',
    out_time: '—',
    status: 'Absent',
    regular_hours: 0.0,
    overtime_hours: 0.0,
    base_wage: 1200,
    ot_wage: 0,
    total_wage: 0,
    notes: 'Sick leave reported to contractor.'
  },
];

export function DailyAttendancePage() {
  const { hasPermission } = useAuth();
  const [selectedDate, setSelectedDate] = useState('2026-08-21');
  const [records, setRecords] = useState(DEFAULT_ATTENDANCE_RECORDS);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  // Quick Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Quick status switcher
  const handleToggleStatus = (recordId, newStatus) => {
    setRecords(prev => prev.map(r => {
      if (r.id === recordId) {
        let regHrs = 8.0;
        let otHrs = r.overtime_hours;
        let totWage = r.base_wage + (otHrs * (r.base_wage / 8));

        if (newStatus === 'Absent') {
          regHrs = 0;
          otHrs = 0;
          totWage = 0;
        } else if (newStatus === 'Half-Day') {
          regHrs = 4.0;
          totWage = r.base_wage / 2;
        }

        return {
          ...r,
          status: newStatus,
          regular_hours: regHrs,
          overtime_hours: otHrs,
          total_wage: totWage,
        };
      }
      return r;
    }));
    toast.success('Attendance muster updated.');
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    setRecords(prev => prev.map(r => ({
      ...r,
      status: 'Present',
      regular_hours: 8.0,
      total_wage: r.base_wage + (r.overtime_hours * (r.base_wage / 8)),
    })));
    toast.success('All roster workers marked as Present.');
  };

  // Filtered List
  const filtered = useMemo(() => {
    return records.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (shiftFilter !== 'all' && r.shift_type !== shiftFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (r.worker_code || '').toLowerCase();
        const name = (r.worker_name || '').toLowerCase();
        const cat = (r.category_name || '').toLowerCase();
        const site = (r.site_name || '').toLowerCase();
        const cont = (r.contractor_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cat.includes(q) && !site.includes(q) && !cont.includes(q)) return false;
      }
      return true;
    });
  }, [records, selectedProjectId, statusFilter, shiftFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const presentCount = useMemo(() => records.filter(r => r.status === 'Present').length, [records]);
  const halfDayCount = useMemo(() => records.filter(r => r.status === 'Half-Day').length, [records]);
  const absentCount = useMemo(() => records.filter(r => r.status === 'Absent').length, [records]);
  const totalOtHrs = useMemo(() => records.reduce((acc, r) => acc + Number(r.overtime_hours || 0), 0), [records]);
  const totalDailyWages = useMemo(() => records.reduce((acc, r) => acc + Number(r.total_wage || 0), 0), [records]);

  const getStatusVariant = (status) => {
    if (status === 'Present') return 'success';
    if (status === 'Half-Day') return 'warning';
    if (status === 'Absent') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Daily Attendance' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Daily Site Labour Attendance & Muster Roll"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total On Muster"
            value={records.length}
            status="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            label="Present Today"
            value={`${presentCount} Workers`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Absent / On Leave"
            value={`${absentCount} Workers`}
            status={absentCount > 0 ? 'warning' : 'neutral'}
            icon={<XCircle className="w-4 h-4 text-red-500" />}
          />
          <KpiCard
            label="Daily Wages Earned"
            value={`₹${totalDailyWages.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Date Selector & Action Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Quick Date Picker */}
            <div className="flex items-center gap-1 bg-surface-muted/60 p-1 rounded-lg border border-border">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handlePrevDay} title="Previous Day">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-7 text-xs font-mono font-bold w-36 bg-transparent border-0"
              />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleNextDay} title="Next Day">
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={handleToday}>
                Today
              </Button>
            </div>

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={setSelectedProjectId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-32">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Present', label: 'Present' },
                  { value: 'Half-Day', label: 'Half-Day' },
                  { value: 'Absent', label: 'Absent' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search worker, gang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={handleMarkAllPresent}
              className="text-xs h-8 shadow-xs"
              title="Mark all workers on roll as present"
            >
              Mark All Present
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
                onItemsPerPageChange={() => {}}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 w-28">Worker Code</th>
                  <th className="px-3 py-2">Worker Name & Category</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Site Location</th>
                  <th className="px-3 py-2 text-center w-28">Timings (In / Out)</th>
                  <th className="px-3 py-2 text-center w-40">Muster Attendance</th>
                  <th className="px-3 py-2 text-right w-24">Payable Wage</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading attendance roll...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No attendance records found for selected date.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {r.worker_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.worker_name}>
                            {r.worker_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.category_name} • {r.contractor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <span className="text-[11px] text-text-secondary truncate block" title={r.site_name}>
                          {r.site_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[10px]">
                        {r.status === 'Absent' ? (
                          <span className="text-text-muted italic">—</span>
                        ) : (
                          <span className="text-text-primary">{r.in_time} - {r.out_time}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="inline-flex items-center gap-1 bg-surface-muted/60 p-0.5 rounded-lg border border-border">
                          <button
                            onClick={() => handleToggleStatus(r.id, 'Present')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                              r.status === 'Present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-text-secondary hover:text-emerald-600'
                            }`}
                            title="Mark Present (Full Day)"
                          >
                            P
                          </button>
                          <button
                            onClick={() => handleToggleStatus(r.id, 'Half-Day')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                              r.status === 'Half-Day'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-text-secondary hover:text-amber-600'
                            }`}
                            title="Mark Half Day (4 Hrs)"
                          >
                            HD
                          </button>
                          <button
                            onClick={() => handleToggleStatus(r.id, 'Absent')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                              r.status === 'Absent'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-text-secondary hover:text-red-600'
                            }`}
                            title="Mark Absent"
                          >
                            A
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[11px]">
                        {r.total_wage > 0 ? (
                          <span className="text-primary">₹{r.total_wage.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-text-muted">₹0</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Attendance 360"
                            onClick={() => setViewingRecord(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.worker_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.worker_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.category_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(r.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 bg-surface-muted/30 rounded border border-border/50 text-xs">
                <span className="text-text-muted font-mono">{r.in_time} - {r.out_time}</span>
                <span className="font-mono font-bold text-primary text-[11px]">₹{r.total_wage.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(r.id, 'Present')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold ${r.status === 'Present' ? 'bg-emerald-600 text-white' : 'bg-surface border border-border'}`}
                  >
                    P
                  </button>
                  <button
                    onClick={() => handleToggleStatus(r.id, 'Half-Day')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold ${r.status === 'Half-Day' ? 'bg-amber-500 text-white' : 'bg-surface border border-border'}`}
                  >
                    HD
                  </button>
                  <button
                    onClick={() => handleToggleStatus(r.id, 'Absent')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold ${r.status === 'Absent' ? 'bg-red-600 text-white' : 'bg-surface border border-border'}`}
                  >
                    A
                  </button>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingRecord(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
              </div>
            </div>
          ))}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* View Attendance 360 Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingRecord.worker_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingRecord.worker_code} • {viewingRecord.attendance_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingRecord(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Attendance Status</span> <span className="font-bold text-emerald-600 text-sm">{viewingRecord.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Daily Wage</span> <span className="font-bold text-primary font-mono text-sm">₹{viewingRecord.total_wage.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">In / Out Timings</span> <span className="font-mono text-text-primary">{viewingRecord.in_time} to {viewingRecord.out_time}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Regular / OT Hours</span> <span className="font-mono">{viewingRecord.regular_hours}h reg + {viewingRecord.overtime_hours}h OT</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Site</span> <span className="text-text-primary">{viewingRecord.site_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Labour Contractor</span> <span className="text-text-primary">{viewingRecord.contractor_name}</span></div>
              </div>

              {viewingRecord.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Daily Site Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingRecord(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
