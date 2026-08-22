import { useState, useEffect, useMemo } from 'react';
import {
  Layers, CheckCircle2, IndianRupee, Clock, AlertTriangle,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, Droplets
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



const EMPTY_FORM = {
  project_id: '',
  pour_no: '',
  date: '',
  material_name: 'M30 Grade Ready Mix Concrete',
  pour_element: 'Level 2 Floor Slab Casting',
  location: 'Tower Core 1',
  theoretical_qty: '40.0',
  actual_consumed_qty: '40.8',
  uom: 'm³',
  wastage_pct: '2.0',
  slump_test_mm: '120 mm',
  cubes_taken: '6 Cubes',
  pour_time: '10:00 AM - 04:00 PM',
  status: 'Within Permissible Tolerance (<3%)',
  qa_engineer: 'QA/QC Engineer',
  notes: '',
};

export function DailyMaterialsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [pours, setPours] = useState([]);
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
      pour_no: `POUR-2026-04${pours.length + 5}`,
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      pour_no: item.pour_no || '',
      date: item.date || '',
      material_name: item.material_name || '',
      pour_element: item.pour_element || '',
      location: item.location || '',
      theoretical_qty: String(item.theoretical_qty || '40.0'),
      actual_consumed_qty: String(item.actual_consumed_qty || '40.8'),
      uom: item.uom || 'm³',
      wastage_pct: String(item.wastage_pct || '2.0'),
      slump_test_mm: item.slump_test_mm || '',
      cubes_taken: item.cubes_taken || '',
      pour_time: item.pour_time || '',
      status: item.status || 'Within Permissible Tolerance (<3%)',
      qa_engineer: item.qa_engineer || '',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'theoretical_qty' || field === 'actual_consumed_qty') {
        const th = Number(field === 'theoretical_qty' ? value : prev.theoretical_qty) || 1;
        const ac = Number(field === 'actual_consumed_qty' ? value : prev.actual_consumed_qty) || 0;
        const waste = Number((((ac - th) / th) * 100).toFixed(1));
        next.wastage_pct = String(waste);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.pour_no.trim()) errs.pour_no = 'Pour slip no is required';
    if (!form.material_name.trim()) errs.material_name = 'Material is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const th = Number(form.theoretical_qty || 1);
      const ac = Number(form.actual_consumed_qty || 0);
      const waste = Number((((ac - th) / th) * 100).toFixed(1));

      const newPour = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        pour_no: form.pour_no,
        date: form.date,
        material_name: form.material_name,
        pour_element: form.pour_element,
        location: form.location,
        theoretical_qty: th,
        actual_consumed_qty: ac,
        uom: form.uom,
        wastage_pct: waste,
        slump_test_mm: form.slump_test_mm,
        cubes_taken: form.cubes_taken,
        pour_time: form.pour_time,
        status: waste > 4 ? 'Wastage Overrun Alert (>4%)' : 'Within Permissible Tolerance (<3%)',
        qa_engineer: form.qa_engineer,
        notes: form.notes,
      };

      if (editingItem?.id) {
        setPours(prev => prev.map(p => p.id === editingItem.id ? newPour : p));
        toast.success('Material pour slip updated.');
      } else {
        setPours(prev => [newPour, ...prev]);
        toast.success('Material consumption pour slip recorded.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save pour slip.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setPours(prev => prev.filter(p => p.id !== deleteItem.id));
    toast.success('Pour slip removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return pours.filter(p => {
      if (selectedProjectId !== 'all' && String(p.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(p.pour_no || '').toLowerCase();
        const mat = String(p.material_name || '').toLowerCase();
        const elem = String(p.pour_element || '').toLowerCase();
        const loc = String(p.location || '').toLowerCase();
        if (!no.includes(s) && !mat.includes(s) && !elem.includes(s) && !loc.includes(s)) return false;
      }
      return true;
    });
  }, [pours, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Material Consumption & Pours' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Daily Material Consumption & Pour Slips"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Pour Slips Logged"
            value={pours.length}
            status="primary"
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            label="Average Material Wastage"
            value="+1.76%"
            status="success"
            icon={<Droplets className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Permissible Tolerance Limit"
            value="< 3.0% OK"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="QC Cube Sampling"
            value="100% Sampled"
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search pour no, material, element..."
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
              title="Print Pour Register"
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
              Log Pour Slip
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
                  <th className="px-3 py-2 w-28">Pour Slip</th>
                  <th className="px-3 py-2">Material & Structural Element</th>
                  <th className="px-3 py-2 text-right w-24">Theoretical</th>
                  <th className="px-3 py-2 text-right w-24">Consumed</th>
                  <th className="px-3 py-2 text-center w-20">Wastage %</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Slump / QC</th>
                  <th className="px-3 py-2 text-center w-36">Tolerance</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material pour slips...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No material pour slips found.
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
                          {p.pour_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{p.date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={p.material_name}>
                            {p.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {p.pour_element} (📍 {p.location})
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {p.theoretical_qty} {p.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {p.actual_consumed_qty} {p.uom}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 text-[11px]">
                        +{p.wastage_pct}%
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell text-[10px] font-mono text-text-secondary">
                        {p.slump_test_mm}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          Tolerance OK
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Pour Slip 360"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{p.pour_no} • {p.date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{p.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{p.pour_element}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  +{p.wastage_pct}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Actual Consumed</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{p.actual_consumed_qty} {p.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Theoretical Norm</span>
                  <span className="font-mono text-[11px] text-text-secondary">{p.theoretical_qty} {p.uom}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(p)}>
                  <Eye className="w-3 h-3 mr-1" /> View Pour Slip
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

      {/* View Pour Slip 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.pour_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Actual Consumed Qty</span> <span className="font-bold text-primary font-mono text-base">{viewingItem.actual_consumed_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Theoretical Design Qty</span> <span className="font-mono">{viewingItem.theoretical_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Wastage Variance</span> <span className="font-mono font-bold text-emerald-600">+{viewingItem.wastage_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Slump Test Value</span> <span className="font-mono text-text-primary">{viewingItem.slump_test_mm}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Concrete Cubes Cast</span> <span className="font-mono">{viewingItem.cubes_taken}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">QA Engineer Verified</span> <span className="text-text-primary font-medium">{viewingItem.qa_engineer}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Structural Pour Element</span> <span className="text-text-primary font-medium">{viewingItem.pour_element} (📍 {viewingItem.location})</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">QA Batching & Pour Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Pour Card
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Pour Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Layers}
          title={editingItem ? 'Edit Pour Slip' : 'Log Daily Material Consumption Pour Slip'}
          subtitle="Record concrete pour batches, theoretical vs actual wastage %, and slump test readings."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="pour-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Pour Slip Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Pour Slip Number" required error={errors.pour_no}>
                  <Input
                    value={form.pour_no}
                    onChange={(e) => handleFormChange('pour_no', e.target.value)}
                    placeholder="POUR-2026-050"
                  />
                </FormField>

                <FormField label="Material Item" required error={errors.material_name} className="md:col-span-2">
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. M30 Grade Ready Mix Concrete"
                  />
                </FormField>

                <FormField label="Structural Element" className="md:col-span-2">
                  <Input
                    value={form.pour_element}
                    onChange={(e) => handleFormChange('pour_element', e.target.value)}
                    placeholder="e.g. Level 2 Floor Slab Casting / Grid C1-C8"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Quantities & QA Testing">
              <EntityEditModal.Grid>
                <FormField label="Theoretical Design Qty">
                  <Input
                    type="number"
                    value={form.theoretical_qty}
                    onChange={(e) => handleFormChange('theoretical_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Actual Consumed Qty">
                  <Input
                    type="number"
                    value={form.actual_consumed_qty}
                    onChange={(e) => handleFormChange('actual_consumed_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Slump Test (mm)">
                  <Input
                    value={form.slump_test_mm}
                    onChange={(e) => handleFormChange('slump_test_mm', e.target.value)}
                    placeholder="120 mm"
                  />
                </FormField>

                <FormField label="Concrete Cubes Cast">
                  <Input
                    value={form.cubes_taken}
                    onChange={(e) => handleFormChange('cubes_taken', e.target.value)}
                    placeholder="6 Cubes (Set A & B)"
                  />
                </FormField>

                <FormField label="Batching & Pour Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Transit mixer delivery ticket nos, temperature, admixture dosage..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="pour-form"
            submitLabel={editingItem ? 'Update Pour Slip' : 'Save Pour Slip'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Pour Slip"
        message={`Are you sure you want to delete "${deleteItem?.pour_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
