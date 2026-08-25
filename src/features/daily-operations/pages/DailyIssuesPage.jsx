import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, Wrench
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
  issue_no: '',
  date: '',
  category: 'Drawing RFI Clarification',
  severity: 'Medium',
  title: '',
  location: 'Level 2 Floor Deck',
  affected_activity: '',
  schedule_impact: 'No schedule delay',
  reported_by: 'Site Engineer',
  assigned_to: 'Project Manager',
  status: 'Open (Under Investigation)',
  notes: '',
};

export function DailyIssuesPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_daily-operations_DailyIssuesPage');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
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

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  
  useEffect(() => {
    localStorage.setItem('mock_daily-operations_DailyIssuesPage', JSON.stringify(issues));
  }, [issues]);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      issue_no: `ISS-2026-02${issues.length + 4}`,
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      issue_no: item.issue_no || '',
      date: item.date || '',
      category: item.category || 'Drawing RFI Clarification',
      severity: item.severity || 'Medium',
      title: item.title || '',
      location: item.location || '',
      affected_activity: item.affected_activity || '',
      schedule_impact: item.schedule_impact || '',
      reported_by: item.reported_by || 'Site Engineer',
      assigned_to: item.assigned_to || 'Project Manager',
      status: item.status || 'Open',
      notes: item.notes || item.resolution_notes || '',
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
    if (!form.issue_no.trim()) errs.issue_no = 'Issue No is required';
    if (!form.title.trim()) errs.title = 'Title / Description is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));

      const newIssue = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        issue_no: form.issue_no,
        date: form.date,
        category: form.category,
        severity: form.severity,
        title: form.title,
        location: form.location,
        affected_activity: form.affected_activity,
        schedule_impact: form.schedule_impact,
        reported_by: form.reported_by,
        assigned_to: form.assigned_to,
        status: form.status,
        resolution_notes: form.notes,
      };

      if (editingItem?.id) {
        setIssues(prev => prev.map(i => i.id === editingItem.id ? newIssue : i));
        toast.success('Site obstacle / issue updated.');
      } else {
        setIssues(prev => [newIssue, ...prev]);
        toast.success('Site issue logged into daily register.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save issue.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setIssues(prev => prev.filter(i => i.id !== deleteItem.id));
    toast.success('Issue removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return issues.filter(i => {
      if (selectedProjectId !== 'all' && String(i.project_id) !== String(selectedProjectId)) return false;
      if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && !i.status.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(i.issue_no || '').toLowerCase();
        const tit = String(i.title || '').toLowerCase();
        const cat = String(i.category || '').toLowerCase();
        const loc = String(i.location || '').toLowerCase();
        if (!no.includes(s) && !tit.includes(s) && !cat.includes(s) && !loc.includes(s)) return false;
      }
      return true;
    });
  }, [issues, selectedProjectId, severityFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const openCount = useMemo(() => issues.filter(i => !i.status.includes('Resolved') && !i.status.includes('Closed')).length, [issues]);
  const resolvedCount = useMemo(() => issues.filter(i => i.status.includes('Resolved') || i.status.includes('Closed')).length, [issues]);

  const getSeverityVariant = (sev) => {
    if (sev === 'Critical') return 'error';
    if (sev === 'High') return 'warning';
    return 'neutral';
  };

  const getStatusVariant = (st) => {
    if (st.includes('Resolved') || st.includes('Closed')) return 'success';
    if (st.includes('Resolution') || st.includes('Investigation')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Site Obstacles & Issues' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Site Obstacles, Delays & Quality Non-Conformances (NCR)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Logged Incidents"
            value={issues.length}
            status="primary"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <KpiCard
            label="Open Action Items"
            value={`${openCount} Pending`}
            status={openCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Resolved & Cleared"
            value={`${resolvedCount} Closed`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Safety Lost Time Injury (LTI)"
            value="0 Zero LTI"
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

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Severities' },
                  { value: 'Critical', label: 'Critical' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                ]}
                value={severityFilter}
                onChange={setSeverityFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Resolved', label: 'Resolved & Closed' },
                  { value: 'Resolution', label: 'Under Resolution' },
                  { value: 'Open', label: 'Open' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search issue no, title, location..."
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
              title="Print Issues Log"
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
              Log Site Obstacle
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
                  <th className="px-3 py-2 w-28">Issue Ref</th>
                  <th className="px-3 py-2">Issue Title & Category</th>
                  <th className="px-3 py-2 w-44 hidden md:table-cell">Location & Activity</th>
                  <th className="px-3 py-2 text-center w-24">Severity</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      Loading site obstacles...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                      No site issues found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((i, idx) => (
                    <tr key={i.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {i.issue_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{i.date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={i.title}>
                            {i.title}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {i.category} • {i.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] text-text-primary truncate" title={i.location}>
                            📍 {i.location}
                          </span>
                          <span className="text-[10px] text-text-muted truncate" title={i.affected_activity}>
                            {i.affected_activity}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getSeverityVariant(i.severity)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {i.severity}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(i.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {i.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Issue 360"
                            onClick={() => setViewingItem(i)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(i)}
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
          {paged.map((i, idx) => (
            <div key={i.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{i.issue_no} • {i.category}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{i.title}</h4>
                  <span className="text-[11px] text-text-muted">📍 {i.location}</span>
                </div>
                <Badge
                  variant={getSeverityVariant(i.severity)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {i.severity}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Schedule Delay</span>
                  <span className="font-mono text-[11px] text-red-600">{i.schedule_impact}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Status</span>
                  <span className="text-[11px] font-semibold text-emerald-600">{i.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(i)}>
                  <Eye className="w-3 h-3 mr-1" /> View CAPA
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

      {/* View Issue 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.issue_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.category} • {viewingItem.date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="bg-surface-muted/30 p-3 rounded-lg border border-border space-y-1">
                <span className="font-bold text-text-primary block text-sm">{viewingItem.title}</span>
                <span className="text-text-secondary block">📍 {viewingItem.location} (Activity: {viewingItem.affected_activity})</span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Severity Level</span> <span className="font-bold text-red-600">{viewingItem.severity}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Schedule Impact</span> <span className="text-text-primary font-medium">{viewingItem.schedule_impact}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Reported By</span> <span className="text-text-primary">{viewingItem.reported_by}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Resolver</span> <span className="text-text-primary">{viewingItem.assigned_to}</span></div>
              </div>

              {viewingItem.resolution_notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Corrective Action (CAPA) & Resolution:</span>
                  <p className="text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-200 leading-relaxed font-medium">{viewingItem.resolution_notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Issue Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={AlertTriangle}
          title={editingItem ? 'Edit Site Issue' : 'Log Site Obstacle / Incident'}
          subtitle="Record site delays, design RFIs, safety hazards, and track corrective action (CAPA)."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="issue-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Issue Classification & Severity">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Issue Reference Number" required error={errors.issue_no}>
                  <Input
                    value={form.issue_no}
                    onChange={(e) => handleFormChange('issue_no', e.target.value)}
                    placeholder="ISS-2026-030"
                  />
                </FormField>

                <FormField label="Category">
                  <Select
                    options={[
                      { value: 'Drawing RFI Clarification', label: 'Drawing RFI Clarification' },
                      { value: 'Safety Hazard (Near Miss)', label: 'Safety Hazard (Near Miss)' },
                      { value: 'Material Shortage Delay', label: 'Material Shortage Delay' },
                      { value: 'Quality Non-Conformance (NCR)', label: 'Quality Non-Conformance (NCR)' },
                      { value: 'Machinery Breakdown', label: 'Machinery Breakdown' },
                    ]}
                    value={form.category}
                    onChange={(v) => handleFormChange('category', v)}
                  />
                </FormField>

                <FormField label="Severity Level">
                  <Select
                    options={[
                      { value: 'Low', label: 'Low' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'High', label: 'High' },
                      { value: 'Critical', label: 'Critical' },
                    ]}
                    value={form.severity}
                    onChange={(v) => handleFormChange('severity', v)}
                  />
                </FormField>

                <FormField label="Issue Title / Summary" required error={errors.title} className="md:col-span-2">
                  <Input
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Beam-Column Junction Duct Opening Clash at Grid C4"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Impact & Corrective Actions">
              <EntityEditModal.Grid>
                <FormField label="Location / Grid">
                  <Input
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Level 2 Floor Deck Grid C4"
                  />
                </FormField>

                <FormField label="Affected Activity">
                  <Input
                    value={form.affected_activity}
                    onChange={(e) => handleFormChange('affected_activity', e.target.value)}
                    placeholder="e.g. Level 2 Slab Decking & Shuttering"
                  />
                </FormField>

                <FormField label="Schedule Delay Impact" className="md:col-span-2">
                  <Input
                    value={form.schedule_impact}
                    onChange={(e) => handleFormChange('schedule_impact', e.target.value)}
                    placeholder="e.g. Delay of 1 Shift until structural sketch released"
                  />
                </FormField>

                <FormField label="Corrective Action (CAPA) Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Action taken, consultant sketch reference, safety barricade installed..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="issue-form"
            submitLabel={editingItem ? 'Update Issue' : 'Log Site Issue'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Site Issue"
        message={`Are you sure you want to delete "${deleteItem?.issue_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
