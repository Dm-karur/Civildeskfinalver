import { useState, useEffect, useMemo } from 'react';
import {
  Users, CheckCircle2, Clock, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, Printer, ArrowRight, HardHat
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
const DEFAULT_MANPOWER_LOGS = [

  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    date: '2026-08-21',
    contractor_name: 'Sri Murugan Labour Services',
    trade_category: 'Masons & Concrete Gang',
    shift_general_count: 14,
    shift_night_count: 4,
    total_workers: 18,
    ot_hours: 12.0,
    assigned_work: 'Level 2 Column Concrete Pouring and Curing',
    location: 'Tower Core 1 Grid C1-C6',
    foreman_incharge: 'M. Selvam',
    status: 'Verified by Timekeeper',
    notes: '4 masons engaged in night curing shift.'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    date: '2026-08-21',
    contractor_name: 'Sri Murugan Labour Services',
    trade_category: 'Bar Benders & Cutters',
    shift_general_count: 16,
    shift_night_count: 0,
    total_workers: 16,
    ot_hours: 8.0,
    assigned_work: 'Level 2 Beam Cage Tying & Column Splice Lapping',
    location: 'North Wing Grid N1-N4',
    foreman_incharge: 'K. Raman',
    status: 'Verified by Timekeeper',
    notes: 'Completed 3 beam cages.'
  },
  {
    id: 3,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    date: '2026-08-21',
    contractor_name: 'Apex Shuttering Specialists',
    trade_category: 'Carpenters & Staging Crew',
    shift_general_count: 14,
    shift_night_count: 0,
    total_workers: 14,
    ot_hours: 4.0,
    assigned_work: 'Cup-lock scaffolding & slab decking shuttering',
    location: 'Level 2 Floor Deck',
    foreman_incharge: 'P. Vignesh',
    status: 'Verified by Timekeeper',
    notes: 'All props checked for verticality.'
  },
];
*/

const EMPTY_FORM = {
  project_id: '',
  date: '',
  contractor_name: 'Sri Murugan Labour Services',
  trade_category: 'Masons & Concrete Gang',
  shift_general_count: '10',
  shift_night_count: '0',
  total_workers: '10',
  ot_hours: '0',
  assigned_work: '',
  location: 'Level 2 Floor Deck',
  foreman_incharge: 'Site Foreman',
  notes: '',
};

export function DailyManpowerPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
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
      date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      date: item.date || '',
      contractor_name: item.contractor_name || '',
      trade_category: item.trade_category || '',
      shift_general_count: String(item.shift_general_count || '10'),
      shift_night_count: String(item.shift_night_count || '0'),
      total_workers: String(item.total_workers || '10'),
      ot_hours: String(item.ot_hours || '0'),
      assigned_work: item.assigned_work || '',
      location: item.location || '',
      foreman_incharge: item.foreman_incharge || '',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'shift_general_count' || field === 'shift_night_count') {
        const gen = Number(field === 'shift_general_count' ? value : prev.shift_general_count) || 0;
        const nite = Number(field === 'shift_night_count' ? value : prev.shift_night_count) || 0;
        next.total_workers = String(gen + nite);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.trade_category.trim()) errs.trade_category = 'Trade category is required';
    if (!form.assigned_work.trim()) errs.assigned_work = 'Assigned work is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const gen = Number(form.shift_general_count || 0);
      const nite = Number(form.shift_night_count || 0);

      const newLog = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        date: form.date,
        contractor_name: form.contractor_name,
        trade_category: form.trade_category,
        shift_general_count: gen,
        shift_night_count: nite,
        total_workers: gen + nite,
        ot_hours: Number(form.ot_hours || 0),
        assigned_work: form.assigned_work,
        location: form.location,
        foreman_incharge: form.foreman_incharge,
        status: 'Verified by Timekeeper',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setLogs(prev => prev.map(l => l.id === editingItem.id ? newLog : l));
        toast.success('Manpower gang deployment updated.');
      } else {
        setLogs(prev => [newLog, ...prev]);
        toast.success('Daily manpower gang logged.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save manpower log.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setLogs(prev => prev.filter(l => l.id !== deleteItem.id));
    toast.success('Manpower log removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (selectedProjectId !== 'all' && String(l.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const cont = String(l.contractor_name || '').toLowerCase();
        const trade = String(l.trade_category || '').toLowerCase();
        const work = String(l.assigned_work || '').toLowerCase();
        const loc = String(l.location || '').toLowerCase();
        if (!cont.includes(s) && !trade.includes(s) && !work.includes(s) && !loc.includes(s)) return false;
      }
      return true;
    });
  }, [logs, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalSiteHeadcount = useMemo(() => logs.reduce((acc, l) => acc + Number(l.total_workers || 0), 0), [logs]);
  const totalOTHours = useMemo(() => logs.reduce((acc, l) => acc + Number(l.ot_hours || 0), 0), [logs]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daily Site Operations', href: '/daily-operations/reports' },
    { label: 'Site Manpower Deployment' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Daily Site Manpower & Gang Distribution"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Deployed Manpower"
            value={`${totalSiteHeadcount} Workers`}
            status="primary"
            icon={<Users className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Overtime Logged"
            value={`${totalOTHours} Hours`}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Active Gangs & Trades"
            value={`${logs.length} Gangs`}
            status="neutral"
            icon={<HardHat className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Timekeeper Sign-off"
            value="100% Verified"
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
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
                placeholder="Search contractor, trade, location..."
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
              title="Print Manpower Register"
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
              Deploy Gang / Workforce
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
                  <th className="px-3 py-2 w-28">Date</th>
                  <th className="px-3 py-2">Trade Gang & Contractor</th>
                  <th className="px-3 py-2">Assigned Work & Location</th>
                  <th className="px-3 py-2 text-center w-20">Gen Shift</th>
                  <th className="px-3 py-2 text-center w-20">Night Shift</th>
                  <th className="px-3 py-2 text-center w-20 font-bold">Total Workers</th>
                  <th className="px-3 py-2 text-center w-20">OT Hours</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading manpower deployment records...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No manpower logs found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[11px] font-bold text-primary block">
                          {l.date}
                        </span>
                        <span className="text-[10px] text-text-muted truncate">{l.project_name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={l.trade_category}>
                            {l.trade_category}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {l.contractor_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] text-text-secondary truncate block" title={l.assigned_work}>
                            {l.assigned_work}
                          </span>
                          <span className="text-[10px] text-primary truncate">
                            📍 {l.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                        {l.shift_general_count}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-secondary">
                        {l.shift_night_count}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-text-primary text-[11px]">
                        {l.total_workers}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-amber-600 font-semibold text-[11px]">
                        {l.ot_hours > 0 ? `${l.ot_hours}h` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Gang 360"
                            onClick={() => setViewingItem(l)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(l)}
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
          {paged.map((l, idx) => (
            <div key={l.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{l.date} • {l.contractor_name}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{l.trade_category}</h4>
                  <span className="text-[11px] text-text-muted">📍 {l.location}</span>
                </div>
                <Badge
                  variant="primary"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {l.total_workers} Workers
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Shift Breakdown</span>
                  <span className="font-mono text-[11px] text-text-secondary">Gen: {l.shift_general_count} | Night: {l.shift_night_count}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Overtime</span>
                  <span className="font-mono text-[11px] text-amber-600 font-bold">{l.ot_hours} Hours</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(l)}>
                  <Eye className="w-3 h-3 mr-1" /> View Gang Log
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

      {/* View Gang 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.trade_category}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.contractor_name} • {viewingItem.date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Deployed Workers</span> <span className="font-bold text-primary font-mono text-base">{viewingItem.total_workers} Persons</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Shift Distribution</span> <span className="font-mono">Gen: {viewingItem.shift_general_count} | Night: {viewingItem.shift_night_count}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Overtime Logged</span> <span className="font-mono font-bold text-amber-600">{viewingItem.ot_hours} Hours</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Foreman Incharge</span> <span className="text-text-primary font-medium">{viewingItem.foreman_incharge}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Activity</span> <span className="text-text-primary font-medium">{viewingItem.assigned_work}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Work Grid / Location</span> <span className="text-text-primary font-medium">{viewingItem.location}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Timekeeper Log Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Manpower Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Users}
          title={editingItem ? 'Edit Manpower Deployment' : 'Deploy Site Workforce / Gang'}
          subtitle="Record daily trade gang muster roll, shift allocations, and work assignments."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="manpower-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Trade Gang & Contractor">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Deployment Date" required>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                  />
                </FormField>

                <FormField label="Contractor / Labour Agency">
                  <Input
                    value={form.contractor_name}
                    onChange={(e) => handleFormChange('contractor_name', e.target.value)}
                    placeholder="e.g. Sri Murugan Labour Services"
                  />
                </FormField>

                <FormField label="Trade Gang Category" required error={errors.trade_category}>
                  <Input
                    value={form.trade_category}
                    onChange={(e) => handleFormChange('trade_category', e.target.value)}
                    placeholder="e.g. Masons, Bar Benders, Carpenters"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Headcount & Work Assignment">
              <EntityEditModal.Grid>
                <FormField label="General Shift Workers">
                  <Input
                    type="number"
                    value={form.shift_general_count}
                    onChange={(e) => handleFormChange('shift_general_count', e.target.value)}
                  />
                </FormField>

                <FormField label="Night Shift Workers">
                  <Input
                    type="number"
                    value={form.shift_night_count}
                    onChange={(e) => handleFormChange('shift_night_count', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Overtime Hours">
                  <Input
                    type="number"
                    value={form.ot_hours}
                    onChange={(e) => handleFormChange('ot_hours', e.target.value)}
                  />
                </FormField>

                <FormField label="Foreman Incharge">
                  <Input
                    value={form.foreman_incharge}
                    onChange={(e) => handleFormChange('foreman_incharge', e.target.value)}
                    placeholder="e.g. M. Selvam"
                  />
                </FormField>

                <FormField label="Assigned Work Description" required error={errors.assigned_work} className="md:col-span-2">
                  <Input
                    value={form.assigned_work}
                    onChange={(e) => handleFormChange('assigned_work', e.target.value)}
                    placeholder="e.g. Level 2 Column Concrete Pouring and Curing"
                  />
                </FormField>

                <FormField label="Work Location / Grid" className="md:col-span-2">
                  <Input
                    value={form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Tower Core 1 Grid C1-C6"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="manpower-form"
            submitLabel={editingItem ? 'Update Gang Log' : 'Save Deployment'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Manpower Log"
        message={`Are you sure you want to delete "${deleteItem?.trade_category}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
