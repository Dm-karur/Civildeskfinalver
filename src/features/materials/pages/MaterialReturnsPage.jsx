import { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, AlertTriangle
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

/* 
const DEFAULT_RETURNS = [

  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    return_no: 'RTN-2026-021',
    return_date: '2026-08-20',
    return_type: 'Site Surplus Return',
    site_name: 'Tower A Core - Level 2',
    contractor_name: 'Sri Murugan Labour Services',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    returned_qty: 30,
    uom: 'Bags',
    unit_rate: 385,
    return_value: 11550,
    condition: 'Good (Unopened Bags)',
    status: 'Stock Restocked & Credited',
    reason: 'Surplus cement bags returned to central godown after slab casting.'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    return_no: 'RTN-2026-022',
    return_date: '2026-08-19',
    return_type: 'Defective Supplier Return',
    site_name: 'Main Central Yard',
    contractor_name: 'UltraTech Cement Distributors Ltd',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    returned_qty: 15,
    uom: 'Bags',
    unit_rate: 385,
    return_value: 5775,
    condition: 'Torn / Moisture Damaged',
    status: 'Supplier Credit Note Raised',
    reason: 'Transit rain damaged bags rejected during inward QC inspection.'
  },
];
*/

const EMPTY_FORM = {
  project_id: '',
  return_no: '',
  return_date: '',
  return_type: 'Site Surplus Return',
  site_name: 'Site Yard',
  contractor_name: '',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  returned_qty: '10',
  uom: 'Bags',
  unit_rate: '385',
  return_value: '3850',
  condition: 'Good (Unopened Bags)',
  reason: '',
};

export function MaterialReturnsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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
      return_no: `RTN-2026-02${returns.length + 1}`,
      return_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      return_no: item.return_no || '',
      return_date: item.return_date || '',
      return_type: item.return_type || 'Site Surplus Return',
      site_name: item.site_name || '',
      contractor_name: item.contractor_name || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      returned_qty: String(item.returned_qty || '10'),
      uom: item.uom || 'Nos',
      unit_rate: String(item.unit_rate || '385'),
      return_value: String(item.return_value || '3850'),
      condition: item.condition || 'Good (Unopened Bags)',
      reason: item.reason || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'returned_qty' || field === 'unit_rate') {
        const qty = Number(field === 'returned_qty' ? value : prev.returned_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        next.return_value = String(Math.round(qty * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.return_no.trim()) errs.return_no = 'Return No is required';
    if (!form.material_name.trim()) errs.material_name = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const qty = Number(form.returned_qty || 0);
      const rate = Number(form.unit_rate || 0);

      const newReturn = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        return_no: form.return_no,
        return_date: form.return_date,
        return_type: form.return_type,
        site_name: form.site_name,
        contractor_name: form.contractor_name,
        material_code: form.material_code,
        material_name: form.material_name,
        returned_qty: qty,
        uom: form.uom,
        unit_rate: rate,
        return_value: Number(form.return_value || qty * rate),
        condition: form.condition,
        status: 'Stock Restocked & Credited',
        reason: form.reason,
      };

      if (editingItem?.id) {
        setReturns(prev => prev.map(r => r.id === editingItem.id ? newReturn : r));
        toast.success('Material return updated.');
      } else {
        setReturns(prev => [newReturn, ...prev]);
        toast.success('Material return logged and inventory credited.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save material return.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setReturns(prev => prev.filter(r => r.id !== deleteItem.id));
    toast.success('Material return removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return returns.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (typeFilter !== 'all' && r.return_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (r.return_no || '').toLowerCase();
        const mat = (r.material_name || '').toLowerCase();
        const party = (r.contractor_name || '').toLowerCase();
        const reas = (r.reason || '').toLowerCase();
        if (!no.includes(q) && !mat.includes(q) && !party.includes(q) && !reas.includes(q)) return false;
      }
      return true;
    });
  }, [returns, selectedProjectId, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalReturnValue = useMemo(() => returns.reduce((acc, r) => acc + Number(r.return_value || 0), 0), [returns]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Material Returns' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Returns & Credit Notes"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Return Slips"
            value={returns.length}
            status="primary"
            icon={<RotateCcw className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Credited Value"
            value={`₹${totalReturnValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Site Surplus Restocked"
            value="1 Return"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Supplier Defective Returns"
            value="1 Return"
            status="neutral"
            icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Return Types' },
                  { value: 'Site Surplus Return', label: 'Site Surplus Return' },
                  { value: 'Defective Supplier Return', label: 'Defective Supplier Return' },
                ]}
                value={typeFilter}
                onChange={setTypeFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search return no, material, party..."
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
              title="Print Return Register"
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
              Log Material Return
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
                  <th className="px-3 py-2 w-28">Return Ref</th>
                  <th className="px-3 py-2">Return Type & Party</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-right w-24">Return Qty</th>
                  <th className="px-3 py-2 text-right w-28">Credit Value</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">Condition</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material returns...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No material return slips found matching criteria.
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
                          {r.return_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.return_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.return_type}>
                            {r.return_type}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.contractor_name || r.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={r.material_name}>
                          {r.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {r.returned_qty} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        ₹{Number(r.return_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-text-secondary text-[11px] truncate" title={r.condition}>
                        {r.condition}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Credited
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Return 360"
                            onClick={() => setViewingItem(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(r)}
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
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.return_no} • {r.return_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.return_type}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  Credited
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Return Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.returned_qty} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Credit Value</span>
                  <span className="font-mono font-bold text-emerald-600 text-[12px]">₹{Number(r.return_value).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{r.condition}</span>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View Return
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

      {/* View Return 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.return_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.return_type}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Returned Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.returned_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Credited Amount</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.return_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Return Date</span> <span className="font-mono">{viewingItem.return_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Material Condition</span> <span className="font-semibold text-text-primary">{viewingItem.condition}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Source Party / Site</span> <span className="text-text-primary font-medium">{viewingItem.contractor_name || viewingItem.site_name}</span></div>
              </div>

              {viewingItem.reason && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Return Reason & Inspection Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.reason}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Return Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={RotateCcw}
          title={editingItem ? 'Edit Material Return' : 'Log Material Return (Credit Note)'}
          subtitle="Record surplus site return back to godown or defective lot return to supplier."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="rtn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Return Type & Location">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Return Note Number" required error={errors.return_no}>
                  <Input
                    value={form.return_no}
                    onChange={(e) => handleFormChange('return_no', e.target.value)}
                    placeholder="RTN-2026-025"
                  />
                </FormField>

                <FormField label="Return Type" required>
                  <Select
                    options={[
                      { value: 'Site Surplus Return', label: 'Site Surplus Return (Restock to Yard)' },
                      { value: 'Defective Supplier Return', label: 'Defective Supplier Return (Vendor Credit)' },
                    ]}
                    value={form.return_type}
                    onChange={(v) => handleFormChange('return_type', v)}
                  />
                </FormField>

                <FormField label="Party / Subcontractor / Supplier">
                  <Input
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                    placeholder="e.g. Sri Murugan Labour Services"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Return Quantities">
              <EntityEditModal.Grid>
                <FormField label="Material Item" required error={errors.material_name}>
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement"
                  />
                </FormField>

                <FormField label="Returned Quantity">
                  <Input
                    type="number"
                    value={form.returned_qty}
                    onChange={(e) => handleFormChange('returned_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Credited Value (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.return_value).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Material Condition" className="md:col-span-2">
                  <Input
                    value={form.condition}
                    onChange={(e) => handleFormChange('condition', e.target.value)}
                    placeholder="e.g. Good Unopened / Rain Damaged / Scrap Offcut"
                  />
                </FormField>

                <FormField label="Return Reason & Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.reason}
                    onChange={(e) => handleFormChange('reason', e.target.value)}
                    placeholder="Surplus left over after concrete pour..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="rtn-form"
            submitLabel={editingItem ? 'Update Return' : 'Log Return'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Material Return"
        message={`Are you sure you want to delete "${deleteItem?.return_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
