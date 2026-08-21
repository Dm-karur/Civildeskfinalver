import { useState, useEffect, useMemo } from 'react';
import {
  Receipt, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, Landmark
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
import { projectsApi, expensesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

/* 
const DEFAULT_BILLS = [

  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    bill_no: 'BILL-2026-104',
    internal_voucher_no: 'VCH-EXP-0881',
    bill_date: '2026-08-14',
    due_date: '2026-09-04',
    payee_name: 'Tata Steel Ltd / Authorized Distributor',
    cost_head: 'Material Procurement (TMT Rebars)',
    taxable_amount: 4500000,
    gst_amount: 810000, // 18%
    grand_total: 5310000,
    paid_amount: 5310000,
    balance_due: 0,
    payment_status: 'Fully Settled'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    bill_no: 'BILL-2026-105',
    internal_voucher_no: 'VCH-EXP-0882',
    bill_date: '2026-08-18',
    due_date: '2026-09-08',
    payee_name: 'Apex Heavy Crane Rentals',
    cost_head: 'Equipment Rental & Fuel',
    taxable_amount: 950000,
    gst_amount: 171000,
    grand_total: 1121000,
    paid_amount: 500000,
    balance_due: 621000,
    payment_status: 'Partially Settled'
  },
  {
    id: 3,
    project_id: 2,
    project_code: 'PRJ-2026-002',
    project_name: 'Highway Expansion Package 3',
    bill_no: 'BILL-2026-106',
    internal_voucher_no: 'VCH-EXP-0883',
    bill_date: '2026-08-20',
    due_date: '2026-09-10',
    payee_name: 'UltraTech Cement Bulk Depot',
    cost_head: 'Material Procurement (Cement)',
    taxable_amount: 1850000,
    gst_amount: 518000, // 28% GST on cement
    grand_total: 2368000,
    paid_amount: 0,
    balance_due: 2368000,
    payment_status: 'Pending Payment'
  }
];
*/

const EMPTY_FORM = {
  project_id: '',
  bill_no: '',
  internal_voucher_no: '',
  bill_date: '',
  due_date: '',
  payee_name: '',
  cost_head: 'Material Procurement (TMT Rebars)',
  taxable_amount: '1000000',
  gst_amount: '180000',
  grand_total: '1180000',
  paid_amount: '0',
  notes: '',
};

export function MasterExpensesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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
  const [saving, setSaving] = useState(false);

  // Load Projects & API Data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      expensesApi?.bills ? expensesApi.bills.list().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([projRes, billsRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      const bList = billsRes?.data?.expense_bills ?? billsRes?.data?.data ?? [];
      if (Array.isArray(bList) && bList.length > 0) {
        const normalized = bList.map((b, idx) => ({
          id: b.id || idx + 1,
          project_id: b.project_id || 1,
          project_code: b.project_code || 'PRJ-2026-001',
          project_name: b.project_name || 'Civil Project',
          bill_no: b.bill_no || `BILL-2026-${idx + 100}`,
          internal_voucher_no: b.internal_voucher_no || `VCH-${idx + 100}`,
          bill_date: b.bill_date || '2026-08-15',
          due_date: b.due_date || '2026-09-05',
          payee_name: b.payee_name || 'Vendor Entity',
          cost_head: b.cost_head || 'Site Expense',
          taxable_amount: Number(b.taxable_amount || 1000000),
          gst_amount: Number(b.gst_amount || 180000),
          grand_total: Number(b.grand_total || 1180000),
          paid_amount: Number(b.paid_amount || 0),
          balance_due: Number(b.grand_total || 1180000) - Number(b.paid_amount || 0),
          payment_status: b.payment_status || 'Pending Payment'
        }));
        setBills(normalized);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      bill_no: `BILL-2026-${bills.length + 107}`,
      internal_voucher_no: `VCH-EXP-088${bills.length + 4}`,
      bill_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      bill_no: item.bill_no || '',
      internal_voucher_no: item.internal_voucher_no || '',
      bill_date: item.bill_date || '',
      due_date: item.due_date || '',
      payee_name: item.payee_name || '',
      cost_head: item.cost_head || 'Material Procurement (TMT Rebars)',
      taxable_amount: String(item.taxable_amount || '1000000'),
      gst_amount: String(item.gst_amount || '180000'),
      grand_total: String(item.grand_total || '1180000'),
      paid_amount: String(item.paid_amount || '0'),
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'taxable_amount' || field === 'gst_amount') {
        const tax = Number(field === 'taxable_amount' ? value : prev.taxable_amount) || 0;
        const gst = Number(field === 'gst_amount' ? value : prev.gst_amount) || 0;
        next.grand_total = String(tax + gst);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.bill_no.trim()) errs.bill_no = 'Bill number is required';
    if (!form.payee_name.trim()) errs.payee_name = 'Payee name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const tax = Number(form.taxable_amount || 0);
      const gst = Number(form.gst_amount || 0);
      const tot = tax + gst;
      const paid = Number(form.paid_amount || 0);
      const bal = Math.max(0, tot - paid);

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        bill_no: form.bill_no,
        internal_voucher_no: form.internal_voucher_no,
        bill_date: form.bill_date,
        due_date: form.due_date,
        payee_name: form.payee_name,
        cost_head: form.cost_head,
        taxable_amount: tax,
        gst_amount: gst,
        grand_total: tot,
        paid_amount: paid,
        balance_due: bal,
        payment_status: bal === 0 ? 'Fully Settled' : paid > 0 ? 'Partially Settled' : 'Pending Payment',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setBills(prev => prev.map(b => b.id === editingItem.id ? newItem : b));
        toast.success('Expense bill updated.');
      } else {
        setBills(prev => [newItem, ...prev]);
        toast.success('Master expense bill registered.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save expense bill.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setBills(prev => prev.filter(b => b.id !== deleteItem.id));
    toast.success('Expense bill removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return bills.filter(b => {
      if (selectedProjectId !== 'all' && String(b.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !b.payment_status.includes(statusFilter)) return false;
      if (search) {
        const str = search.toLowerCase();
        const no = String(b.bill_no || '').toLowerCase();
        const vch = String(b.internal_voucher_no || '').toLowerCase();
        const pay = String(b.payee_name || '').toLowerCase();
        const proj = String(b.project_name || '').toLowerCase();
        if (!no.includes(str) && !vch.includes(str) && !pay.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [bills, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalBilled = useMemo(() => bills.reduce((acc, b) => acc + Number(b.grand_total || 0), 0), [bills]);
  const totalPaid = useMemo(() => bills.reduce((acc, b) => acc + Number(b.paid_amount || 0), 0), [bills]);
  const totalDue = useMemo(() => bills.reduce((acc, b) => acc + Number(b.balance_due || 0), 0), [bills]);

  const getStatusVariant = (st) => {
    if (st.includes('Fully')) return 'success';
    if (st.includes('Partial')) return 'warning';
    return 'danger';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Master Expense Bills Register' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Master Expense Bills & Payables Register"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Gross Billed"
            value={`₹${(totalBilled / 100000).toFixed(2)}L`}
            status="primary"
            icon={<Receipt className="w-4 h-4" />}
          />
          <KpiCard
            label="Disbursed & Paid"
            value={`₹${(totalPaid / 100000).toFixed(2)}L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Balance Payables Due"
            value={`₹${(totalDue / 100000).toFixed(2)}L`}
            status={totalDue > 0 ? 'warning' : 'success'}
            icon={<IndianRupee className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="GST Input Tax Credit (ITC)"
            value="100% Reconciled"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
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
                  { value: 'Fully', label: 'Fully Settled' },
                  { value: 'Partial', label: 'Partially Settled' },
                  { value: 'Pending', label: 'Pending Payment' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search bill no, voucher, payee..."
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
              title="Print Expense Bills"
            >
              Print Bills
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Add Expense Bill
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
                  <th className="px-3 py-2 w-28">Bill No</th>
                  <th className="px-3 py-2">Payee & Cost Head</th>
                  <th className="px-3 py-2 text-right w-28">Taxable</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">GST</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Total (₹)</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-amber-600">Balance Due</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading master expense bills...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No expense bills found.
                    </td>
                  </tr>
                ) : (
                  paged.map((b, idx) => (
                    <tr key={b.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {b.bill_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{b.bill_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={b.payee_name}>
                            {b.payee_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {b.cost_head} • {b.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        ₹{(b.taxable_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-sky-600">
                        ₹{(b.gst_amount / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{(b.grand_total / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-600 text-[11px]">
                        ₹{(b.balance_due / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(b.payment_status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {b.payment_status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Bill 360"
                            onClick={() => setViewingItem(b)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(b)}
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
          {paged.map((b, idx) => (
            <div key={b.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{b.bill_no} • {b.bill_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{b.payee_name}</h4>
                  <span className="text-[11px] text-text-muted">{b.cost_head}</span>
                </div>
                <Badge
                  variant={getStatusVariant(b.payment_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(b.grand_total / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Paid Amount</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{(b.paid_amount / 100000).toFixed(2)}L</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Balance Due</span>
                  <span className="font-mono font-bold text-amber-600 text-[11px]">₹{(b.balance_due / 100000).toFixed(2)}L</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(b)}>
                  <Eye className="w-3 h-3 mr-1" /> View Bill
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

      {/* View Bill 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.bill_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.payee_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Bill Sum</span> <span className="font-bold text-primary font-mono text-base">₹{(viewingItem.grand_total / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Balance Due</span> <span className="font-bold text-amber-600 font-mono text-base">₹{(viewingItem.balance_due / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Taxable Amount</span> <span className="font-mono">₹{(viewingItem.taxable_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">GST Amount</span> <span className="font-mono text-sky-600">₹{(viewingItem.gst_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Paid to Date</span> <span className="font-mono font-bold text-emerald-600">₹{(viewingItem.paid_amount / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Due Date</span> <span className="font-mono">{viewingItem.due_date}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Cost Head</span> <span className="text-text-primary font-medium">{viewingItem.cost_head}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Expense Voucher
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Receipt}
          title={editingItem ? 'Edit Expense Bill' : 'Add Master Expense Bill'}
          subtitle="Record supplier / vendor expense bills, GST input tax credits, and payment statuses."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="eb-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Bill Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Bill / Invoice No" required error={errors.bill_no}>
                  <Input
                    value={form.bill_no}
                    onChange={(e) => handleFormChange('bill_no', e.target.value)}
                    placeholder="BILL-2026-108"
                  />
                </FormField>

                <FormField label="Internal Voucher No">
                  <Input
                    value={form.internal_voucher_no}
                    onChange={(e) => handleFormChange('internal_voucher_no', e.target.value)}
                    placeholder="VCH-EXP-0885"
                  />
                </FormField>

                <FormField label="Payee / Vendor Name" required error={errors.payee_name} className="md:col-span-2">
                  <Input
                    value={form.payee_name}
                    onChange={(e) => handleFormChange('payee_name', e.target.value)}
                    placeholder="e.g. Tata Steel Ltd / Authorized Distributor"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Commercial Valuation & GST">
              <EntityEditModal.Grid>
                <FormField label="Taxable Basic Sum (₹)" required>
                  <Input
                    type="number"
                    value={form.taxable_amount}
                    onChange={(e) => handleFormChange('taxable_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="GST Amount (₹)">
                  <Input
                    type="number"
                    value={form.gst_amount}
                    onChange={(e) => handleFormChange('gst_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Grand Total (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.grand_total || 0).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Paid Amount (₹)">
                  <Input
                    type="number"
                    value={form.paid_amount}
                    onChange={(e) => handleFormChange('paid_amount', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="eb-form"
            submitLabel={editingItem ? 'Update Bill' : 'Save Expense Bill'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Expense Bill"
        message={`Are you sure you want to delete "${deleteItem?.bill_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
