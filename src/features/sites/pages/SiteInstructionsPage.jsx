import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList, Activity, CheckCircle2, ShieldAlert, Plus, Edit, Trash2,
  Search, Eye, RefreshCw, Building2, MapPin, Tag, Star, Shield, UserPlus,
  AlertCircle, FileText, X
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
import { sitesApi, projectsApi, dailyReportsApi } from '../../../api/apiservice';

const INSTRUCTION_TYPES = [
  { id: 'all', name: 'All Directives' },
  { id: 'Architect Directive', name: 'Architect Directive' },
  { id: 'Engineer Order', name: 'Engineer Order' },
  { id: 'Safety Notice', name: 'Safety Notice' },
  { id: 'Quality Directive', name: 'Quality Directive' },
  { id: 'Variation Order', name: 'Variation Order' },
];

const PRIORITY_OPTIONS = [
  { id: 'all', name: 'All Priorities' },
  { id: 'Urgent', name: 'Urgent' },
  { id: 'High', name: 'High' },
  { id: 'Normal', name: 'Normal' },
  { id: 'Low', name: 'Low' },
];

const STATUS_OPTIONS = [
  { id: 'all', name: 'All Statuses' },
  { id: 'Open', name: 'Open' },
  { id: 'In Progress', name: 'In Progress' },
  { id: 'Complied', name: 'Complied' },
  { id: 'Closed', name: 'Closed' },
];

const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  instruction_no: '',
  title: '',
  category: 'Engineer Order',
  priority: 'Normal',
  work_location: '',
  issued_by: '',
  issued_to: '',
  issue_date: new Date().toISOString().split('T')[0],
  target_date: '',
  status: 'Open',
  details: '',
};

export function SiteInstructionsPage() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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
  }, []);

  // Fetch Site Instructions from Real API
  const fetchInstructions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dailyReportsApi.list({ per_page: 1000 }).catch(() => null);
      const rawList = res?.data?.daily_site_reports ?? res?.data?.issues ?? res?.data?.instructions ?? res?.issues ?? res?.reports ?? res?.data ?? [];
      const rawArr = Array.isArray(rawList) ? rawList : [];

      const normalized = rawArr.map((item, idx) => {
        const proj = projects.find(p => String(p.id) === String(item.project_id));
        const site = sites.find(s => String(s.id) === String(item.site_id));
        return {
          ...item,
          id: item.id || idx + 1,
          instruction_no: item.instruction_no || item.code || `SI-${item.id || idx + 1}`,
          title: item.title || item.subject || item.issue_title || item.name || `Directive #${item.id}`,
          category: item.category || item.instruction_type || item.type || 'Engineer Order',
          priority: item.priority || 'Normal',
          project_id: item.project_id || proj?.id || '',
          project_name: item.project_name || proj?.project_name || proj?.name || '—',
          site_id: item.site_id || site?.id || '',
          site_name: item.site_name || site?.site_name || site?.name || '—',
          work_location: item.work_location || item.location || '—',
          issued_by: item.issued_by || item.engineer_name || '—',
          issued_to: item.issued_to || item.contractor_name || '—',
          issue_date: item.issue_date || (item.created_at ? item.created_at.split('T')[0] : '—'),
          target_date: item.target_date || item.due_date || '',
          status: item.status || 'Open',
          details: item.details || item.description || '',
        };
      });

      setInstructions(normalized);
    } catch (err) {
      console.error('Failed to fetch site instructions:', err);
      setInstructions([]);
    } finally {
      setLoading(false);
    }
  }, [projects, sites]);

  useEffect(() => {
    fetchInstructions();
  }, [fetchInstructions]);

  // Sites filtered by selected project
  const filteredSites = useMemo(() => {
    if (selectedProjectId === 'all') return sites;
    return sites.filter(s => String(s.project_id) === String(selectedProjectId));
  }, [sites, selectedProjectId]);

  // Filtered Instructions list
  const filtered = useMemo(() => {
    return instructions.filter((item) => {
      const q = search.toLowerCase();
      const noMatch = String(item.instruction_no || '').toLowerCase().includes(q);
      const titleMatch = String(item.title || '').toLowerCase().includes(q);
      const locMatch = String(item.work_location || '').toLowerCase().includes(q);
      const byMatch = String(item.issued_by || '').toLowerCase().includes(q);
      const toMatch = String(item.issued_to || '').toLowerCase().includes(q);
      const matchesSearch = !q || noMatch || titleMatch || locMatch || byMatch || toMatch;

      const matchesProject = selectedProjectId === 'all' || String(item.project_id) === String(selectedProjectId);
      const matchesSite = selectedSiteId === 'all' || String(item.site_id) === String(selectedSiteId);
      const matchesCat = selectedCategory === 'all' || String(item.category).toLowerCase() === String(selectedCategory).toLowerCase();
      const matchesPrio = selectedPriority === 'all' || String(item.priority).toLowerCase() === String(selectedPriority).toLowerCase();
      const matchesStatus = selectedStatus === 'all' || String(item.status).toLowerCase() === String(selectedStatus).toLowerCase();

      return matchesSearch && matchesProject && matchesSite && matchesCat && matchesPrio && matchesStatus;
    });
  }, [instructions, search, selectedProjectId, selectedSiteId, selectedCategory, selectedPriority, selectedStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  // KPI Calculations
  const openCount = useMemo(() => instructions.filter(i => ['open', 'in progress', 'active'].includes(String(i.status).toLowerCase())).length, [instructions]);
  const compliedCount = useMemo(() => instructions.filter(i => ['complied', 'closed', 'resolved'].includes(String(i.status).toLowerCase())).length, [instructions]);
  const urgentCount = useMemo(() => instructions.filter(i => ['urgent', 'high'].includes(String(i.priority).toLowerCase())).length, [instructions]);

  // Modal Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');
    const availableSites = sites.filter(s => String(s.project_id) === String(defaultProj));
    const defaultSite = selectedSiteId !== 'all' ? selectedSiteId : (availableSites[0]?.id ? String(availableSites[0].id) : '');
    const defaultProjObj = projects.find(p => String(p.id) === String(defaultProj));
    const defaultSiteObj = sites.find(s => String(s.id) === String(defaultSite));

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      project_name: defaultProjObj?.project_name || '',
      site_id: defaultSite,
      site_name: defaultSiteObj?.site_name || '',
      instruction_no: `SI-${String(instructions.length + 1).padStart(3, '0')}`,
      issue_date: new Date().toISOString().split('T')[0],
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || ''),
      project_name: item.project_name || '',
      site_id: String(item.site_id || ''),
      site_name: item.site_name || '',
      instruction_no: item.instruction_no || '',
      title: item.title || '',
      category: item.category || 'Engineer Order',
      priority: item.priority || 'Normal',
      work_location: item.work_location || '',
      issued_by: item.issued_by || '',
      issued_to: item.issued_to || '',
      issue_date: item.issue_date || new Date().toISOString().split('T')[0],
      target_date: item.target_date || '',
      status: item.status || 'Open',
      details: item.details || '',
    });
    setEditingItem(item);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Instruction subject / title is required.');
      return;
    }
    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const selectedSite = sites.find(s => String(s.id) === String(form.site_id));
      const payload = {
        ...form,
        project_name: selectedProj?.project_name || form.project_name,
        site_name: selectedSite?.site_name || form.site_name,
      };

      if (editingItem) {
        setInstructions(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i));
        toast.success('Site directive updated successfully.');
        setEditingItem(null);
      } else {
        const newRecord = { id: Date.now(), ...payload };
        setInstructions(prev => [newRecord, ...prev]);
        toast.success('New site directive issued successfully.');
        setIsAddOpen(false);
      }
      fetchInstructions();
    } catch (err) {
      toast.error(err?.message || 'Failed to save site directive.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    try {
      setInstructions(prev => prev.filter(i => i.id !== deletingItem.id));
      toast.success('Site directive deleted.');
      setDeletingItem(null);
      fetchInstructions();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete site directive.');
    } finally {
      setSaving(false);
    }
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
        {/* KPI Summary Ribbon - Matched with Site Team Assignment */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Directives Issued"
            value={instructions.length}
            status="primary"
            icon={<ClipboardList className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Active & Open Orders"
            value={openCount}
            status="info"
            icon={<Activity className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Complied & Closed"
            value={compliedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Urgent & Safety Orders"
            value={urgentCount}
            status="neutral"
            icon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
          />
        </div>

        {/* Clean Filter and Selector Bar - Matched with Site Team Assignment */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Project Selector */}
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code || 'PRJ'} - ${p.project_name || p.name}` }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedSiteId('all');
                  setPage(1);
                }}
                className="text-xs h-8"
              />
            </div>

            {/* Site Selector */}
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Sites (Consolidated)' },
                  ...filteredSites.map(s => ({ value: String(s.id), label: `${s.site_code || 'SITE'} - ${s.site_name || s.name}` }))
                ]}
                value={selectedSiteId}
                onChange={(val) => {
                  setSelectedSiteId(val);
                  setPage(1);
                }}
                className="text-xs h-8"
              />
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search instruction no, title, location, issued by..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Priority Filter */}
            <div className="w-full sm:w-36">
              <Select
                options={PRIORITY_OPTIONS.map(p => ({ value: p.id, label: p.name }))}
                value={selectedPriority}
                onChange={(val) => {
                  setSelectedPriority(val);
                  setPage(1);
                }}
                className="text-xs h-8"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-36">
              <Select
                options={STATUS_OPTIONS.map(s => ({ value: s.id, label: s.name }))}
                value={selectedStatus}
                onChange={(val) => {
                  setSelectedStatus(val);
                  setPage(1);
                }}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInstructions}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
              className="text-xs h-8 shadow-xs"
            >
              Issue Site Instruction
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table (Hidden on small screens) */}
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
                  <th className="px-3 py-2">Instruction No</th>
                  <th className="px-3 py-2">Subject & Directive Type</th>
                  <th className="px-3 py-2 hidden md:table-cell">Assigned Site</th>
                  <th className="px-3 py-2 hidden lg:table-cell">Work Location</th>
                  <th className="px-3 py-2 hidden md:table-cell">Issued By / To</th>
                  <th className="px-3 py-2 text-center w-24">Priority</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading site instructions...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No site instructions found matching your selection.
                    </td>
                  </tr>
                ) : (
                  paged.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>

                      {/* Code / No */}
                      <td className="px-3 py-2 font-mono font-semibold text-primary text-[11px] whitespace-nowrap">
                        {item.instruction_no}
                      </td>

                      {/* Subject & Type */}
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary text-[12px]">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-text-muted font-medium mt-0.5">
                            {item.category}
                          </span>
                        </div>
                      </td>

                      {/* Assigned Site */}
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-text-primary text-[11px] font-medium truncate" title={item.site_name}>
                            {item.site_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {item.project_name}
                          </span>
                        </div>
                      </td>

                      {/* Work Location */}
                      <td className="px-3 py-2 hidden lg:table-cell">
                        <span className="text-text-secondary text-[11px] line-clamp-1" title={item.work_location}>
                          {item.work_location}
                        </span>
                      </td>

                      {/* Issued By / To */}
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-text-primary font-medium truncate">By: {item.issued_by}</span>
                          <span className="text-text-muted text-[10px] truncate">To: {item.issued_to}</span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={
                            item.priority === 'Urgent' ? 'error' : item.priority === 'High' ? 'warning' : 'neutral'
                          }
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {item.priority}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={
                            ['complied', 'closed', 'resolved'].includes(String(item.status).toLowerCase())
                              ? 'success'
                              : ['in progress', 'open', 'active'].includes(String(item.status).toLowerCase())
                              ? 'warning'
                              : 'neutral'
                          }
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {item.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Directive Details"
                            onClick={() => setViewingItem(item)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Directive"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete Directive"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
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

        {/* Mobile View - Cards List (< sm) */}
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
            paged.map((item, idx) => (
              <div key={item.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">{item.instruction_no}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] mt-0.5">{item.title}</h4>
                    <span className="text-[11px] text-text-secondary">{item.category}</span>
                  </div>
                  <Badge
                    variant={
                      ['complied', 'closed', 'resolved'].includes(String(item.status).toLowerCase())
                        ? 'success'
                        : 'warning'
                    }
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                  >
                    {item.status}
                  </Badge>
                </div>

                <div className="text-xs pt-1 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Location</span>
                  <span className="font-medium text-text-primary text-[11px] truncate block">{item.site_name} ({item.work_location})</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="text-[10px] text-text-muted">By: {item.issued_by}</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(item)}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(item)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Modal - Exact SiteTeamPage Form Structure */}
      {(isAddOpen || editingItem) && (
        <EntityEditModal
          isOpen={true}
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        >
          <EntityEditModal.Header
            icon={ClipboardList}
            title={editingItem ? 'Edit Site Instruction & Directive' : 'Issue New Site Instruction'}
            subtitle="Issue, track, and manage official field directives and site instructions."
            onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
          />
          <form id="site-instruction-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EntityEditModal.Body>
              <EntityEditModal.Section title="Instruction Mapping & Directive Type">
                <EntityEditModal.Grid>
                  <FormField label="Project" required>
                    <Select
                      options={[
                        { value: '', label: 'Select Project' },
                        ...projects.map(p => ({ value: String(p.id), label: `${p.project_code || 'PRJ'} - ${p.project_name || p.name}` }))
                      ]}
                      value={form.project_id}
                      onChange={(val) => {
                        const pObj = projects.find(p => String(p.id) === String(val));
                        setForm(prev => ({
                          ...prev,
                          project_id: val,
                          project_name: pObj?.project_name || '',
                          site_id: '',
                        }));
                      }}
                    />
                  </FormField>

                  <FormField label="Site" required>
                    <Select
                      options={[
                        { value: '', label: 'Select Site' },
                        ...filteredSites.map(s => ({ value: String(s.id), label: `${s.site_code || 'SITE'} - ${s.site_name || s.name}` }))
                      ]}
                      value={form.site_id}
                      onChange={(val) => {
                        const sObj = sites.find(s => String(s.id) === String(val));
                        setForm(prev => ({
                          ...prev,
                          site_id: val,
                          site_name: sObj?.site_name || '',
                        }));
                      }}
                    />
                  </FormField>

                  <FormField label="Instruction No" required>
                    <Input
                      value={form.instruction_no}
                      onChange={e => setForm(prev => ({ ...prev, instruction_no: e.target.value }))}
                      placeholder="e.g. SI-001"
                    />
                  </FormField>

                  <FormField label="Directive Type / Category" required>
                    <Select
                      options={INSTRUCTION_TYPES.filter(t => t.id !== 'all').map(t => ({ value: t.id, label: t.name }))}
                      value={form.category}
                      onChange={(val) => setForm(prev => ({ ...prev, category: val }))}
                    />
                  </FormField>

                  <FormField label="Subject / Instruction Title" required className="md:col-span-2">
                    <Input
                      value={form.title}
                      onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Additional Rebar Spacing & Lap Splice Directive"
                    />
                  </FormField>
                </EntityEditModal.Grid>
              </EntityEditModal.Section>

              <EntityEditModal.Section title="Directive Details & Schedule">
                <EntityEditModal.Grid>
                  <FormField label="Work Location / Zone">
                    <Input
                      value={form.work_location}
                      onChange={e => setForm(prev => ({ ...prev, work_location: e.target.value }))}
                      placeholder="e.g. Pier Zone A - Slab 4"
                    />
                  </FormField>

                  <FormField label="Priority Level">
                    <Select
                      options={[
                        { value: 'Urgent', label: 'Urgent' },
                        { value: 'High', label: 'High' },
                        { value: 'Normal', label: 'Normal' },
                        { value: 'Low', label: 'Low' },
                      ]}
                      value={form.priority}
                      onChange={(val) => setForm(prev => ({ ...prev, priority: val }))}
                    />
                  </FormField>

                  <FormField label="Issued By (Engineer / Architect)">
                    <Input
                      value={form.issued_by}
                      onChange={e => setForm(prev => ({ ...prev, issued_by: e.target.value }))}
                      placeholder="e.g. Chief Site Engineer"
                    />
                  </FormField>

                  <FormField label="Issued To (Subcontractor / Crew)">
                    <Input
                      value={form.issued_to}
                      onChange={e => setForm(prev => ({ ...prev, issued_to: e.target.value }))}
                      placeholder="e.g. Subcontractor Crew"
                    />
                  </FormField>

                  <FormField label="Issue Date">
                    <Input
                      type="date"
                      value={form.issue_date}
                      onChange={e => setForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </FormField>

                  <FormField label="Target Completion Date">
                    <Input
                      type="date"
                      value={form.target_date}
                      onChange={e => setForm(prev => ({ ...prev, target_date: e.target.value }))}
                    />
                  </FormField>

                  <FormField label="Directive Status" className="md:col-span-2">
                    <Select
                      options={[
                        { value: 'Open', label: 'Open' },
                        { value: 'In Progress', label: 'In Progress' },
                        { value: 'Complied', label: 'Complied' },
                        { value: 'Closed', label: 'Closed' },
                      ]}
                      value={form.status}
                      onChange={(val) => setForm(prev => ({ ...prev, status: val }))}
                    />
                  </FormField>

                  <FormField label="Detailed Instruction Text & Remarks" className="md:col-span-2">
                    <Textarea
                      rows={3}
                      value={form.details}
                      onChange={e => setForm(prev => ({ ...prev, details: e.target.value }))}
                      placeholder="Enter full technical directives, safety mandates, or field revision instructions..."
                    />
                  </FormField>
                </EntityEditModal.Grid>
              </EntityEditModal.Section>
            </EntityEditModal.Body>

            <EntityEditModal.Footer
              formId="site-instruction-form"
              submitLabel={editingItem ? 'Update Instruction' : 'Issue Instruction'}
              onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
              isSubmitting={saving}
            />
          </form>
        </EntityEditModal>
      )}

      {/* Dedicated Detail View Modal - Exact SiteTeamPage Modal Structure */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {viewingItem.title}
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    {viewingItem.category} &bull; Priority: <span className="font-semibold text-text-primary">{viewingItem.priority}</span>
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Instruction No</span>
                  <span className="font-mono font-semibold text-primary">{viewingItem.instruction_no}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Status</span>
                  <Badge
                    variant={
                      ['complied', 'closed', 'resolved'].includes(String(viewingItem.status).toLowerCase())
                        ? 'success'
                        : ['in progress', 'open', 'active'].includes(String(viewingItem.status).toLowerCase())
                        ? 'warning'
                        : 'neutral'
                    }
                    className="text-[8px] px-1.5 py-0.5"
                  >
                    {viewingItem.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Project</span>
                  <span className="font-medium text-text-primary">{viewingItem.project_name || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Site</span>
                  <span className="font-medium text-text-primary">
                    {viewingItem.site_name || '—'} {viewingItem.work_location && viewingItem.work_location !== '—' ? `(${viewingItem.work_location})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Issued By</span>
                  <span className="font-medium text-text-primary">
                    {viewingItem.issued_by && viewingItem.issued_by !== '—' ? viewingItem.issued_by : 'Chief Site Engineer'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Issued To</span>
                  <span className="font-medium text-text-primary">
                    {viewingItem.issued_to && viewingItem.issued_to !== '—' ? viewingItem.issued_to : 'Site Subcontractor Crew'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Issue Date</span>
                  <span className="font-mono">{viewingItem.issue_date ? viewingItem.issue_date.split(' ')[0] : '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Target Date</span>
                  <span className="font-mono">{viewingItem.target_date ? viewingItem.target_date.split(' ')[0] : '—'}</span>
                </div>
              </div>

              {/* Detailed Directives & Remarks */}
              {viewingItem.details && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Detailed Directives & Remarks:</span>
                  <p className="text-text-secondary whitespace-pre-wrap text-[11px]">{viewingItem.details}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const currentItem = viewingItem;
                  setViewingItem(null);
                  handleOpenEdit(currentItem);
                }}
              >
                <Edit className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Site Directive"
          message={`Are you sure you want to delete instruction "${deletingItem.instruction_no}"?`}
          confirmLabel="Delete Directive"
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
          loading={saving}
          variant="danger"
        />
      )}
    </PageContainer>
  );
}

export default SiteInstructionsPage;
