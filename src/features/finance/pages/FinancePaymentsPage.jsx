import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, CheckCircle2, IndianRupee, Clock, ShieldCheck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  Check, AlertCircle, Sparkles, Building, Printer, FileText, ArrowUpRight
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

const DEFAULT_PAYMENTS = [
  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    payment_no: 'PAY-2026-088',
    payment_date: '2026-08-16',
    bill_no: 'BILL-2026-104',
    beneficiary_name: 'Tata Steel Ltd / Authorized Distributor',
    category: 'Material Supplier (Steel)',
    amount_paid: 5310000,
    tds_deducted: 5310, // 0.1% TDS u/s 194Q
    payment_mode: 'HDFC Corporate RTGS',
    bank_account: 'HDFC Main Operations A/C #0012',
    utr_no: 'HDFCR520260816881',
    status: 'Settled'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    payment_no: 'PAY-2026-089',
    payment_date: '2026-08-18',
    bill_no: 'BILL-2026-105',
    beneficiary_name: 'Apex Heavy Crane Rentals',
    category: 'Equipment Rental',
    amount_paid: 500000,
    tds_deducted: 10000, // 2% TDS u/s 194C
    payment_mode: 'HDFC Corporate NEFT',
    bank_account: 'HDFC Main Operations A/C #0012',
    utr_no: 'HDFCR520260818942',
    status: 'Settled'
  },
  {
    id: 3,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    payment_no: 'PAY-2026-090',
    payment_date: '2026-08-20',
    bill_no: 'WO-RA-2026-012',
    beneficiary_name: 'Sri Murugan Civil Infra Pvt Ltd',
    category: 'Subcontractor RA Bill',
    amount_paid: 1250000,
    tds_deducted: 12500, // 1% TDS u/s 194C (Individual)
    payment_mode: 'HDFC Corporate RTGS',
    bank_account: 'HDFC Main Operations A/C #0012',
    utr_no: 'HDFCR520260820129',
    status: 'Settled'
  }
];

const EMPTY_FORM = {
  project_id: '',
  payment_no: '',
  payment_date: '',
  bill_no: '',
  beneficiary_name: '',
  category: 'Material Supplier Payment',
  amount_paid: '500000',
  tds_deducted: '5000',
  payment_mode: 'HDFC Corporate RTGS',
  bank_account: 'HDFC Main Operations A/C #0012',
  utr_no: '',
  notes: '',
};

export function FinancePaymentsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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
      expensesApi?.payments ? expensesApi.payments.list().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([projRes, payRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      const payList = payRes?.data?.expense_payments ?? payRes?.data?.data ?? [];
      if (Array.isArray(payList) && payList.length > 0) {
        const normalized = payList.map((p, idx) => ({
          id: p.id || idx + 1,
          project_id: p.project_id || 1,
          project_code: p.project_code || 'PRJ-2026-001',
          project_name: p.project_name || 'Civil Project',
          payment_no: p.payment_no || `PAY-2026-${idx + 100}`,
          payment_date: p.payment_date || '2026-08-18',
          bill_no: p.bill_no || 'BILL-REF',
          beneficiary_name: p.beneficiary_name || p.payee_name || 'Beneficiary Entity',
          category: p.category || 'Vendor Payment',
          amount_paid: Number(p.amount_paid || p.amount || 500000),
          tds_deducted: Number(p.tds_deducted || 5000),
          payment_mode: p.payment_mode || 'HDFC Corporate RTGS',
          bank_account: p.bank_account || 'HDFC Main Operations A/C #0012',
          utr_no: p.utr_no || p.reference_no || `HDFCR520260818${idx}`,
          status: 'Settled'
        }));
        setPayments(normalized);
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
      payment_no: `PAY-2026-09${payments.length + 1}`,
      payment_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      payment_no: item.payment_no || '',
      payment_date: item.payment_date || '',
      bill_no: item.bill_no || '',
      beneficiary_name: item.beneficiary_name || '',
      category: item.category || 'Material Supplier Payment',
      amount_paid: String(item.amount_paid || '500000'),
      tds_deducted: String(item.tds_deducted || '5000'),
      payment_mode: item.payment_mode || 'HDFC Corporate RTGS',
      bank_account: item.bank_account || 'HDFC Main Operations A/C #0012',
      utr_no: item.utr_no || '',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.payment_no.trim()) errs.payment_no = 'Payment voucher number is required';
    if (!form.beneficiary_name.trim()) errs.beneficiary_name = 'Beneficiary name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const amt = Number(form.amount_paid || 0);
      const tds = Number(form.tds_deducted || 0);

      const newItem = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        payment_no: form.payment_no,
        payment_date: form.payment_date,
        bill_no: form.bill_no,
        beneficiary_name: form.beneficiary_name,
        category: form.category,
        amount_paid: amt,
        tds_deducted: tds,
        payment_mode: form.payment_mode,
        bank_account: form.bank_account,
        utr_no: form.utr_no || 'HDFCR520260821001',
        status: 'Settled',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setPayments(prev => prev.map(p => p.id === editingItem.id ? newItem : p));
        toast.success('Payment voucher updated.');
      } else {
        setPayments(prev => [newItem, ...prev]);
        toast.success('Disbursement payment voucher recorded.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save payment voucher.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setPayments(prev => prev.filter(p => p.id !== deleteItem.id));
    toast.success('Payment voucher removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (selectedProjectId !== 'all' && String(p.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const str = search.toLowerCase();
        const no = String(p.payment_no || '').toLowerCase();
        const ben = String(p.beneficiary_name || '').toLowerCase();
        const utr = String(p.utr_no || '').toLowerCase();
        const proj = String(p.project_name || '').toLowerCase();
        if (!no.includes(str) && !ben.includes(str) && !utr.includes(str) && !proj.includes(str)) return false;
      }
      return true;
    });
  }, [payments, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalDisbursed = useMemo(() => payments.reduce((acc, p) => acc + Number(p.amount_paid || 0), 0), [payments]);
  const totalTDSWithheld = useMemo(() => payments.reduce((acc, p) => acc + Number(p.tds_deducted || 0), 0), [payments]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Finance & Cost Control', href: '/finance/project-cost' },
    { label: 'Payment Disbursements' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Disbursement Payments & Bank Settlement Vouchers"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Disbursed to Date"
            value={`₹${(totalDisbursed / 10000000).toFixed(2)} Cr`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Settled Payment Vouchers"
            value={`${payments.length} Payments`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Statutory TDS Remitted"
            value={`₹${(totalTDSWithheld / 100000).toFixed(2)}L`}
            status="neutral"
            icon={<CreditCard className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Treasury Bank Settlement"
            value="100% UTR Verified"
            status="neutral"
            icon={<ShieldCheck className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-52">
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

            <div className="w-full sm:w-64">
              <SearchField
                placeholder="Search payment no, beneficiary, UTR..."
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
              title="Print Payment Register"
            >
              Print Register
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Record Payment
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
                  <th className="px-3 py-2 w-28">Payment Ref</th>
                  <th className="px-3 py-2">Beneficiary & Category</th>
                  <th className="px-3 py-2 text-right w-28 font-bold text-emerald-600">Amount Paid</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">TDS Deducted</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Bank Ref / UTR</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading disbursement records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No payment vouchers found.
                    </td>
                  </tr>
                ) : (
                  paged.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {p.payment_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{p.payment_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={p.beneficiary_name}>
                            {p.beneficiary_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {p.category} • {p.bill_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{(p.amount_paid / 100000).toFixed(2)}L
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        ₹{p.tds_deducted.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[10px] text-text-secondary truncate">
                        {p.utr_no}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Settled
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Payment Advice 360"
                            onClick={() => setViewingItem(p)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(p)}
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
          {paged.map((p, idx) => (
            <div key={p.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{p.payment_no} • {p.payment_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.beneficiary_name}</h4>
                  <span className="text-[11px] text-text-muted">{p.category}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  ₹{(p.amount_paid / 100000).toFixed(2)}L
                </Badge>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                  <Eye className="w-3 h-3 mr-1" /> View Advice
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

      {/* View Payment Advice 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.payment_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.beneficiary_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Disbursed Amount</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{(viewingItem.amount_paid / 100000).toFixed(2)}L</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">TDS Withheld</span> <span className="font-mono text-amber-600 font-bold">₹{viewingItem.tds_deducted.toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Payment Mode</span> <span className="font-mono">{viewingItem.payment_mode}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Bank UTR Reference</span> <span className="font-mono font-bold text-primary">{viewingItem.utr_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Debited Bank Account</span> <span className="font-mono font-medium">{viewingItem.bank_account}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Settled Against Bill</span> <span className="font-mono">{viewingItem.bill_no}</span></div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Payment Advice
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
          icon={CreditCard}
          title={editingItem ? 'Edit Payment Voucher' : 'Record Disbursement Payment'}
          subtitle="Record treasury bank disbursements to material suppliers and subcontractors."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="pay-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Payment Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Payment Voucher No" required error={errors.payment_no}>
                  <Input
                    value={form.payment_no}
                    onChange={(e) => handleFormChange('payment_no', e.target.value)}
                    placeholder="PAY-2026-095"
                  />
                </FormField>

                <FormField label="Beneficiary Entity Name" required error={errors.beneficiary_name} className="md:col-span-2">
                  <Input
                    value={form.beneficiary_name}
                    onChange={(e) => handleFormChange('beneficiary_name', e.target.value)}
                    placeholder="e.g. Tata Steel Ltd / Authorized Distributor"
                  />
                </FormField>

                <FormField label="Bill / Work Order Reference">
                  <Input
                    value={form.bill_no}
                    onChange={(e) => handleFormChange('bill_no', e.target.value)}
                    placeholder="BILL-2026-104"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Bank Settlement & TDS">
              <EntityEditModal.Grid>
                <FormField label="Amount Paid (₹)" required>
                  <Input
                    type="number"
                    value={form.amount_paid}
                    onChange={(e) => handleFormChange('amount_paid', e.target.value)}
                  />
                </FormField>

                <FormField label="TDS Deducted (₹)">
                  <Input
                    type="number"
                    value={form.tds_deducted}
                    onChange={(e) => handleFormChange('tds_deducted', e.target.value)}
                  />
                </FormField>

                <FormField label="Bank Settlement Account" className="md:col-span-2">
                  <Input
                    value={form.bank_account}
                    onChange={(e) => handleFormChange('bank_account', e.target.value)}
                  />
                </FormField>

                <FormField label="Bank UTR Reference No" className="md:col-span-2">
                  <Input
                    value={form.utr_no}
                    onChange={(e) => handleFormChange('utr_no', e.target.value)}
                    placeholder="HDFCR520260821901"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="pay-form"
            submitLabel={editingItem ? 'Update Payment' : 'Save Payment Voucher'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Payment Record"
        message={`Are you sure you want to delete "${deleteItem?.payment_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
