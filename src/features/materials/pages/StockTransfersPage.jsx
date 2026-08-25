import { useState, useEffect, useMemo } from 'react';
import {
  Truck, CheckCircle2, ArrowRight, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, Building,
  ShieldCheck, Check, AlertCircle, Sparkles, MapPin, Printer
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
  transfer_no: '',
  transfer_date: '',
  from_site_name: 'Central Godown Bay 1',
  to_site_name: 'Site Yard',
  vehicle_no: '',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  transfer_qty: '50',
  uom: 'Bags',
  unit_rate: '385',
  transfer_value: '19250',
  status: 'In-Transit',
  dispatched_by: 'Store Incharge',
  purpose: '',
};

export function StockTransfersPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
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

  
  // --- MOCK PERSISTENCE INJECTED ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_materials_StockTransfersPage');
      if (saved) {
        setTransfers(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_materials_StockTransfersPage');
    if (transfers.length > 0 || saved) {
       localStorage.setItem('mock_materials_StockTransfersPage', JSON.stringify(transfers));
    }
  }, [transfers]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      transfer_no: `STN-2026-04${transfers.length + 1}`,
      transfer_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      transfer_no: item.transfer_no || '',
      transfer_date: item.transfer_date || '',
      from_site_name: item.from_site_name || '',
      to_site_name: item.to_site_name || '',
      vehicle_no: item.vehicle_no || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      transfer_qty: String(item.transfer_qty || '50'),
      uom: item.uom || 'Nos',
      unit_rate: String(item.unit_rate || '385'),
      transfer_value: String(item.transfer_value || '19250'),
      status: item.status || 'In-Transit',
      dispatched_by: item.dispatched_by || 'Store Incharge',
      purpose: item.purpose || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'transfer_qty' || field === 'unit_rate') {
        const qty = Number(field === 'transfer_qty' ? value : prev.transfer_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        next.transfer_value = String(Math.round(qty * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.transfer_no.trim()) errs.transfer_no = 'Transfer No is required';
    if (!form.material_name.trim()) errs.material_name = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const qty = Number(form.transfer_qty || 0);
      const rate = Number(form.unit_rate || 0);

      const newTransfer = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        transfer_no: form.transfer_no,
        transfer_date: form.transfer_date,
        from_site_name: form.from_site_name,
        to_site_name: form.to_site_name,
        vehicle_no: form.vehicle_no,
        material_code: form.material_code,
        material_name: form.material_name,
        transfer_qty: qty,
        uom: form.uom,
        unit_rate: rate,
        transfer_value: Number(form.transfer_value || qty * rate),
        status: form.status,
        dispatched_by: form.dispatched_by,
        purpose: form.purpose,
      };

      if (editingItem?.id) {
        setTransfers(prev => prev.map(t => t.id === editingItem.id ? newTransfer : t));
        toast.success('Stock transfer updated.');
      } else {
        setTransfers(prev => [newTransfer, ...prev]);
        toast.success('Inter-site stock transfer note (STN) created.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save stock transfer.');
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = (item) => {
    setTransfers(prev => prev.map(t => t.id === item.id ? { ...t, status: 'Received & Accepted' } : t));
    toast.success(`Transfer ${item.transfer_no} marked as received at destination site.`);
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setTransfers(prev => prev.filter(t => t.id !== deleteItem.id));
    toast.success('Stock transfer removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered List
  const filtered = useMemo(() => {
    return transfers.filter(t => {
      if (selectedProjectId !== 'all' && String(t.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = (t.transfer_no || '').toLowerCase();
        const from = (t.from_site_name || '').toLowerCase();
        const to = (t.to_site_name || '').toLowerCase();
        const mat = (t.material_name || '').toLowerCase();
        const veh = (t.vehicle_no || '').toLowerCase();
        if (!no.includes(q) && !from.includes(q) && !to.includes(q) && !mat.includes(q) && !veh.includes(q)) return false;
      }
      return true;
    });
  }, [transfers, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalTransferValue = useMemo(() => transfers.reduce((acc, t) => acc + Number(t.transfer_value || 0), 0), [transfers]);
  const inTransitCount = useMemo(() => transfers.filter(t => t.status === 'In-Transit').length, [transfers]);

  const getStatusVariant = (status) => {
    if (status === 'Received & Accepted') return 'success';
    if (status === 'In-Transit') return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Stock Transfers' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Inter-Site Stock Transfer Notes (STN)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total STN Transfers"
            value={transfers.length}
            status="primary"
            icon={<Truck className="w-4 h-4" />}
          />
          <KpiCard
            label="Transfers In-Transit"
            value={`${inTransitCount} Loads`}
            status={inTransitCount > 0 ? 'info' : 'success'}
            icon={<MapPin className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Total Transfer Value"
            value={`₹${totalTransferValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Transfer Health"
            value="100% Tracked"
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

            <div className="w-full sm:w-44">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'In-Transit', label: 'In-Transit (On Road)' },
                  { value: 'Received & Accepted', label: 'Received & Accepted' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search STN, origin, destination, vehicle..."
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
              title="Print Transfer Register"
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
              New Stock Transfer (STN)
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
                  <th className="px-3 py-2 w-28">STN No.</th>
                  <th className="px-3 py-2">Transfer Route (From ➔ To)</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Vehicle No.</th>
                  <th className="px-3 py-2 text-right w-24">Qty Sent</th>
                  <th className="px-3 py-2 text-right w-28">Total Value</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading stock transfers...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No stock transfers found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {t.transfer_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{t.transfer_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-text-primary text-[12px] truncate" title={t.from_site_name}>
                            {t.from_site_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                            ➔ <span className="text-primary font-semibold">{t.to_site_name}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={t.material_name}>
                          {t.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {t.vehicle_no || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {t.transfer_qty} {t.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(t.transfer_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(t.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View STN 360"
                            onClick={() => setViewingItem(t)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {t.status === 'In-Transit' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              title="Receive & Accept at Destination"
                              onClick={() => handleAcknowledge(t)}
                            >
                              <Check className="w-3 h-3 mr-0.5" /> Receive
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(t)}
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
          {paged.map((t, idx) => (
            <div key={t.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{t.transfer_no} • {t.transfer_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{t.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{t.from_site_name} ➔ {t.to_site_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(t.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {t.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Qty Sent</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{t.transfer_qty} {t.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Transfer Value</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(t.transfer_value).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(t)}>
                  <Eye className="w-3 h-3 mr-1" /> View STN
                </Button>
                {t.status === 'In-Transit' && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAcknowledge(t)}>
                    <Check className="w-3 h-3 mr-1" /> Receive
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

      {/* View STN 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.transfer_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.transfer_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transfer Quantity</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.transfer_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transfer Value</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.transfer_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transit Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transport Vehicle</span> <span className="font-mono text-text-primary">{viewingItem.vehicle_no || 'Site Internal Cart'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Origin Location</span> <span className="text-text-primary font-medium">{viewingItem.from_site_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Destination Site</span> <span className="text-primary font-bold">{viewingItem.to_site_name}</span></div>
              </div>

              {viewingItem.purpose && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Transfer Purpose:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.purpose}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Transfer Pass
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit STN Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Truck}
          title={editingItem ? 'Edit Stock Transfer (STN)' : 'New Inter-Site Stock Transfer (STN)'}
          subtitle="Dispatch stock between central warehouse, godowns, and active project site yards."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="stn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Transfer Routing & Vehicle">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="Transfer Note Number" required error={errors.transfer_no}>
                  <Input
                    value={form.transfer_no}
                    onChange={(e) => handleFormChange('transfer_no', e.target.value)}
                    placeholder="STN-2026-045"
                  />
                </FormField>

                <FormField label="From (Origin Store)" required>
                  <Input
                    value={form.from_site_name}
                    onChange={(e) => handleFormChange('from_site_name', e.target.value)}
                    placeholder="e.g. Central Godown Bay 1"
                  />
                </FormField>

                <FormField label="To (Destination Site)" required>
                  <Input
                    value={form.to_site_name}
                    onChange={(e) => handleFormChange('to_site_name', e.target.value)}
                    placeholder="e.g. Tower A Core - Level 2 Yard"
                  />
                </FormField>

                <FormField label="Vehicle Number" className="md:col-span-2">
                  <Input
                    value={form.vehicle_no}
                    onChange={(e) => handleFormChange('vehicle_no', e.target.value)}
                    placeholder="TN-45-AZ-9901"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Transfer Quantities">
              <EntityEditModal.Grid>
                <FormField label="Material Item" required error={errors.material_name}>
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement"
                  />
                </FormField>

                <FormField label="Transfer Quantity">
                  <Input
                    type="number"
                    value={form.transfer_qty}
                    onChange={(e) => handleFormChange('transfer_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Valuation Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Total Value (₹)">
                  <Input
                    readOnly
                    className="font-mono font-bold text-primary bg-surface-muted"
                    value={`₹${Number(form.transfer_value).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Transfer Purpose" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.purpose}
                    onChange={(e) => handleFormChange('purpose', e.target.value)}
                    placeholder="Describe specific reason or urgent pour requirements..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="stn-form"
            submitLabel={editingItem ? 'Update STN' : 'Dispatch Transfer'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Stock Transfer"
        message={`Are you sure you want to delete "${deleteItem?.transfer_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
