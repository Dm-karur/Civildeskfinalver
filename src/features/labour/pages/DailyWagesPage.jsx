import { useState, useEffect, useMemo } from 'react';
import {
  Wallet, IndianRupee, CheckCircle2, Clock, Users,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer,
  CreditCard, ArrowDownRight, ArrowUpRight, FileSpreadsheet
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
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, request, wagesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const extractList = (res) => {
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data?.labour_wages && Array.isArray(res.data.labour_wages)) return res.data.labour_wages;
  if (res?.labour_wages && Array.isArray(res.labour_wages)) return res.labour_wages;
  return [];
};

const EMPTY_FORM = {
  project_id: '',
  date: '',
  period_code: 'WP-2026-W34',
  worker_code: '',
  worker_name: '',
  category_name: 'General Helper',
  contractor_name: '',
  base_rate_per_day: '850',
  present_days: '6.0',
  ot_hours: '0.0',
  reg_earnings: '5100',
  ot_earnings: '0',
  gross_wages: '5100',
  advances_deducted: '0',
  canteen_deducted: '0',
  net_payable: '5100',
  payment_mode: 'Bank Transfer (NEFT)',
  status: 'Approved for Payout',
  notes: '',
};

export function DailyWagesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [wages, setWages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitDebug, setSubmitDebug] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadWages = async () => {
    setLoading(true);
    try {
      const res = await wagesApi.list({ project_id: selectedProjectId !== 'all' ? selectedProjectId : undefined });
      setWages(extractList(res));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load wages from backend.');
    } finally {
      setLoading(false);
    }
  };

  // Load Projects and Wages
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    loadWages();
  }, [selectedProjectId]);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      date: new Date().toISOString().split('T')[0],
      worker_code: `LAB-00${wages.length + 1}`,
    });
    setErrors({});
    setSubmitDebug(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      date: item.date || item.settlement_date || '',
      period_code: item.period_code || 'WP-2026-W34',
      worker_code: item.worker_code || '',
      worker_name: item.worker_name || '',
      category_name: item.category_name || '',
      contractor_name: item.contractor_name || '',
      base_rate_per_day: String(item.base_rate_per_day || '850'),
      present_days: String(item.present_days || '6.0'),
      ot_hours: String(item.ot_hours || '0.0'),
      reg_earnings: String(item.reg_earnings || '5100'),
      ot_earnings: String(item.ot_earnings || '0'),
      gross_wages: String(item.gross_wages || '5100'),
      advances_deducted: String(item.advances_deducted || '0'),
      canteen_deducted: String(item.canteen_deducted || '0'),
      net_payable: String(item.net_payable || '5100'),
      payment_mode: item.payment_mode || 'Bank Transfer (NEFT)',
      status: item.status || 'Approved for Payout',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (['base_rate_per_day', 'present_days', 'ot_hours', 'advances_deducted', 'canteen_deducted'].includes(field)) {
        const rate = Number(field === 'base_rate_per_day' ? value : prev.base_rate_per_day) || 0;
        const days = Number(field === 'present_days' ? value : prev.present_days) || 0;
        const otH = Number(field === 'ot_hours' ? value : prev.ot_hours) || 0;
        const adv = Number(field === 'advances_deducted' ? value : prev.advances_deducted) || 0;
        const cant = Number(field === 'canteen_deducted' ? value : prev.canteen_deducted) || 0;

        const regE = Math.round(rate * days);
        const otE = Math.round(otH * (rate / 8) * 1.5);
        const gross = regE + otE;
        const net = Math.max(0, gross - adv - cant);

        next.reg_earnings = String(regE);
        next.ot_earnings = String(otE);
        next.gross_wages = String(gross);
        next.net_payable = String(net);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.worker_name.trim()) errs.worker_name = 'Worker name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
    const newRecord = {
      project_id: Number(form.project_id || 1),
      project_code: selectedProj?.project_code || 'PRJ-2026-001',
      project_name: selectedProj?.project_name || 'Civil Project',
      date: form.date,
      period_code: form.period_code,
      period_label: '17 Aug - 23 Aug 2026 (Week 34)',
      worker_code: form.worker_code || 'LAB-000',
      worker_name: form.worker_name,
      category_name: form.category_name,
      contractor_name: form.contractor_name || 'Direct Roll',
      bank_name: 'State Bank of India',
      account_masked: 'XXXX-XXXX-4892',
      base_rate_per_day: Number(form.base_rate_per_day || 850),
      present_days: Number(form.present_days || 6.0),
      ot_hours: Number(form.ot_hours || 0.0),
      reg_earnings: Number(form.reg_earnings || 0),
      ot_earnings: Number(form.ot_earnings || 0),
      gross_wages: Number(form.gross_wages || 0),
      advances_deducted: Number(form.advances_deducted || 0),
      canteen_deducted: Number(form.canteen_deducted || 0),
      net_payable: Number(form.net_payable || 0),
      payment_mode: form.payment_mode,
      status: form.status,
      settlement_date: form.date || new Date().toISOString().split('T')[0],
      notes: form.notes,
    };

    try {
      if (editingItem?.id) {
        await request.patch(`/labour-wages/${editingItem.id}`, newRecord);
        toast.success('Wage record updated.');
      } else {
        await wagesApi.create(newRecord);
        toast.success('Wage entry added.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
      setSubmitDebug(null);
      loadWages();
    } catch (e) {
      console.error(e);
      setErrors(e?.errors || {});
      setSubmitDebug({ backendErrors: e?.errors || e?.message || e, payload: newRecord });
      toast.error(e?.message || 'Failed to save wage entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async (item) => {
    try { await request.patch(`/labour-wages/${item.id}`, { status: 'Paid / Settled' }); } catch(e){}
    setWages(prev => prev.map(w => w.id === item.id ? { ...w, status: 'Paid / Settled' } : w));
    toast.success(`Payout settled for ${item.worker_name}.`);
  };

  const handleSettleAll = async () => {
    try { await request.post('/labour-wages/settle-all', {}); } catch(e){}
    setWages(prev => prev.map(w => ({ ...w, status: 'Paid / Settled' })));
    toast.success('All approved wages marked as Paid & Disbursed.');
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      try { await request.delete(`/labour-wages/${deleteItem.id}`); } catch(e){}
      setWages(prev => prev.filter(w => w.id !== deleteItem.id));
      toast.success('Wage entry deleted.');
    } catch {
      toast.error('Failed to delete wage entry.');
    } finally {
      setDeleteItem(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return wages.filter(w => {
      if (selectedProjectId !== 'all' && String(w.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (w.worker_code || '').toLowerCase();
        const name = (w.worker_name || '').toLowerCase();
        const cat = (w.category_name || '').toLowerCase();
        const cont = (w.contractor_name || '').toLowerCase();
        const b = (w.bank_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cat.includes(q) && !cont.includes(q) && !b.includes(q)) return false;
      }
      return true;
    });
  }, [wages, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const grossTotal = useMemo(() => wages.reduce((acc, w) => acc + Number(w.gross_wages || 0), 0), [wages]);
  const otTotal = useMemo(() => wages.reduce((acc, w) => acc + Number(w.ot_earnings || 0), 0), [wages]);
  const deductionsTotal = useMemo(() => wages.reduce((acc, w) => acc + Number(w.advances_deducted || 0) + Number(w.canteen_deducted || 0), 0), [wages]);
  const netPayableTotal = useMemo(() => wages.reduce((acc, w) => acc + Number(w.net_payable || 0), 0), [wages]);

  const getStatusVariant = (status) => {
    if (status === 'Paid / Settled') return 'success';
    if (status === 'Approved for Payout') return 'info';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Labour & Attendance', href: '/labour' },
    { label: 'Daily Wages' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Labour Wages & Payroll Settlement Roll"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Gross Wages Roll"
            value={`₹${grossTotal.toLocaleString('en-IN')}`}
            status="primary"
            icon={<Wallet className="w-4 h-4" />}
          />
          <KpiCard
            label="Overtime Additions"
            value={`₹${otTotal.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Advances & Deductions"
            value={`₹${deductionsTotal.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<ArrowDownRight className="w-4 h-4 text-red-500" />}
          />
          <KpiCard
            label="Net Payable Payout"
            value={`₹${netPayableTotal.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-600" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
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

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Approved for Payout', label: 'Approved for Payout' },
                  { value: 'Paid / Settled', label: 'Paid / Settled' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search worker, bank, contractor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
              className="text-xs h-8 shadow-xs"
              title="Print Wage Register"
            >
              Print Roll
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Check className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={handleSettleAll}
              className="text-xs h-8 shadow-xs"
            >
              Disburse All
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Add Wage Entry
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
                  <th className="px-3 py-2">Worker & Bank Details</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Mandays / OT</th>
                  <th className="px-3 py-2 text-right w-24">Gross (₹)</th>
                  <th className="px-3 py-2 text-right w-24">Deductions</th>
                  <th className="px-3 py-2 text-right w-28">Net Payable</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading wage register...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No wage entries found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((w, idx) => (
                    <tr key={w.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {w.worker_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={w.worker_name}>
                            {w.worker_name} ({w.category_name})
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            {w.bank_name} • {w.account_masked}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[10px]">
                        <span className="text-text-primary font-semibold">{w.present_days} Days</span>
                        {w.ot_hours > 0 && <span className="text-amber-600 font-semibold block">+{w.ot_hours}h OT</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{Number(w.gross_wages).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-red-600">
                        {w.advances_deducted + w.canteen_deducted > 0 ? `-₹${(w.advances_deducted + w.canteen_deducted).toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[12px]">
                        ₹{Number(w.net_payable).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(w.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {w.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Payslip Voucher"
                            onClick={() => setViewingItem(w)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {w.status !== 'Paid / Settled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700"
                              title="Settle & Pay"
                              onClick={() => handleSettle(w)}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(w)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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
          {paged.map((w, idx) => (
            <div key={w.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{w.worker_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{w.worker_name}</h4>
                  <span className="text-[11px] text-text-muted">{w.category_name} • {w.contractor_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(w.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {w.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Mandays Logged</span>
                  <span className="font-mono text-text-primary text-[11px]">{w.present_days} Days {w.ot_hours > 0 ? `(+${w.ot_hours}h OT)` : ''}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Net Payout</span>
                  <span className="font-mono font-bold text-emerald-600 text-[13px]">₹{Number(w.net_payable).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{w.payment_mode}</span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(w)}>
                    <Eye className="w-3 h-3 mr-1" /> Payslip
                  </Button>
                  {w.status !== 'Paid / Settled' && (
                    <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSettle(w)}>
                      <Check className="w-3 h-3 mr-1" /> Settle
                    </Button>
                  )}
                </div>
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

      {/* View Payslip 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Labour Wage Payslip Voucher</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.period_code} • {viewingItem.worker_code}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="border border-border rounded-lg p-3 bg-surface-muted/20 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-text-primary text-sm">{viewingItem.worker_name}</h4>
                    <span className="text-text-muted">{viewingItem.category_name} • {viewingItem.contractor_name}</span>
                  </div>
                  <Badge variant="success" className="text-[9px] font-mono font-bold">
                    {viewingItem.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/50 font-mono">
                  <div>Bank: {viewingItem.bank_name}</div>
                  <div>A/C: {viewingItem.account_masked}</div>
                  <div>Base Rate: ₹{viewingItem.base_rate_per_day}/day</div>
                  <div>Settlement: {viewingItem.payment_mode}</div>
                </div>
              </div>

              {/* Earnings Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-surface-muted/60 px-3 py-1.5 font-bold text-text-primary border-b border-border text-[11px]">
                  Earnings & Allowances
                </div>
                <div className="p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Regular Days Worked ({viewingItem.present_days} Days @ ₹{viewingItem.base_rate_per_day})</span>
                    <span className="font-mono font-bold">₹{viewingItem.reg_earnings.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overtime Wages ({viewingItem.ot_hours} hrs OT @ 1.5x)</span>
                    <span className="font-mono font-bold text-amber-600">+₹{viewingItem.ot_earnings.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/50 font-bold">
                    <span>Gross Wages Earned</span>
                    <span className="font-mono text-text-primary">₹{viewingItem.gross_wages.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-surface-muted/60 px-3 py-1.5 font-bold text-text-primary border-b border-border text-[11px]">
                  Advances & Deductions
                </div>
                <div className="p-3 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Site Cash Advance Recovery</span>
                    <span className="font-mono text-red-600">-₹{viewingItem.advances_deducted.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Canteen & Mess Charges</span>
                    <span className="font-mono text-red-600">-₹{viewingItem.canteen_deducted.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/50 font-bold">
                    <span>Total Deductions</span>
                    <span className="font-mono text-red-600">-₹{(viewingItem.advances_deducted + viewingItem.canteen_deducted).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex justify-between items-center">
                <span className="font-bold text-emerald-800 text-sm">Net Payable Disbursed:</span>
                <span className="font-mono font-bold text-emerald-700 text-base">₹{Number(viewingItem.net_payable).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Voucher
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Wage Entry Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Wallet}
          title={editingItem ? 'Edit Labour Wage Record' : 'Add Labour Wage Entry'}
          subtitle="Calculate regular wages, overtime additions, advances, and net payable amount."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="wage-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            {submitDebug && (
              <div className="bg-red-50 text-red-600 p-3 mb-4 rounded border border-red-200 text-xs font-mono whitespace-pre-wrap">
                RAW BACKEND ERRORS: {JSON.stringify(submitDebug.backendErrors, null, 2)}
                <br/>
                API PAYLOAD SENT: {JSON.stringify(submitDebug.payload, null, 2)}
              </div>
            )}
            <EntityEditModal.Section title="Worker Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Wage Period Code" required>
                  <Input
                    value={form.period_code}
                    onChange={(e) => handleFormChange('period_code', e.target.value)}
                    placeholder="WP-2026-W34"
                  />
                </FormField>

                <FormField label="Date" required error={errors.date}>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                  />
                </FormField>

                <FormField label="Worker Name" required error={errors.worker_name}>
                  <Input
                    value={form.worker_name}
                    onChange={(e) => handleFormChange('worker_name', e.target.value)}
                    placeholder="e.g. K. Selvam"
                  />
                </FormField>

                <FormField label="Daily Base Rate (₹)">
                  <Input
                    type="number"
                    value={form.base_rate_per_day}
                    onChange={(e) => handleFormChange('base_rate_per_day', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Mandays, OT & Deductions">
              <EntityEditModal.Grid>
                <FormField label="Present Mandays Worked">
                  <Input
                    type="number"
                    step="0.5"
                    value={form.present_days}
                    onChange={(e) => handleFormChange('present_days', e.target.value)}
                  />
                </FormField>

                <FormField label="Overtime Hours Logged">
                  <Input
                    type="number"
                    step="0.5"
                    value={form.ot_hours}
                    onChange={(e) => handleFormChange('ot_hours', e.target.value)}
                  />
                </FormField>

                <FormField label="Advance Cash Deduction (₹)">
                  <Input
                    type="number"
                    value={form.advances_deducted}
                    onChange={(e) => handleFormChange('advances_deducted', e.target.value)}
                  />
                </FormField>

                <FormField label="Canteen / Mess Deduction (₹)">
                  <Input
                    type="number"
                    value={form.canteen_deducted}
                    onChange={(e) => handleFormChange('canteen_deducted', e.target.value)}
                  />
                </FormField>

                <FormField label="Net Calculated Payout (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.net_payable).toLocaleString('en-IN')}`}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="wage-form"
            submitLabel={editingItem ? 'Update Wage Entry' : 'Save Wage Entry'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Wage Record"
        message={`Are you sure you want to delete this wage record?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
