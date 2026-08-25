import { useState, useEffect, useMemo } from 'react';
import {
  Ruler, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, Calculator
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
  sheet_no: '',
  date: '',
  boq_item_ref: 'BOQ-CONC-003',
  item_description: 'RCC M30 Grade Column Casting',
  location: 'Level 2 Columns C1-C12',
  nos: '12',
  length: '0.60',
  breadth: '0.60',
  depth: '3.50',
  computed_qty: '15.12',
  uom: 'm³',
  measured_by: 'Site Engineer',
  verified_by: 'QA/QC Engineer',
  status: 'Verified by PMC',
  notes: '',
};

export function SiteMeasurementsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [measurements, setMeasurements] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_daily-operations_SiteMeasurementsPage');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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

  
  useEffect(() => {
    localStorage.setItem('mock_daily-operations_SiteMeasurementsPage', JSON.stringify(measurements));
  }, [measurements]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      sheet_no: `JMR-2026-08${measurements.length + 5}`,
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      sheet_no: item.sheet_no || '',
      date: item.date || '',
      boq_item_ref: item.boq_item_ref || '',
      item_description: item.item_description || '',
      location: item.location || '',
      nos: String(item.nos || '1'),
      length: String(item.length || '1.0'),
      breadth: String(item.breadth || '1.0'),
      depth: String(item.depth || '1.0'),
      computed_qty: String(item.computed_qty || '1.0'),
      uom: item.uom || 'm³',
      measured_by: item.measured_by || 'Site Engineer',
      verified_by: item.verified_by || 'QA/QC Engineer',
      status: item.status || 'Verified by PMC',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'nos' || field === 'length' || field === 'breadth' || field === 'depth') {
        const n = Number(field === 'nos' ? value : prev.nos) || 1;
        const l = Number(field === 'length' ? value : prev.length) || 1;
        const b = Number(field === 'breadth' ? value : prev.breadth) || 1;
        const d = Number(field === 'depth' ? value : prev.depth) || 1;
        next.computed_qty = String(Number((n * l * b * d).toFixed(3)));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.sheet_no.trim()) errs.sheet_no = 'JMR Sheet No is required';
    if (!form.item_description.trim()) errs.item_description = 'Work item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const n = Number(form.nos || 1);
      const l = Number(form.length || 1);
      const b = Number(form.breadth || 1);
      const d = Number(form.depth || 1);

      const newJMR = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        sheet_no: form.sheet_no,
        date: form.date,
        boq_item_ref: form.boq_item_ref,
        item_description: form.item_description,
        location: form.location,
        nos: n,
        length: l,
        breadth: b,
        depth: d,
        computed_qty: Number((n * l * b * d).toFixed(3)),
        uom: form.uom,
        measured_by: form.measured_by,
        verified_by: form.verified_by,
        status: form.status,
        notes: form.notes,
      };

      if (editingItem?.id) {
        setMeasurements(prev => prev.map(m => m.id === editingItem.id ? newJMR : m));
        toast.success('Measurement entry updated.');
      } else {
        setMeasurements(prev => [newJMR, ...prev]);
        toast.success('Joint measurement record (JMR) recorded.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save measurement sheet.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setMeasurements(prev => prev.filter(m => m.id !== deleteItem.id));
    toast.success('Measurement sheet removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return measurements.filter(m => {
      if (selectedProjectId !== 'all' && String(m.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(m.sheet_no || '').toLowerCase();
        const desc = String(m.item_description || '').toLowerCase();
        const boq = String(m.boq_item_ref || '').toLowerCase();
        const loc = String(m.location || '').toLowerCase();
        if (!no.includes(s) && !desc.includes(s) && !boq.includes(s) && !loc.includes(s)) return false;
      }
      return true;
    });
  }, [measurements, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStatusVariant = (status) => {
    if (status.includes('Certified') || status.includes('Verified')) return 'success';
    if (status.includes('Draft')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Site Measurements (JMR)' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Joint Measurement Records (JMR) & MB Book"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total JMR Sheets Recorded"
            value={measurements.length}
            status="primary"
            icon={<Ruler className="w-4 h-4" />}
          />
          <KpiCard
            label="PMC Verified Records"
            value="2 Records"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Certified for RA Billing"
            value="1 Item Ready"
            status="neutral"
            icon={<Calculator className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Measurement Accuracy"
            value="100% Calibrated"
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
                placeholder="Search sheet no, item, BOQ ref..."
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
              title="Print Measurement Book"
            >
              Print MB Book
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Record JMR Entry
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
                  <th className="px-3 py-2 w-28">JMR Sheet</th>
                  <th className="px-3 py-2">Item Description & Location</th>
                  <th className="px-3 py-2 w-32 hidden md:table-cell">L × B × D</th>
                  <th className="px-3 py-2 text-right w-24">Nos</th>
                  <th className="px-3 py-2 text-right w-28">Computed Qty</th>
                  <th className="px-3 py-2 text-center w-36">Verification</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading measurement records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No measurement records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {m.sheet_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{m.date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={m.item_description}>
                            {m.item_description}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {m.location} ({m.boq_item_ref})
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {m.length}m × {m.breadth}m × {m.depth}m
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        {m.nos}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 text-[11px]">
                        {m.computed_qty} {m.uom}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(m.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {m.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View JMR 360"
                            onClick={() => setViewingItem(m)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(m)}
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
          {paged.map((m, idx) => (
            <div key={m.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{m.sheet_no} • {m.date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{m.item_description}</h4>
                  <span className="text-[11px] text-text-muted">{m.location}</span>
                </div>
                <Badge
                  variant={getStatusVariant(m.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {m.computed_qty} {m.uom}
                </Badge>
              </div>

              <div className="p-2 bg-surface-muted/40 rounded border border-border/60 font-mono text-[11px] flex justify-between">
                <span>Dimensions: {m.nos} × ({m.length} × {m.breadth} × {m.depth})</span>
                <span className="font-bold text-emerald-600">{m.computed_qty} {m.uom}</span>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(m)}>
                  <Eye className="w-3 h-3 mr-1" /> View JMR Entry
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

      {/* View JMR 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.sheet_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.item_description}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Computed Physical Quantity</span> <span className="font-bold text-emerald-600 font-mono text-base">{viewingItem.computed_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Dimension Formula</span> <span className="font-mono">{viewingItem.nos} Nos × {viewingItem.length}m × {viewingItem.breadth}m × {viewingItem.depth}m</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">BOQ Item Reference</span> <span className="font-mono text-primary font-bold">{viewingItem.boq_item_ref}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Joint Verification</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Measured By</span> <span className="text-text-primary">{viewingItem.measured_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Verified By (PMC)</span> <span className="text-text-primary">{viewingItem.verified_by}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Location & Grid</span> <span className="text-text-primary font-medium">{viewingItem.location}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Measurement Log Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50 leading-relaxed">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print JMR Certificate
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit JMR Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Ruler}
          title={editingItem ? 'Edit Measurement Sheet' : 'Record Joint Measurement Entry (JMR)'}
          subtitle="Record physical site dimensions (L × B × D) verified jointly with PMC/client."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="jmr-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Work Item & Location">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="JMR Sheet Number" required error={errors.sheet_no}>
                  <Input
                    value={form.sheet_no}
                    onChange={(e) => handleFormChange('sheet_no', e.target.value)}
                    placeholder="JMR-2026-088"
                  />
                </FormField>

                <FormField label="BOQ Item Reference">
                  <Input
                    value={form.boq_item_ref}
                    onChange={(e) => handleFormChange('boq_item_ref', e.target.value)}
                    placeholder="BOQ-CONC-003"
                  />
                </FormField>

                <FormField label="Work Item Description" required error={errors.item_description}>
                  <Input
                    value={form.item_description}
                    onChange={(e) => handleFormChange('item_description', e.target.value)}
                    placeholder="e.g. RCC M30 Grade Column Casting"
                  />
                </FormField>

                <FormField label="Location / Grid" className="md:col-span-2">
                  <Input
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Level 2 Columns C1-C12"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Physical Dimensions (L × B × D)">
              <EntityEditModal.Grid>
                <FormField label="Number of Units (Nos)">
                  <Input
                    type="number"
                    value={form.nos}
                    onChange={(e) => handleFormChange('nos', e.target.value)}
                  />
                </FormField>

                <FormField label="Length (m)">
                  <Input
                    type="number"
                    value={form.length}
                    onChange={(e) => handleFormChange('length', e.target.value)}
                  />
                </FormField>

                <FormField label="Breadth / Width (m)">
                  <Input
                    type="number"
                    value={form.breadth}
                    onChange={(e) => handleFormChange('breadth', e.target.value)}
                  />
                </FormField>

                <FormField label="Depth / Height (m)">
                  <Input
                    type="number"
                    value={form.depth}
                    onChange={(e) => handleFormChange('depth', e.target.value)}
                  />
                </FormField>

                <FormField label="Computed Quantity" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`${form.computed_qty} ${form.uom}`}
                  />
                </FormField>

                <FormField label="Verification Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Tape reading references, joint witness signatures..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="jmr-form"
            submitLabel={editingItem ? 'Update JMR' : 'Record Measurement'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Measurement Sheet"
        message={`Are you sure you want to delete "${deleteItem?.sheet_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
