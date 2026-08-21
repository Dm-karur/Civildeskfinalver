import { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, AlertTriangle, ArrowUpDown
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
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const DEFAULT_ADJUSTMENTS = [
  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    adjustment_no: 'SAN-2026-015',
    adjustment_date: '2026-08-20',
    site_name: 'Main Central Godown Bay 1',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    uom: 'Bags',
    book_qty: 455,
    physical_qty: 450,
    variance_qty: -5,
    unit_rate: 385,
    variance_value: -1925,
    adjustment_type: 'Transit / Handling Burst Loss',
    auditor_name: 'Er. Suresh Babu (Audit Lead)',
    status: 'Approved & Reconciled',
    reason: 'Burst bag powder residue during unstacking.'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    adjustment_no: 'SAN-2026-016',
    adjustment_date: '2026-08-18',
    site_name: 'Main Steel Stacking Yard',
    material_code: 'MAT-STL-002',
    material_name: 'Fe 550D TMT Rebar 16mm',
    uom: 'MT',
    book_qty: 4.0,
    physical_qty: 4.2,
    variance_qty: 0.2,
    unit_rate: 58500,
    variance_value: 11700,
    adjustment_type: 'Physical Excess Reconciliation',
    auditor_name: 'Er. Suresh Babu (Audit Lead)',
    status: 'Approved & Reconciled',
    reason: 'Standard rolling tolerance length excess identified during physical caliper tally.'
  },
];

const EMPTY_FORM = {
  project_id: '',
  adjustment_no: '',
  adjustment_date: '',
  site_name: 'Main Central Godown Bay 1',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  uom: 'Bags',
  book_qty: '100',
  physical_qty: '98',
  variance_qty: '-2',
  unit_rate: '385',
  variance_value: '-770',
  adjustment_type: 'Handling Loss / Wastage',
  auditor_name: 'Audit Lead',
  reason: '',
};

export function StockAdjustmentsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);
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

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      adjustment_no: `SAN-2026-01${adjustments.length + 1}`,
      adjustment_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      adjustment_no: item.adjustment_no || '',
      adjustment_date: item.adjustment_date || '',
      site_name: item.site_name || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      uom: item.uom || 'Nos',
      book_qty: String(item.book_qty || '100'),
      physical_qty: String(item.physical_qty || '98'),
      variance_qty: String(item.variance_qty || '-2'),
      unit_rate: String(item.unit_rate || '385'),
      variance_value: String(item.variance_value || '-770'),
      adjustment_type: item.adjustment_type || 'Handling Loss',
      auditor_name: item.auditor_name || 'Audit Lead',
      reason: item.reason || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'book_qty' || field === 'physical_qty' || field === 'unit_rate') {
        const book = Number(field === 'book_qty' ? value : prev.book_qty) || 0;
        const phys = Number(field === 'physical_qty' ? value : prev.physical_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        const diff = Number((phys - book).toFixed(2));
        next.variance_qty = String(diff);
        next.variance_value = String(Math.round(diff * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.adjustment_no.trim()) errs.adjustment_no = 'SAN No is required';
    if (!form.material_name.trim()) errs.material_name = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const book = Number(form.book_qty || 0);
      const phys = Number(form.physical_qty || 0);
      const rate = Number(form.unit_rate || 0);
      const diff = Number((phys - book).toFixed(2));

      const newAdj = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        adjustment_no: form.adjustment_no,
        adjustment_date: form.adjustment_date,
        site_name: form.site_name,
        material_code: form.material_code,
        material_name: form.material_name,
        uom: form.uom,
        book_qty: book,
        physical_qty: phys,
        variance_qty: diff,
        unit_rate: rate,
        variance_value: Math.round(diff * rate),
        adjustment_type: form.adjustment_type,
        auditor_name: form.auditor_name,
        status: 'Approved & Reconciled',
        reason: form.reason,
      };

      if (editingItem?.id) {
        setAdjustments(prev => prev.map(a => a.id === editingItem.id ? newAdj : a));
        toast.success('Stock adjustment updated.');
      } else {
        setAdjustments(prev => [newAdj, ...prev]);
        toast.success('Stock adjustment note (SAN) reconciled.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save stock adjustment.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setAdjustments(prev => prev.filter(a => a.id !== deleteItem.id));
    toast.success('Stock adjustment removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return adjustments.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (a.adjustment_no || '').toLowerCase();
        const mat = (a.material_name || '').toLowerCase();
        const type = (a.adjustment_type || '').toLowerCase();
        const reas = (a.reason || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !type.includes(q) && !reas.includes(q)) return false;
      }
      return true;
    });
  }, [adjustments, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const netVarianceValue = useMemo(() => adjustments.reduce((acc, a) => acc + Number(a.variance_value || 0), 0), [adjustments]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Stock Adjustments' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Physical Stock Audit & Adjustment Notes (SAN)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Audited SANs"
            value={adjustments.length}
            status="primary"
            icon={<SlidersHorizontal className="w-4 h-4" />}
          />
          <KpiCard
            label="Net Reconciliation Value"
            value={`₹${Math.abs(netVarianceValue).toLocaleString('en-IN')}`}
            status={netVarianceValue < 0 ? 'warning' : 'success'}
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Physical Loss Tally"
            value="1 SAN"
            status="neutral"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Audit Status"
            value="100% Reconciled"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search SAN no, material, adjustment type..."
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
              title="Print Audit Register"
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
              New Adjustment (SAN)
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
                  <th className="px-3 py-2 w-28">SAN Ref</th>
                  <th className="px-3 py-2">Material Item & Store</th>
                  <th className="px-3 py-2 text-right w-24">Book Qty</th>
                  <th className="px-3 py-2 text-right w-24">Physical Qty</th>
                  <th className="px-3 py-2 text-right w-24">Variance (+/-)</th>
                  <th className="px-3 py-2 text-right w-28">Variance (₹)</th>
                  <th className="px-3 py-2 w-36 hidden md:table-cell">Adjustment Reason</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading stock adjustments...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No stock adjustment notes found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((a, idx) => (
                    <tr key={a.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {a.adjustment_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{a.adjustment_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={a.material_name}>
                            {a.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {a.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {a.book_qty} {a.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {a.physical_qty} {a.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[11px]">
                        <span className={a.variance_qty < 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {a.variance_qty > 0 ? `+${a.variance_qty}` : a.variance_qty} {a.uom}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-[11px]">
                        <span className={a.variance_value < 0 ? 'text-red-600' : 'text-emerald-600'}>
                          {a.variance_value > 0 ? `+₹${Math.abs(a.variance_value).toLocaleString('en-IN')}` : `-₹${Math.abs(a.variance_value).toLocaleString('en-IN')}`}
                        </span>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate" title={a.adjustment_type}>
                        {a.adjustment_type}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View SAN 360"
                            onClick={() => setViewingItem(a)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(a)}
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
          {paged.map((a, idx) => (
            <div key={a.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{a.adjustment_no} • {a.adjustment_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{a.adjustment_type}</span>
                </div>
                <Badge
                  variant={a.variance_qty < 0 ? 'warning' : 'success'}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {a.variance_qty > 0 ? `+${a.variance_qty}` : a.variance_qty} {a.uom}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Book vs Physical</span>
                  <span className="font-mono text-text-primary text-[11px]">{a.book_qty} ➔ {a.physical_qty} {a.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Variance Value</span>
                  <span className={`font-mono font-bold text-[12px] ${a.variance_value < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ₹{Math.abs(a.variance_value).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(a)}>
                  <Eye className="w-3 h-3 mr-1" /> View SAN
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

      {/* View SAN 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.adjustment_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.adjustment_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Book Stock Qty</span> <span className="font-mono text-text-primary">{viewingItem.book_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Physical Audit Count</span> <span className="font-mono font-bold text-primary">{viewingItem.physical_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Discrepancy Variance</span> <span className={`font-bold font-mono ${viewingItem.variance_qty < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{viewingItem.variance_qty > 0 ? `+${viewingItem.variance_qty}` : viewingItem.variance_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Reconciliation Value</span> <span className={`font-bold font-mono ${viewingItem.variance_value < 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹{Math.abs(viewingItem.variance_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Adjustment Reason</span> <span className="text-text-primary">{viewingItem.adjustment_type}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Auditor Sign-Off</span> <span className="text-text-primary">{viewingItem.auditor_name}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Audited Storage Bay</span> <span className="text-text-primary font-medium">{viewingItem.site_name}</span></div>
              </div>

              {viewingItem.reason && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Audit Remarks & Findings:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.reason}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print SAN Slip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit SAN Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={SlidersHorizontal}
          title={editingItem ? 'Edit Stock Adjustment' : 'Reconcile Physical Stock (SAN)'}
          subtitle="Log physical audit count variance against system book balance with justification."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="san-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Audit Location & Material">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="SAN Number" required error={errors.adjustment_no}>
                  <Input
                    value={form.adjustment_no}
                    onChange={(e) => handleFormChange('adjustment_no', e.target.value)}
                    placeholder="SAN-2026-018"
                  />
                </FormField>

                <FormField label="Material Item" required error={errors.material_name} className="md:col-span-2">
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement"
                  />
                </FormField>

                <FormField label="Storage Bay" className="md:col-span-2">
                  <Input
                    value={form.site_name}
                    onChange={(e) => handleFormChange('site_name', e.target.value)}
                    placeholder="e.g. Main Central Godown Bay 1"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Book Qty vs Physical Count Variance">
              <EntityEditModal.Grid>
                <FormField label="System Book Qty">
                  <Input
                    type="number"
                    value={form.book_qty}
                    onChange={(e) => handleFormChange('book_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Physical Audit Count">
                  <Input
                    type="number"
                    value={form.physical_qty}
                    onChange={(e) => handleFormChange('physical_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Calculated Variance">
                  <Input
                    readOnly
                    className="font-mono font-bold bg-surface-muted"
                    value={`${form.variance_qty} ${form.uom}`}
                  />
                </FormField>

                <FormField label="Unit Valuation Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Adjustment Reason Type" className="md:col-span-2">
                  <Select
                    options={[
                      { value: 'Handling Loss / Wastage', label: 'Handling Loss / Wastage' },
                      { value: 'Physical Excess Reconciliation', label: 'Physical Excess Reconciliation' },
                      { value: 'Moisture / Density Variation', label: 'Moisture / Density Variation' },
                      { value: 'Site Damage / Burst Loss', label: 'Site Damage / Burst Loss' },
                    ]}
                    value={form.adjustment_type}
                    onChange={(v) => handleFormChange('adjustment_type', v)}
                  />
                </FormField>

                <FormField label="Auditor Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Explain discrepancy cause and corrective storage measures..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="san-form"
            submitLabel={editingItem ? 'Update SAN' : 'Reconcile Stock'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Stock Adjustment"
        message={`Are you sure you want to delete "${deleteItem?.adjustment_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
