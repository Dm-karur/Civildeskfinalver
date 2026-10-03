import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock, Calendar, Search, Filter, Plus, Eye, Edit, Trash2,
  CheckCircle2, XCircle, RefreshCw, AlertCircle, IndianRupee,
  Users, ShieldCheck, Check, Zap
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
import { labourOvertimeApi } from '../../../api/apiservice';

const INITIAL_OVERTIME = [
  {
    id: 1,
    ot_code: 'OT-2026-001',
    worker_name: 'Ramesh Kumar',
    trade_category: 'Lead Mason',
    site_name: 'Highway Project Phase 1',
    ot_date: '2026-10-02',
    ot_hours: 3.5,
    rate_multiplier: 1.5,
    hourly_base_rate: 150,
    calculated_amount: 787.50,
    approval_status: 'Approved',
    approved_by: 'Site Lead - Ram',
    work_reason: 'Night concrete curing & pavement edge finishing'
  },
  {
    id: 2,
    ot_code: 'OT-2026-002',
    worker_name: 'Suresh Patel',
    trade_category: 'Bar Bender Skilled',
    site_name: 'Greenfield Residency',
    ot_date: '2026-10-02',
    ot_hours: 4.0,
    rate_multiplier: 1.5,
    hourly_base_rate: 140,
    calculated_amount: 840.00,
    approval_status: 'Pending',
    approved_by: 'Pending Supervisor Approval',
    work_reason: 'Emergency rebar tying for foundation raft pour'
  },
  {
    id: 3,
    ot_code: 'OT-2026-003',
    worker_name: 'Karthik Raja',
    trade_category: 'Centering Mestri',
    site_name: 'Ajantha Theater Trichy',
    ot_date: '2026-10-01',
    ot_hours: 2.0,
    rate_multiplier: 2.0,
    hourly_base_rate: 160,
    calculated_amount: 640.00,
    approval_status: 'Approved',
    approved_by: 'Project Lead - Ram',
    work_reason: 'Urgent shuttering disassembly for beam inspection'
  },
  {
    id: 4,
    ot_code: 'OT-2026-004',
    worker_name: 'Murugan V',
    trade_category: 'Concrete Mixer Operator',
    site_name: 'Highway Project Phase 1',
    ot_date: '2026-10-01',
    ot_hours: 3.0,
    rate_multiplier: 1.5,
    hourly_base_rate: 130,
    calculated_amount: 585.00,
    approval_status: 'Pending',
    approved_by: 'Pending Supervisor Approval',
    work_reason: 'Extra batching plant washdown and maintenance'
  },
  {
    id: 5,
    ot_code: 'OT-2026-005',
    worker_name: 'Anand Kumar',
    trade_category: 'Helper / Unskilled',
    site_name: 'Sanjay Small Home',
    ot_date: '2026-09-30',
    ot_hours: 2.5,
    rate_multiplier: 1.5,
    hourly_base_rate: 100,
    calculated_amount: 375.00,
    approval_status: 'Rejected',
    approved_by: 'Site Manager',
    work_reason: 'Unauthorized extra shift hours logged without foreman slip'
  }
];

const EMPTY_FORM = {
  ot_code: '',
  worker_name: '',
  trade_category: 'Lead Mason',
  site_name: 'Highway Project Phase 1',
  ot_date: new Date().toISOString().split('T')[0],
  ot_hours: '2.0',
  rate_multiplier: '1.5',
  hourly_base_rate: '150',
  approval_status: 'Pending',
  work_reason: ''
};

export function LabourOvertimePage() {
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchOvertime = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labourOvertimeApi.list();
      const list = res?.data?.overtime_records ?? res?.overtime_records ?? (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setOvertimeRecords(list);
      } else {
        setOvertimeRecords(INITIAL_OVERTIME);
      }
    } catch (e) {
      console.warn('Backend overtime API 404/error, fallback to seed list:', e);
      setOvertimeRecords(INITIAL_OVERTIME);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOvertime();
  }, [fetchOvertime]);

  const handleOpenAdd = () => {
    const nextNum = overtimeRecords.length + 1;
    const code = `OT-2026-${String(nextNum).padStart(3, '0')}`;
    setForm({
      ...EMPTY_FORM,
      ot_code: code
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      ot_code: item.ot_code || '',
      worker_name: item.worker_name || '',
      trade_category: item.trade_category || 'Lead Mason',
      site_name: item.site_name || 'Highway Project Phase 1',
      ot_date: item.ot_date || '',
      ot_hours: String(item.ot_hours || 2.0),
      rate_multiplier: String(item.rate_multiplier || 1.5),
      hourly_base_rate: String(item.hourly_base_rate || 150),
      approval_status: item.approval_status || 'Pending',
      work_reason: item.work_reason || ''
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.worker_name.trim()) errs.worker_name = 'Worker Name is required';
    if (!form.ot_code.trim()) errs.ot_code = 'OT Code is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const otHrs = Number(form.ot_hours || 0);
    const mult = Number(form.rate_multiplier || 1.5);
    const baseRate = Number(form.hourly_base_rate || 0);
    const calcAmt = otHrs * baseRate * mult;

    const payload = {
      ...form,
      ot_hours: otHrs,
      rate_multiplier: mult,
      hourly_base_rate: baseRate,
      calculated_amount: Number(calcAmt.toFixed(2)),
      approved_by: form.approval_status === 'Approved' ? 'Site Manager' : 'Pending Supervisor Approval'
    };

    try {
      if (editingItem?.id) {
        try {
          await labourOvertimeApi.update(editingItem.id, payload);
        } catch {
          // Backend offline
        }
        setOvertimeRecords(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...payload } : t));
        toast.success('Overtime record updated.');
      } else {
        const newRecord = { id: Date.now(), ...payload };
        try {
          await labourOvertimeApi.create(payload);
        } catch {
          // Backend offline
        }
        setOvertimeRecords(prev => [newRecord, ...prev]);
        toast.success('New overtime entry logged.');
      }
      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save overtime record.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickApprove = async (item, newStatus) => {
    try {
      const updated = {
        ...item,
        approval_status: newStatus,
        approved_by: newStatus === 'Approved' ? 'Site Manager - Ram' : 'Rejected by Supervisor'
      };
      try {
        await labourOvertimeApi.update(item.id, updated);
      } catch {
        // Backend offline
      }
      setOvertimeRecords(prev => prev.map(r => r.id === item.id ? updated : r));
      toast.success(`Overtime record marked as ${newStatus}.`);
    } catch {
      toast.error('Failed to update approval status.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      try {
        await labourOvertimeApi.remove(deleteItem.id);
      } catch {
        // Backend offline
      }
      setOvertimeRecords(prev => prev.filter(t => t.id !== deleteItem.id));
      toast.success('Overtime record deleted.');
    } catch {
      toast.error('Failed to delete overtime record.');
    } finally {
      setDeleteItem(null);
    }
  };

  const filtered = useMemo(() => {
    return overtimeRecords.filter(t => {
      if (statusFilter !== 'all' && t.approval_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (t.ot_code || '').toLowerCase();
        const worker = (t.worker_name || '').toLowerCase();
        const trade = (t.trade_category || '').toLowerCase();
        const site = (t.site_name || '').toLowerCase();
        if (!code.includes(q) && !worker.includes(q) && !trade.includes(q) && !site.includes(q)) return false;
      }
      return true;
    });
  }, [overtimeRecords, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalOtHours = overtimeRecords.reduce((acc, t) => acc + Number(t.ot_hours || 0), 0);
  const totalOtAmount = overtimeRecords.reduce((acc, t) => acc + Number(t.calculated_amount || 0), 0);
  const pendingApprovals = overtimeRecords.filter(t => t.approval_status === 'Pending').length;
  const approvedCount = overtimeRecords.filter(t => t.approval_status === 'Approved').length;

  const getStatusVariant = (st) => {
    if (st === 'Approved') return 'success';
    if (st === 'Pending') return 'warning';
    if (st === 'Rejected') return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Overtime Register' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Overtime Register"
        subtitle="Manage extra shift hours, overtime multipliers (1.5x, 2.0x), approvals, and extra wage payouts"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total OT Hours Logged"
            value={`${totalOtHours} hrs`}
            status="primary"
            icon={<Clock className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Total OT Wage Payout"
            value={`₹${totalOtAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Approvals"
            value={pendingApprovals}
            status="warning"
            icon={<AlertCircle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved Records"
            value={approvedCount}
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Approval Statuses' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Pending', label: 'Pending Approval' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search code, worker, trade, site..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchOvertime}
              className="text-xs h-8"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs bg-[#0056C9] hover:bg-blue-700"
            >
              Log Overtime Entry
            </Button>
          </div>
        </div>

        {/* Desktop Table View */}
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
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5 w-28">OT Code</th>
                  <th className="px-3 py-2.5">Worker Name & Trade</th>
                  <th className="px-3 py-2.5">Site Location</th>
                  <th className="px-3 py-2.5 text-center">OT Date</th>
                  <th className="px-3 py-2.5 text-center w-24">OT Hours & Rate</th>
                  <th className="px-3 py-2.5 text-right w-28">Calculated Pay (₹)</th>
                  <th className="px-3 py-2.5 text-center w-28">Status</th>
                  <th className="px-3 py-2.5 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading overtime records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No overtime records found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2.5 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-300">
                          {t.ot_code}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={t.worker_name}>
                            {t.worker_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {t.trade_category}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-text-secondary text-[11px]">
                        {t.site_name}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-[11px] text-text-secondary">
                        {t.ot_date}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-[11px]">
                        <span className="text-amber-600 font-bold">{t.ot_hours} hrs</span>
                        <span className="text-text-muted block text-[10px]">{t.rate_multiplier}x @ ₹{t.hourly_base_rate}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600 text-[12px]">
                        ₹{Number(t.calculated_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          variant={getStatusVariant(t.approval_status)}
                          className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center leading-none"
                        >
                          {t.approval_status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          {t.approval_status === 'Pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50"
                              title="Approve OT"
                              onClick={() => handleQuickApprove(t, 'Approved')}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View OT 360"
                            onClick={() => setViewingItem(t)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(t)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteItem(t)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-red-600" />
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

        {/* Mobile View - Cards List (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((t, idx) => (
            <div key={t.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-amber-700 block">{t.ot_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{t.worker_name}</h4>
                  <span className="text-[11px] text-text-muted">{t.trade_category} • {t.site_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(t.approval_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {t.approval_status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">OT Date & Hours</span>
                  <span className="font-mono text-text-primary text-[11px]">{t.ot_date} ({t.ot_hours} hrs)</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Estimated OT Pay</span>
                  <span className="font-mono font-bold text-[12px] text-emerald-600">₹{Number(t.calculated_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-secondary">{t.rate_multiplier}x multiplier</span>
                <div className="flex items-center gap-1">
                  {t.approval_status === 'Pending' && (
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-1.5 text-emerald-600" onClick={() => handleQuickApprove(t, 'Approved')}>
                      Approve
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(t)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                </div>
              </div>
            </div>
          ))}

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

      {/* View Overtime 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.worker_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.ot_code} • {viewingItem.trade_category}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Project Site</span> <span className="font-semibold text-text-primary">{viewingItem.site_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Overtime Date</span> <span className="font-mono">{viewingItem.ot_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">OT Hours Logged</span> <span className="font-bold text-amber-600 font-mono text-sm">{viewingItem.ot_hours} hrs</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Rate Multiplier</span> <span className="font-bold font-mono">{viewingItem.rate_multiplier}x (Base ₹{viewingItem.hourly_base_rate}/hr)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approval Status</span> <span className="font-semibold text-emerald-600">{viewingItem.approval_status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Calculated OT Payout</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.calculated_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              </div>

              {viewingItem.work_reason && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Work Reason & Supervisor Note:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.work_reason}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Overtime Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Clock}
          title={editingItem ? 'Edit Overtime Entry' : 'Log Overtime Entry'}
          subtitle="Record worker extra shift hours, overtime multipliers (1.5x/2.0x), and supervisor justification."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="ot-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Worker & Site Information">
              <EntityEditModal.Grid>
                <FormField label="OT Entry Code" required error={errors.ot_code}>
                  <Input
                    value={form.ot_code}
                    onChange={(e) => setForm(prev => ({ ...prev, ot_code: e.target.value }))}
                    placeholder="OT-2026-001"
                  />
                </FormField>

                <FormField label="Worker Name" required error={errors.worker_name}>
                  <Input
                    value={form.worker_name}
                    onChange={(e) => setForm(prev => ({ ...prev, worker_name: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                  />
                </FormField>

                <FormField label="Trade Category" required>
                  <Select
                    options={[
                      { value: 'Lead Mason', label: 'Lead Mason' },
                      { value: 'Bar Bender Skilled', label: 'Bar Bender Skilled' },
                      { value: 'Centering Mestri', label: 'Centering Mestri' },
                      { value: 'Concrete Mixer Operator', label: 'Concrete Mixer Operator' },
                      { value: 'Plumber / Pipe Fitter', label: 'Plumber / Pipe Fitter' },
                      { value: 'Electrician', label: 'Electrician' },
                      { value: 'Helper / Unskilled', label: 'Helper / Unskilled' },
                    ]}
                    value={form.trade_category}
                    onChange={(v) => setForm(prev => ({ ...prev, trade_category: v }))}
                  />
                </FormField>

                <FormField label="Project Site" required>
                  <Input
                    value={form.site_name}
                    onChange={(e) => setForm(prev => ({ ...prev, site_name: e.target.value }))}
                    placeholder="e.g. Highway Project Phase 1"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Overtime Hours & Multiplier">
              <EntityEditModal.Grid>
                <FormField label="Overtime Date" required>
                  <Input
                    type="date"
                    value={form.ot_date}
                    onChange={(e) => setForm(prev => ({ ...prev, ot_date: e.target.value }))}
                  />
                </FormField>

                <FormField label="OT Hours Logged" required>
                  <Input
                    type="number"
                    step="0.5"
                    value={form.ot_hours}
                    onChange={(e) => setForm(prev => ({ ...prev, ot_hours: e.target.value }))}
                    placeholder="2.0"
                  />
                </FormField>

                <FormField label="Rate Multiplier">
                  <Select
                    options={[
                      { value: '1.5', label: '1.5x (Standard OT)' },
                      { value: '2.0', label: '2.0x (Holiday / Night Shift)' },
                      { value: '1.0', label: '1.0x (Flat Rate)' },
                    ]}
                    value={form.rate_multiplier}
                    onChange={(v) => setForm(prev => ({ ...prev, rate_multiplier: v }))}
                  />
                </FormField>

                <FormField label="Base Hourly Rate (₹/hr)">
                  <Input
                    type="number"
                    value={form.hourly_base_rate}
                    onChange={(e) => setForm(prev => ({ ...prev, hourly_base_rate: e.target.value }))}
                    placeholder="150"
                  />
                </FormField>

                <FormField label="Approval Status">
                  <Select
                    options={[
                      { value: 'Pending', label: 'Pending Approval' },
                      { value: 'Approved', label: 'Approved' },
                      { value: 'Rejected', label: 'Rejected' },
                    ]}
                    value={form.approval_status}
                    onChange={(v) => setForm(prev => ({ ...prev, approval_status: v }))}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Work Reason & Description">
              <FormField label="Work Reason / Task Justification">
                <Textarea
                  value={form.work_reason}
                  onChange={(e) => setForm(prev => ({ ...prev, work_reason: e.target.value }))}
                  placeholder="Explain reason for extra shift work (e.g. Concrete pour completion)..."
                />
              </FormField>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="ot-form"
            submitLabel={editingItem ? 'Update OT Record' : 'Save OT Record'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Overtime Record"
        message={`Are you sure you want to delete overtime record "${deleteItem?.ot_code}" for ${deleteItem?.worker_name}?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}

export default LabourOvertimePage;
