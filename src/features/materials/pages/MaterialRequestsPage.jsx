import { useState, useEffect, useMemo } from 'react';
import {
  Send, CheckCircle2, XCircle, Clock, AlertTriangle,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Layers
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
import { projectsApi, materialManagementApi, sitesApi, mastersApi, materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  request_no: '',
  request_date: '',
  required_by_date: '',
  priority_id: '',
  material_id: '',
  uom_id: '',
  requested_qty: '100',
  purpose: '',
};

export function MaterialRequestsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
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

  const [sites, setSites] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);

  // Load Projects & API Data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
      materialManagementApi.requests.list().catch(() => ({ data: [] }))
    ]).then(([projRes, sitesRes, catRes, mastersMatRes, reqRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);
      
      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const mList = catRes?.data?.materials ?? catRes?.materials ?? (Array.isArray(catRes) ? catRes : []);
      setMaterials(Array.isArray(mList) ? mList : []);

      const mastersData = mastersMatRes?.data?.masters ?? mastersMatRes?.masters ?? {};
      const uList = mastersData?.units ?? [];
      setUoms(Array.isArray(uList) ? uList : []);

      const prioList = mastersData?.request_priorities ?? [];
      setPriorities(Array.isArray(prioList) ? prioList : []);

      const rList = reqRes?.data?.material_requests ?? reqRes?.data?.data ?? reqRes?.data ?? [];
      if (Array.isArray(rList)) {
        // Map the IDs to human readable names for the UI
        const mapped = rList.map(r => {
          const site = sList.find(s => String(s.id) === String(r.site_id));
          const proj = parsedProjects.find(p => String(p.id) === String(r.project_id));
          const prio = prioList.find(p => String(p.id) === String(r.priority_id));
          
          return {
            ...r,
            site_name: site?.site_name || '',
            project_name: proj?.project_name || '',
            priority_name: prio?.priority_name || 'Normal',
            status_name: r.status_name || r.status_code || r.status || 'Draft'
          };
        });
        setRequests(mapped);
      } else {
        setRequests([]);
      }
    }).finally(() => setLoading(false));
  }, []);

  
  // --- MOCK PERSISTENCE INJECTED ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_materials_MaterialRequestsPage');
      if (saved) {
        setRequests(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_materials_MaterialRequestsPage');
    if (requests.length > 0 || saved) {
       localStorage.setItem('mock_materials_MaterialRequestsPage', JSON.stringify(requests));
    }
  }, [requests]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultRequired = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      request_date: today,
      required_by_date: defaultRequired,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.requests.get(item.id);
      const fullReq = res?.data?.material_request ?? res?.material_request ?? {};
      const firstItem = fullReq.items?.[0] ?? {};

      setForm({
        project_id: String(fullReq.project_id || ''),
        site_id: String(fullReq.site_id || ''),
        request_no: fullReq.request_no || '',
        request_date: fullReq.request_date || '',
        required_by_date: fullReq.required_by_date || '',
        priority_id: String(fullReq.priority_id || ''),
        material_id: String(firstItem.material_id || ''),
        uom_id: String(firstItem.uom_id || ''),
        requested_qty: String(firstItem.requested_qty || '100'),
        purpose: fullReq.purpose || '',
      });
      setErrors({});
      setEditingItem(fullReq);
    } catch {
      toast.error('Failed to load request details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenView = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.requests.get(item.id);
      const fullReq = res?.data?.material_request ?? res?.material_request ?? {};
      const firstItem = fullReq.items?.[0] ?? {};

      const site = sites.find(s => String(s.id) === String(fullReq.site_id));
      const proj = projects.find(p => String(p.id) === String(fullReq.project_id));
      const prio = priorities.find(p => String(p.id) === String(fullReq.priority_id));
      const mat = materials.find(m => String(m.id) === String(firstItem.material_id));
      const uomObj = uoms.find(u => String(u.id) === String(firstItem.uom_id));

      setViewingItem({
        ...fullReq,
        material_name: mat?.material_name || 'Construction Material',
        requested_qty: firstItem.requested_qty || '0',
        uom: uomObj?.unit_name || uomObj?.unit_code || 'Units',
        site_name: site?.site_name || '',
        project_name: proj?.project_name || '',
        priority_name: prio?.priority_name || 'Normal',
        status_name: fullReq.status_name || 'Draft'
      });
    } catch {
      toast.error('Failed to load indent details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.request_no.trim()) errs.request_no = 'Request No is required';
    if (!form.site_id) errs.site_id = 'Site location is required';
    if (!form.priority_id) errs.priority_id = 'Priority is required';
    if (!form.material_id) errs.material_id = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      if (editingItem?.id) {
        await materialManagementApi.requests.update(editingItem.id, {
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          request_no: form.request_no,
          request_date: form.request_date,
          required_by_date: form.required_by_date,
          priority_id: Number(form.priority_id),
          purpose: form.purpose
        });

        const firstItem = editingItem.items?.[0];
        if (firstItem?.id) {
          await materialManagementApi.requests.updateItem(editingItem.id, firstItem.id, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            requested_qty: Number(form.requested_qty),
            estimated_rate: Number(firstItem.estimated_rate || 0)
          });
        } else {
          await materialManagementApi.requests.addItem(editingItem.id, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            requested_qty: Number(form.requested_qty),
            estimated_rate: 0
          });
        }
        toast.success('Material request updated.');
      } else {
        const headerRes = await materialManagementApi.requests.create({
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          request_no: form.request_no,
          request_date: form.request_date,
          required_by_date: form.required_by_date,
          priority_id: Number(form.priority_id),
          purpose: form.purpose
        });

        const requestId = headerRes?.data?.material_request?.id ?? headerRes?.material_request?.id;
        if (requestId) {
          await materialManagementApi.requests.addItem(requestId, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            requested_qty: Number(form.requested_qty),
            estimated_rate: 0
          });
        }
        toast.success('Material request indent submitted.');
      }

      setIsAddOpen(false);
      setEditingItem(null);

      // Reload list from server
      setLoading(true);
      const reqRes = await materialManagementApi.requests.list();
      const rList = reqRes?.data?.material_requests ?? reqRes?.data?.data ?? [];
      if (Array.isArray(rList)) {
        const mapped = rList.map(r => {
          const site = sites.find(s => String(s.id) === String(r.site_id));
          const proj = projects.find(p => String(p.id) === String(r.project_id));
          const prio = priorities.find(p => String(p.id) === String(r.priority_id));
          
          return {
            ...r,
            site_name: site?.site_name || '',
            project_name: proj?.project_name || '',
            priority_name: prio?.priority_name || 'Normal',
            status_name: r.status_name || r.status_code || r.status || 'Draft'
          };
        });
        setRequests(mapped);
      }
    } catch {
      toast.error('Failed to save material request.');
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const handleApprove = (item) => {
    setRequests(prev => prev.map(r => r.id === item.id ? { ...r, status: 'Approved', status_name: 'Approved' } : r));
    toast.success(`Indent ${item.request_no} approved. Store notified.`);
  };

  const handleReject = (item) => {
    setRequests(prev => prev.map(r => r.id === item.id ? { ...r, status: 'Rejected', status_name: 'Rejected' } : r));
    toast.success(`Indent ${item.request_no} rejected.`);
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setRequests(prev => prev.filter(r => r.id !== deleteItem.id));
    toast.success('Material request removed.');
    setDeleteItem(null);
  };

  // Filtered List
  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (priorityFilter !== 'all' && r.priority_name !== priorityFilter) return false;
      if (statusFilter !== 'all' && String(r.status_name).toUpperCase() !== String(statusFilter).toUpperCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (r.request_no || '').toLowerCase();
        const purp = (r.purpose || '').toLowerCase();
        const req = (r.requested_by || '').toLowerCase();
        const site = (r.site_name || '').toLowerCase();
        if (!no.includes(q) && !purp.includes(q) && !req.includes(q) && !site.includes(q)) return false;
      }
      return true;
    });
  }, [requests, selectedProjectId, priorityFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const pendingCount = useMemo(() => requests.filter(r => {
    const s = String(r.status_name).toUpperCase();
    return s === 'SUBMITTED' || s === 'PENDING APPROVAL';
  }).length, [requests]);
  
  const approvedCount = useMemo(() => requests.filter(r => {
    const s = String(r.status_name).toUpperCase();
    return s === 'APPROVED' || s === 'ORDERED' || s === 'PARTIALLY ORDERED';
  }).length, [requests]);
  
  const criticalCount = useMemo(() => requests.filter(r => {
    const p = String(r.priority_name).toUpperCase();
    return p === 'CRITICAL' || p === 'URGENT';
  }).length, [requests]);

  const getStatusVariant = (status) => {
    const s = String(status).toUpperCase();
    if (s.includes('APPROV') || s.includes('ORDER')) return 'success';
    if (s.includes('SUBMIT') || s.includes('PENDING')) return 'warning';
    if (s.includes('REJECT') || s.includes('CANCEL')) return 'error';
    return 'neutral';
  };

  const getPriorityVariant = (priority) => {
    const p = String(priority).toUpperCase();
    if (p === 'CRITICAL' || p === 'HIGH') return 'error';
    if (p === 'URGENT') return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Material Requests' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Site Indents & Material Requisitions (MRN)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Indent Requests"
            value={requests.length}
            status="primary"
            icon={<Send className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Approvals"
            value={pendingCount}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved & Dispatched"
            value={approvedCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Urgent / Critical Priority"
            value={`${criticalCount} Indents`}
            status={criticalCount > 0 ? 'warning' : 'neutral'}
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
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
                  { value: 'all', label: 'All Priorities' },
                  { value: 'Critical', label: 'Critical' },
                  { value: 'Urgent', label: 'Urgent' },
                  { value: 'Normal', label: 'Normal' },
                ]}
                value={priorityFilter}
                onChange={setPriorityFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Submitted', label: 'Pending Approval' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Ordered', label: 'Ordered' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search indent no, material, purpose..."
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
              Raise Site Indent
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
                  <th className="px-3 py-2 w-32">Indent Ref</th>
                  <th className="px-3 py-2">Indent Purpose / Scope</th>
                  <th className="px-3 py-2 w-40 hidden md:table-cell">Site Location</th>
                  <th className="px-3 py-2 text-center w-28 hidden lg:table-cell">Required By</th>
                  <th className="px-3 py-2 text-center w-24">Priority</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading site indents...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No material requests found matching criteria.
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
                          {r.request_no}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.purpose}>
                            {r.purpose || 'Material Indent'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] text-text-secondary truncate block" title={r.site_name}>
                            {r.site_name || 'Unassigned Site'}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden lg:table-cell font-mono text-[11px]">
                        <span className="text-text-primary font-medium">{r.required_by_date}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getPriorityVariant(r.priority_name)}
                          className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center leading-none rounded-full"
                        >
                          {r.priority_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(r.status_name)}
                          className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center leading-none rounded-full"
                        >
                          {r.status_name}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Indent 360"
                            onClick={() => handleOpenView(r)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {(r.status_name === 'Submitted' || r.status === 'Pending Approval') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve Indent"
                                onClick={() => handleApprove(r)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Reject Indent"
                                onClick={() => handleReject(r)}
                              >
                                <XCircle className="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                              </Button>
                            </>
                          )}
                          {(r.status_code || r.status_name || '').toUpperCase().includes('DRAFT') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit"
                              onClick={() => handleOpenEdit(r)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.request_no}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.site_name}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={getStatusVariant(r.status_name || r.status)}
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                  >
                    {r.status_name || r.status}
                  </Badge>
                  <Badge
                    variant={getPriorityVariant(r.priority)}
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                  >
                    {r.priority}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Required Qty</span>
                  <span className="font-mono font-bold text-primary text-[12px]">{r.requested_qty} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Required By</span>
                  <span className="font-mono text-text-primary text-[11px]">{r.required_by_date}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                 <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenView(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                {(r.status_code || r.status_name || '').toUpperCase().includes('DRAFT') && (
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(r)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                )}
                {(r.status_name === 'Submitted' || r.status === 'Pending Approval') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(r)}>
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                )}
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

      {/* View Indent 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.request_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.project_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Requested Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.requested_qty} {viewingItem.uom}</span></div>
                 <div><span className="text-text-muted block text-[10px] uppercase font-bold">Priority Level</span> <span className="font-semibold text-red-600">{viewingItem.priority_name || viewingItem.priority}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Request Date</span> <span className="font-mono">{viewingItem.request_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Required On Site By</span> <span className="font-mono font-bold text-text-primary">{viewingItem.required_by_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status_name || viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Requested By</span> <span className="text-text-primary">{viewingItem.requested_by}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Site Delivery Location</span> <span className="text-text-primary font-medium">{viewingItem.site_name}</span></div>
              </div>

              {viewingItem.purpose && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Work Scope & Justification:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.purpose}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Indent Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Send}
          title={editingItem ? 'Edit Material Indent' : 'Raise Site Material Indent (MRN)'}
          subtitle="Submit formal requisition for cement, steel rebar, sand, bricks, or chemicals."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="mrn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Project & Location Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Indent Number" required error={errors.request_no}>
                  <Input
                    value={form.request_no}
                    onChange={(e) => handleFormChange('request_no', e.target.value)}
                    placeholder="MRN-2026-085"
                  />
                </FormField>

                <FormField label="Site Location / Grid Zone" required error={errors.site_id} className="md:col-span-2">
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                    placeholder="Select Yard/Site Location"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Requirement & Urgency">
              <EntityEditModal.Grid>
                <FormField label="Material Item" required error={errors.material_id}>
                  <Select
                    options={materials.map(m => ({ value: String(m.id), label: `${m.material_code} - ${m.material_name}` }))}
                    value={form.material_id}
                    onChange={(v) => {
                      const selectedMat = materials.find(mat => String(mat.id) === String(v));
                      handleFormChange('material_id', v);
                      if (selectedMat?.base_uom_id) {
                        handleFormChange('uom_id', String(selectedMat.base_uom_id));
                      }
                    }}
                    placeholder="Select Material"
                  />
                </FormField>

                <FormField label="Required Quantity">
                  <Input
                    type="number"
                    value={form.requested_qty}
                    onChange={(e) => handleFormChange('requested_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Priority Level" required error={errors.priority_id}>
                  <Select
                    options={priorities.map(p => ({ value: String(p.id), label: p.priority_name }))}
                    value={form.priority_id}
                    onChange={(v) => handleFormChange('priority_id', v)}
                    placeholder="Select Priority"
                  />
                </FormField>

                <FormField label="Required By Date">
                  <Input
                    type="date"
                    value={form.required_by_date}
                    onChange={(e) => handleFormChange('required_by_date', e.target.value)}
                  />
                </FormField>

                <FormField label="Purpose & Activity Scope" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.purpose}
                    onChange={(e) => handleFormChange('purpose', e.target.value)}
                    placeholder="Describe specific concrete pour, column shuttering line, plastering room..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="mrn-form"
            submitLabel={editingItem ? 'Update Indent' : 'Submit Indent'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Material Request"
        message={`Are you sure you want to delete "${deleteItem?.request_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
