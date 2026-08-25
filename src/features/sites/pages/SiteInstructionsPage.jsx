import { useState, useEffect, useMemo } from 'react';
import {
  FileWarning, AlertTriangle, CheckCircle2, Clock, Plus, Edit,
  Trash2, Search, Filter, ShieldAlert, FileText, User, Calendar,
  Building2, MapPin, CheckSquare, Eye, Send
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
import { sitesApi, projectsApi, request } from '../../../api/apiservice';

const INSTRUCTION_CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'structural', name: 'Structural & Concrete Execution' },
  { id: 'safety', name: 'Safety & HSE Corrective Action' },
  { id: 'quality', name: 'QA/QC Inspection & Snagging' },
  { id: 'variation', name: 'Client & Design Change Order' },
  { id: 'material', name: 'Material Rejection / Rework' },
];



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  location_name: '',
  instruction_code: '',
  subject: '',
  category_id: 'structural',
  priority: 'High',
  issued_by: '',
  issued_to: '',
  issue_date: '',
  due_date: '',
  status: 'Open',
  directive_text: '',
  compliance_notes: '',
};

export function SiteInstructionsPage() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(null);
  const [viewingInstruction, setViewingInstruction] = useState(null);
  const [deleteInstruction, setDeleteInstruction] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchInstructions = async () => {
    setLoading(true);
    try {
      const res = await request.get('/site-instructions');
      setInstructions(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (error) {
      // Ignore if it fails (e.g. 404 because backend is missing)
    } finally {
      setLoading(false);
    }
  };

  // Load Projects & Sites
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      sitesApi.list().catch(() => ({ data: { sites: [] } })),
    ]).then(([pRes, sRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const sList = sRes?.data?.sites ?? sRes?.sites ?? (Array.isArray(sRes?.data) ? sRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      setSites(Array.isArray(sList) ? sList : []);
    });
    
    fetchInstructions();
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');
    const availableSites = sites.filter(s => String(s.project_id) === String(defaultProj));
    const defaultSite = selectedSiteId !== 'all' ? selectedSiteId : (availableSites[0]?.id ? String(availableSites[0].id) : (sites[0]?.id ? String(sites[0].id) : '1'));

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      site_id: defaultSite,
      instruction_code: `SI-2026-00${instructions.length + 1}`,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      issued_by: 'Site Incharge Engineer',
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (si) => {
    setForm({
      project_id: String(si.project_id || '1'),
      site_id: String(si.site_id || '1'),
      location_name: si.location_name || '',
      instruction_code: si.instruction_code || '',
      subject: si.subject || '',
      category_id: si.category_id || 'structural',
      priority: si.priority || 'High',
      issued_by: si.issued_by || '',
      issued_to: si.issued_to || '',
      issue_date: si.issue_date ? si.issue_date.split(' ')[0] : '',
      due_date: si.due_date ? si.due_date.split(' ')[0] : '',
      status: si.status || 'Open',
      directive_text: si.directive_text || '',
      compliance_notes: si.compliance_notes || '',
    });
    setErrors({});
    setEditingInstruction(si);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.instruction_code.trim()) errs.instruction_code = 'SI Code is required';
    if (!form.directive_text.trim()) errs.directive_text = 'Directive instructions are required';
    if (!form.site_id) errs.site_id = 'Site is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const selectedSite = sites.find(s => String(s.id) === String(form.site_id));
      const catObj = INSTRUCTION_CATEGORIES.find(c => c.id === form.category_id);

      const newSI = {
        id: editingInstruction?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        site_id: Number(form.site_id || 1),
        site_name: selectedSite?.site_name || 'Main Job Site',
        location_name: form.location_name || 'General Site Area',
        instruction_code: form.instruction_code,
        subject: form.subject,
        category_id: form.category_id,
        category_name: catObj?.name || 'General Directive',
        priority: form.priority,
        issued_by: form.issued_by,
        issued_to: form.issued_to,
        issue_date: form.issue_date,
        due_date: form.due_date,
        status: form.status,
        directive_text: form.directive_text,
        compliance_notes: form.compliance_notes,
      };

      if (editingInstruction?.id) {
        await request.patch(`/site-instructions/${editingInstruction.id}`, newSI);
        toast.success('Site instruction updated.');
      } else {
        await request.post('/site-instructions', newSI);
        toast.success('Site instruction issued successfully.');
      }

      fetchInstructions();
      setIsAddOpen(false);
      setEditingInstruction(null);
    } catch {
      toast.error('Failed to save site instruction.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteInstruction?.id) return;
    try {
      await request.delete(`/site-instructions/${deleteInstruction.id}`);
      toast.success('Instruction deleted.');
      fetchInstructions();
    } catch (error) {
      toast.error('Failed to delete instruction.');
    } finally {
      setDeleteInstruction(null);
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return instructions.filter(si => {
      if (selectedProjectId !== 'all' && String(si.project_id) !== String(selectedProjectId)) return false;
      if (selectedSiteId !== 'all' && String(si.site_id) !== String(selectedSiteId)) return false;
      if (categoryFilter !== 'all' && si.category_id !== categoryFilter) return false;
      if (priorityFilter !== 'all' && si.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && si.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const code = (si.instruction_code || '').toLowerCase();
        const sub = (si.subject || '').toLowerCase();
        const by = (si.issued_by || '').toLowerCase();
        const to = (si.issued_to || '').toLowerCase();
        const text = (si.directive_text || '').toLowerCase();
        if (!code.includes(q) && !sub.includes(q) && !by.includes(q) && !to.includes(q) && !text.includes(q)) return false;
      }
      return true;
    });
  }, [instructions, selectedProjectId, selectedSiteId, categoryFilter, priorityFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const openCount = useMemo(() => instructions.filter(i => i.status === 'Open' || i.status === 'In Progress').length, [instructions]);
  const criticalCount = useMemo(() => instructions.filter(i => i.priority === 'Critical').length, [instructions]);
  const closedCount = useMemo(() => instructions.filter(i => i.status.includes('Complied') || i.status.includes('Closed')).length, [instructions]);

  const getPriorityVariant = (priority) => {
    const p = String(priority || '').toLowerCase();
    if (p.includes('critical')) return 'error';
    if (p.includes('high')) return 'warning';
    if (p.includes('medium')) return 'info';
    return 'neutral';
  };

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('complied') || s.includes('closed')) return 'success';
    if (s.includes('progress')) return 'info';
    if (s.includes('open')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sites & Locations', href: '/sites' },
    { label: 'Site Instructions' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Site Instructions & Directives"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Site Instructions"
            value={instructions.length}
            status="primary"
            icon={<FileWarning className="w-4 h-4" />}
          />
          <KpiCard
            label="Open / Pending Actions"
            value={openCount}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Critical Directives"
            value={criticalCount}
            status="error"
            icon={<ShieldAlert className="w-4 h-4 text-red-500" />}
          />
          <KpiCard
            label="Complied & Verified"
            value={closedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
        </div>

        {/* Filter and Project/Site Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedSiteId('all');
                }}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Sites' },
                  ...sites
                    .filter(s => selectedProjectId === 'all' || String(s.project_id) === String(selectedProjectId))
                    .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))
                ]}
                value={selectedSiteId}
                onChange={setSelectedSiteId}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'Critical', label: 'Critical' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
                value={priorityFilter}
                onChange={setPriorityFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-48">
              <SearchField
                placeholder="Search SI code, subject, party..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Issue Instruction
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {INSTRUCTION_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all text-[11px] sm:text-xs ${
                categoryFilter === cat.id
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'bg-surface text-text-secondary border border-border hover:bg-surface-muted'
              }`}
            >
              {cat.name}
            </button>
          ))}
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
                  <th className="px-3 py-2">SI Code & Subject</th>
                  <th className="px-3 py-2 hidden md:table-cell">Site Location</th>
                  <th className="px-3 py-2 text-center w-24">Priority</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Issued By ➔ To</th>
                  <th className="px-3 py-2 hidden md:table-cell">Due Date</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading site instructions...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No site instructions found in this selection.
                    </td>
                  </tr>
                ) : (
                  paged.map((si, idx) => {
                    const isOverdue = si.status === 'Open' && si.due_date && new Date(si.due_date) < new Date();

                    return (
                      <tr key={si.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                        <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                          {(page - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {si.instruction_code}
                              </span>
                              <span className="font-semibold text-text-primary text-[12px] truncate" title={si.subject}>
                                {si.subject}
                              </span>
                            </div>
                            <span className="text-[10px] text-text-muted mt-0.5">
                              {si.category_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <div className="flex flex-col min-w-0">
                            <span className="text-text-primary text-[11px] font-medium truncate" title={si.site_name}>
                              {si.site_name}
                            </span>
                            <span className="text-[10px] text-text-muted truncate">
                              {si.location_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getPriorityVariant(si.priority)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {si.priority}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell">
                          <div className="flex flex-col text-[11px]">
                            <span className="text-text-primary truncate font-medium">{si.issued_by}</span>
                            <span className="text-[10px] text-text-muted truncate">To: {si.issued_to}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell font-mono text-[11px]">
                          <span className={isOverdue ? 'text-red-600 font-bold' : 'text-text-secondary'}>
                            {si.due_date || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge
                            variant={getStatusVariant(si.status)}
                            className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                          >
                            {si.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="View Full Instruction & Verification"
                              onClick={() => setViewingInstruction(si)}
                            >
                              <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Instruction"
                              onClick={() => handleOpenEdit(si)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeleteInstruction(si)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              Loading site instructions...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No site instructions found.
            </div>
          ) : (
            paged.map((si, idx) => (
              <div key={si.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {si.instruction_code}
                      </span>
                      <Badge variant={getPriorityVariant(si.priority)} className="text-[8px] h-3.5">
                        {si.priority}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{si.subject}</h4>
                  </div>
                  <Badge
                    variant={getStatusVariant(si.status)}
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                  >
                    {si.status}
                  </Badge>
                </div>

                <div className="text-xs pt-1 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Location</span>
                  <span className="font-medium text-text-primary text-[11px] truncate block">{si.site_name} • {si.location_name}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="text-[10px] text-text-muted font-mono">Due: {si.due_date || '—'}</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingInstruction(si)}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(si)}>
                      <Edit className="w-3.5 h-3.5 text-text-secondary" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}

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

      {/* View Instruction Modal */}
      {viewingInstruction && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileWarning className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingInstruction.subject}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingInstruction.instruction_code} • {viewingInstruction.category_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingInstruction(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Priority</span> <span className="font-bold text-red-600">{viewingInstruction.priority}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingInstruction.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Issue Date</span> <span className="font-mono">{viewingInstruction.issue_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Due Date</span> <span className="font-mono font-bold text-text-primary">{viewingInstruction.due_date}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-2">
                <div>
                  <span className="text-text-muted text-[10px] uppercase font-bold block">Issuer ➔ Action Party</span>
                  <span className="font-semibold text-text-primary">{viewingInstruction.issued_by}</span>
                  <span className="text-text-muted text-[11px]"> ➔ To: </span>
                  <span className="font-semibold text-text-primary">{viewingInstruction.issued_to}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Directive Instructions</span>
                  <p className="text-text-primary bg-surface-muted/30 p-2.5 rounded border border-border/50 whitespace-pre-wrap">{viewingInstruction.directive_text}</p>
                </div>
                {viewingInstruction.compliance_notes && (
                  <div className="pt-2 border-t border-border">
                    <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Compliance & Verification Notes</span>
                    <p className="text-text-secondary bg-emerald-500/5 p-2 rounded border border-emerald-500/20">{viewingInstruction.compliance_notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingInstruction(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Issue / Edit Instruction Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingInstruction)}
        onClose={() => { setIsAddOpen(false); setEditingInstruction(null); }}
      >
        <EntityEditModal.Header
          icon={FileWarning}
          title={editingInstruction ? 'Edit Site Instruction' : 'Issue Site Instruction'}
          subtitle="Record site order book directives, safety notices, and QA/QC corrections."
          onClose={() => { setIsAddOpen(false); setEditingInstruction(null); }}
        />
        <form id="si-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Instruction Routing & Identification">
              <EntityEditModal.Grid>
                <FormField label="Target Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => {
                      handleFormChange('project_id', v);
                      const s = sites.find(item => String(item.project_id) === String(v));
                      if (s) handleFormChange('site_id', String(s.id));
                    }}
                  />
                </FormField>

                <FormField label="Target Site" required error={errors.site_id}>
                  <Select
                    options={sites
                      .filter(s => !form.project_id || String(s.project_id) === String(form.project_id))
                      .map(s => ({ value: String(s.id), label: `${s.site_code} - ${s.site_name}` }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                  />
                </FormField>

                <FormField label="Instruction Code" required error={errors.instruction_code}>
                  <Input
                    value={form.instruction_code}
                    onChange={(e) => handleFormChange('instruction_code', e.target.value)}
                    placeholder="e.g. SI-2026-001"
                  />
                </FormField>

                <FormField label="Directive Category" required>
                  <Select
                    options={INSTRUCTION_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))}
                    value={form.category_id}
                    onChange={(v) => handleFormChange('category_id', v)}
                  />
                </FormField>

                <FormField label="Subject / Summary" required className="md:col-span-2" error={errors.subject}>
                  <Input
                    value={form.subject}
                    onChange={(e) => handleFormChange('subject', e.target.value)}
                    placeholder="e.g. Rebar clear cover rectification before raft concrete pour"
                  />
                </FormField>

                <FormField label="Specific Location / Grid Area">
                  <Input
                    value={form.location_name}
                    onChange={(e) => handleFormChange('location_name', e.target.value)}
                    placeholder="e.g. Basement 1 Grid B3-D5"
                  />
                </FormField>

                <FormField label="Priority Level">
                  <Select
                    options={[
                      { value: 'Critical', label: 'Critical (Work Stoppage Risk)' },
                      { value: 'High', label: 'High' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'Low', label: 'Low' },
                    ]}
                    value={form.priority}
                    onChange={(v) => handleFormChange('priority', v)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Parties, Timeline & Directives">
              <EntityEditModal.Grid>
                <FormField label="Issued By (Consultant / Incharge)">
                  <Input
                    value={form.issued_by}
                    onChange={(e) => handleFormChange('issued_by', e.target.value)}
                    placeholder="e.g. Karthik Raja (Chief Structural Consultant)"
                  />
                </FormField>

                <FormField label="Issued To (Contractor / Gang)">
                  <Input
                    value={form.issued_to}
                    onChange={(e) => handleFormChange('issued_to', e.target.value)}
                    placeholder="e.g. Apex Civil Contractors Pvt Ltd"
                  />
                </FormField>

                <FormField label="Date Issued">
                  <Input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => handleFormChange('issue_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Compliance Due Date">
                  <Input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => handleFormChange('due_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Directive Specification" required className="md:col-span-2" error={errors.directive_text}>
                  <Textarea
                    rows={3}
                    value={form.directive_text}
                    onChange={(e) => handleFormChange('directive_text', e.target.value)}
                    placeholder="Provide explicit technical instructions, required clearances, or safety steps..."
                  />
                </FormField>

                <FormField label="Compliance Status">
                  <Select
                    options={[
                      { value: 'Open', label: 'Open / Action Pending' },
                      { value: 'In Progress', label: 'In Progress' },
                      { value: 'Complied & Verified', label: 'Complied & Verified' },
                      { value: 'Closed', label: 'Closed / Archived' },
                    ]}
                    value={form.status}
                    onChange={(v) => handleFormChange('status', v)}
                  />
                </FormField>

                <FormField label="Compliance Notes / Verification" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.compliance_notes}
                    onChange={(e) => handleFormChange('compliance_notes', e.target.value)}
                    placeholder="Verification notes by site engineer after physical rectification..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="si-form"
            submitLabel={editingInstruction ? 'Update Instruction' : 'Issue Directive'}
            onCancel={() => { setIsAddOpen(false); setEditingInstruction(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteInstruction)}
        title="Delete Site Instruction"
        message={`Are you sure you want to delete "${deleteInstruction?.instruction_code}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteInstruction(null)}
      />
    </PageContainer>
  );
}
