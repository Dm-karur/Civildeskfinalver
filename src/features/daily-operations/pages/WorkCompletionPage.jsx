import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Layers, Target,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Printer, TrendingUp
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
  date: '',
  activity_code: 'ACT-STR-015',
  activity_name: 'Level 2 Floor Slab Casting',
  location: 'Grid C1-C8',
  uom: 'm³',
  planned_qty_today: '20.0',
  achieved_qty_today: '19.5',
  cumulative_achieved: '160.0',
  total_scope_qty: '200.0',
  completion_pct: '80.0',
  status: 'Completed for Today',
  foreman: 'Concrete Foreman',
  notes: '',
};

export function WorkCompletionPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
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

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_daily-operations_WorkCompletionPage');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('mock_daily-operations_WorkCompletionPage', JSON.stringify(activities));
  }, [activities]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      date: item.date || '',
      activity_code: item.activity_code || '',
      activity_name: item.activity_name || '',
      location: item.location || '',
      uom: item.uom || 'm³',
      planned_qty_today: String(item.planned_qty_today || '20'),
      achieved_qty_today: String(item.achieved_qty_today || '19.5'),
      cumulative_achieved: String(item.cumulative_achieved || '160'),
      total_scope_qty: String(item.total_scope_qty || '200'),
      completion_pct: String(item.completion_pct || '80'),
      status: item.status || 'Completed for Today',
      foreman: item.foreman || '',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'cumulative_achieved' || field === 'total_scope_qty') {
        const cum = Number(field === 'cumulative_achieved' ? value : prev.cumulative_achieved) || 0;
        const tot = Number(field === 'total_scope_qty' ? value : prev.total_scope_qty) || 1;
        next.completion_pct = String(Number(((cum / tot) * 100).toFixed(1)));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.activity_name.trim()) errs.activity_name = 'Activity name is required';
    if (!form.location.trim()) errs.location = 'Location is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const cum = Number(form.cumulative_achieved || 0);
      const tot = Number(form.total_scope_qty || 1);

      const newAct = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        date: form.date,
        activity_code: form.activity_code,
        activity_name: form.activity_name,
        location: form.location,
        uom: form.uom,
        planned_qty_today: Number(form.planned_qty_today || 0),
        achieved_qty_today: Number(form.achieved_qty_today || 0),
        cumulative_achieved: cum,
        total_scope_qty: tot,
        completion_pct: Number(((cum / tot) * 100).toFixed(1)),
        status: form.status,
        foreman: form.foreman,
        notes: form.notes,
      };

      if (editingItem?.id) {
        setActivities(prev => prev.map(a => a.id === editingItem.id ? newAct : a));
        toast.success('Work activity output updated.');
      } else {
        setActivities(prev => [newAct, ...prev]);
        toast.success('Daily activity progress logged.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save activity progress.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setActivities(prev => prev.filter(a => a.id !== deleteItem.id));
    toast.success('Activity log removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return activities.filter(a => {
      if (selectedProjectId !== 'all' && String(a.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const code = String(a.activity_code || '').toLowerCase();
        const name = String(a.activity_name || '').toLowerCase();
        const loc = String(a.location || '').toLowerCase();
        const formn = String(a.foreman || '').toLowerCase();
        if (!code.includes(s) && !name.includes(s) && !loc.includes(s) && !formn.includes(s)) return false;
      }
      return true;
    });
  }, [activities, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Work Progress & Completion' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Work Activity Progress & Milestone Completion"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Monitored Activities Today"
            value={activities.length}
            status="primary"
            icon={<Target className="w-4 h-4" />}
          />
          <KpiCard
            label="Average Scope Completed"
            value="67.8%"
            status="success"
            icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Schedule Variance"
            value="+4.2% Ahead"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Foreman Sign-offs"
            value="100% Signed"
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
                placeholder="Search activity code, name, location..."
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
              title="Print Work Register"
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
              Log Work Completion
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
                  <th className="px-3 py-2 w-28">Activity Code</th>
                  <th className="px-3 py-2">Activity Description & Location</th>
                  <th className="px-3 py-2 text-right w-24">Target Today</th>
                  <th className="px-3 py-2 text-right w-24">Achieved</th>
                  <th className="px-3 py-2 text-right w-28">Cumulative</th>
                  <th className="px-3 py-2 text-center w-24">Progress %</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Foreman</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading work completion records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No work activity records found.
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
                          {a.activity_code}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{a.date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={a.activity_name}>
                            {a.activity_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            📍 {a.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-secondary">
                        {a.planned_qty_today} {a.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {a.achieved_qty_today} {a.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        {a.cumulative_achieved} / {a.total_scope_qty} {a.uom}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 text-[11px]">
                        {a.completion_pct}%
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell text-[11px] text-text-secondary truncate">
                        {a.foreman}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Activity 360"
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{a.activity_code} • {a.date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{a.activity_name}</h4>
                  <span className="text-[11px] text-text-muted">📍 {a.location}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {a.completion_pct}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Today's Output</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{a.achieved_qty_today} / {a.planned_qty_today} {a.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Cumulative Scope</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">{a.cumulative_achieved} {a.uom}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(a)}>
                  <Eye className="w-3 h-3 mr-1" /> View Activity
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

      {/* View Activity 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.activity_code}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.activity_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Today Achieved Output</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.achieved_qty_today} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Planned Target Today</span> <span className="font-mono">{viewingItem.planned_qty_today} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Cumulative Output</span> <span className="font-mono font-bold text-emerald-600 text-sm">{viewingItem.cumulative_achieved} / {viewingItem.total_scope_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Scope Completed</span> <span className="font-bold text-emerald-600 font-mono text-sm">{viewingItem.completion_pct}%</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Foreman</span> <span className="text-text-primary font-medium">{viewingItem.foreman}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Activity Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Grid / Work Location</span> <span className="text-text-primary font-medium">{viewingItem.location}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Execution Details & Deficit Justifications:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Completion Card
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Target}
          title={editingItem ? 'Edit Activity Output' : 'Log Daily Activity Progress'}
          subtitle="Record planned vs achieved physical output and cumulative milestone progress."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="act-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Activity Identification">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Activity Code">
                  <Input
                    value={form.activity_code}
                    onChange={(e) => handleFormChange('activity_code', e.target.value)}
                    placeholder="ACT-STR-018"
                  />
                </FormField>

                <FormField label="Activity Description" required error={errors.activity_name} className="md:col-span-2">
                  <Input
                    value={form.activity_name}
                    onChange={(e) => handleFormChange('activity_name', e.target.value)}
                    placeholder="e.g. Level 2 Column Shuttering & Casting"
                  />
                </FormField>

                <FormField label="Work Grid / Location" required error={errors.location} className="md:col-span-2">
                  <Input
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Core 1 Grid C1-C6"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Quantities & Progress Outputs">
              <EntityEditModal.Grid>
                <FormField label="Planned Output Today">
                  <Input
                    type="number"
                    value={form.planned_qty_today}
                    onChange={(e) => handleFormChange('planned_qty_today', e.target.value)}
                  />
                </FormField>

                <FormField label="Achieved Output Today">
                  <Input
                    type="number"
                    value={form.achieved_qty_today}
                    onChange={(e) => handleFormChange('achieved_qty_today', e.target.value)}
                  />
                </FormField>

                <FormField label="Cumulative Total Achieved">
                  <Input
                    type="number"
                    value={form.cumulative_achieved}
                    onChange={(e) => handleFormChange('cumulative_achieved', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Scope Quantity">
                  <Input
                    type="number"
                    value={form.total_scope_qty}
                    onChange={(e) => handleFormChange('total_scope_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Foreman Incharge">
                  <Input
                    value={form.foreman}
                    onChange={(e) => handleFormChange('foreman', e.target.value)}
                    placeholder="e.g. M. Selvam"
                  />
                </FormField>

                <FormField label="Execution Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Equipment breakdown delays, weather impact, rework notes..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="act-form"
            submitLabel={editingItem ? 'Update Output' : 'Save Activity Progress'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Activity Log"
        message={`Are you sure you want to delete "${deleteItem?.activity_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
