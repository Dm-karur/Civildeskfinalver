import { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownToLine, CheckCircle2, XCircle, Clock, IndianRupee,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight, Truck,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Layers, Printer
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
import { projectsApi, materialManagementApi, sitesApi, materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';



const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  receipt_no: '',
  receipt_date: '',
  supplier_id: '',
  supplier_challan_no: '',
  invoice_no: '',
  vehicle_no: '',
  material_id: '',
  uom_id: '',
  received_qty: '100',
  unit_rate: '385',
  quality_status: '',
  notes: '',
};

export function StockReceiptsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [receipts, setReceipts] = useState([]);
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

  const [sites, setSites] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [qualityStatuses, setQualityStatuses] = useState([]);

  // Load Projects & API Data safely
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      sitesApi.list().catch(() => ({ data: [] })),
      materialsApi.suppliers.list().catch(() => ({ data: [] })),
      materialsApi.catalogue.list().catch(() => ({ data: [] })),
      materialsApi.masters().catch(() => ({ data: {} })),
      materialManagementApi.receipts?.list ? materialManagementApi.receipts.list().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([projRes, sitesRes, suppRes, catRes, mastersRes, recRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      const parsedProjects = Array.isArray(pList) ? pList : [];
      setProjects(parsedProjects);

      const sList = sitesRes?.data?.sites ?? sitesRes?.sites ?? (Array.isArray(sitesRes) ? sitesRes : []);
      setSites(Array.isArray(sList) ? sList : []);

      const supList = suppRes?.data?.material_suppliers ?? suppRes?.material_suppliers ?? (Array.isArray(suppRes) ? suppRes : []);
      setSuppliers(Array.isArray(supList) ? supList : []);

      const mList = catRes?.data?.materials ?? catRes?.materials ?? (Array.isArray(catRes) ? catRes : []);
      setMaterials(Array.isArray(mList) ? mList : []);

      const mastersData = mastersRes?.data?.masters ?? mastersRes?.masters ?? {};
      const uList = mastersData?.units ?? [];
      setUoms(Array.isArray(uList) ? uList : []);

      const qList = mastersData?.quality_statuses ?? [];
      setQualityStatuses(Array.isArray(qList) ? qList : []);

      const rList = recRes?.data?.material_receipts ?? recRes?.data?.receipts ?? recRes?.data?.data ?? [];
      if (Array.isArray(rList)) {
        const normalized = rList.map((r, idx) => {
          const project = parsedProjects.find(p => String(p.id) === String(r.project_id));
          const site = sList.find(s => String(s.id) === String(r.site_id));
          const supplier = supList.find(s => String(s.id) === String(r.supplier_id));

          return {
            ...r,
            id: r.id || idx + 1,
            project_code: project?.project_code || 'PRJ-2026-001',
            project_name: project?.project_name || 'Civil Project',
            site_name: site?.site_name || 'Main Central Yard',
            supplier_name: supplier?.supplier_name || 'Supplier Partner',
            supplier_challan_no: r.supplier_challan_no || '—',
            invoice_no: r.invoice_no || '—',
            vehicle_no: r.vehicle_no || '—',
            material_code: r.material_code || 'MAT-GEN-001',
            material_name: r.material_name || 'Construction Material',
            received_qty: Number(r.received_qty || r.quantity || 0),
            uom: r.uom || r.unit_name || 'Nos',
            unit_rate: Number(r.unit_rate || 0),
            total_amount: 0, // due to valuation constraint
            quality_status: r.status_name || 'Accepted (QC Passed)',
            status_name: r.status_name || 'Received & Stored',
            inspected_by: r.inspected_by || 'QC Engineer',
            notes: r.notes || '',
          };
        });
        setReceipts(normalized);
      }
    }).catch(() => {
      // Keep DEFAULT_RECEIPTS on API error
    }).finally(() => setLoading(false));
  }, []);

  
  // --- MOCK PERSISTENCE INJECTED ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mock_materials_StockReceiptsPage');
      if (saved) {
        setReceipts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load mock data', e);
    }
  }, []);

  useEffect(() => {
    // Only save if we have manipulated the array (to avoid overwriting initial state on mount with empty array if they load async, 
    // but for purely mock pages, saving the current state on every change is correct).
    // To be safe, we check if there's at least something, or if there's a saved version already.
    const saved = localStorage.getItem('mock_materials_StockReceiptsPage');
    if (receipts.length > 0 || saved) {
       localStorage.setItem('mock_materials_StockReceiptsPage', JSON.stringify(receipts));
    }
  }, [receipts]);
  // ---------------------------------

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      receipt_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = async (item) => {
    setLoading(true);
    try {
      const res = await materialManagementApi.receipts.get(item.id);
      const fullReceipt = res?.data?.receipt ?? res?.receipt ?? {};
      const firstItem = fullReceipt.items?.[0] ?? {};

      setForm({
        project_id: String(fullReceipt.project_id || ''),
        site_id: String(fullReceipt.site_id || ''),
        receipt_no: fullReceipt.receipt_no || '',
        receipt_date: fullReceipt.receipt_date || '',
        supplier_id: String(fullReceipt.supplier_id || ''),
        supplier_challan_no: fullReceipt.supplier_challan_no || '',
        invoice_no: fullReceipt.invoice_no || '',
        vehicle_no: fullReceipt.vehicle_no || '',
        material_id: String(firstItem.material_id || ''),
        uom_id: String(firstItem.uom_id || ''),
        received_qty: String(firstItem.received_qty || '100'),
        unit_rate: String(firstItem.unit_rate || '385'),
        quality_status: String(firstItem.quality_status_id || ''),
        notes: fullReceipt.remarks || '',
      });
      setErrors({});
      setEditingItem(fullReceipt);
    } catch {
      toast.error('Failed to load goods receipt details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'received_qty' || field === 'unit_rate') {
        const qty = Number(field === 'received_qty' ? value : prev.received_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        next.total_amount = String(Math.round(qty * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.receipt_no.trim()) errs.receipt_no = 'GRN No is required';
    if (!form.supplier_id) errs.supplier_id = 'Supplier is required';
    if (!form.site_id) errs.site_id = 'Site location is required';
    if (!form.material_id) errs.material_id = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      if (editingItem?.id) {
        await materialManagementApi.receipts.update(editingItem.id, {
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          supplier_id: Number(form.supplier_id),
          receipt_no: form.receipt_no,
          receipt_date: form.receipt_date,
          supplier_challan_no: form.supplier_challan_no,
          invoice_no: form.invoice_no,
          vehicle_no: form.vehicle_no,
          remarks: form.notes
        });
        
        const firstItem = editingItem.items?.[0];
        if (firstItem?.id) {
          await materialManagementApi.receipts.updateItem(editingItem.id, firstItem.id, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            received_qty: Number(form.received_qty),
            unit_rate: Number(form.unit_rate),
            accepted_qty: Number(form.received_qty),
            quality_status_id: form.quality_status ? Number(form.quality_status) : null
          });
        }
        toast.success('Goods receipt updated.');
      } else {
        const headerRes = await materialManagementApi.receipts.create({
          project_id: Number(form.project_id),
          site_id: Number(form.site_id),
          supplier_id: Number(form.supplier_id),
          receipt_no: form.receipt_no,
          receipt_date: form.receipt_date,
          supplier_challan_no: form.supplier_challan_no,
          invoice_no: form.invoice_no,
          vehicle_no: form.vehicle_no,
          remarks: form.notes
        });

        const receiptId = headerRes?.data?.receipt?.id ?? headerRes?.receipt?.id;
        if (receiptId) {
          await materialManagementApi.receipts.addItem(receiptId, {
            material_id: Number(form.material_id),
            uom_id: Number(form.uom_id),
            received_qty: Number(form.received_qty),
            unit_rate: Number(form.unit_rate),
            accepted_qty: Number(form.received_qty),
            quality_status_id: form.quality_status ? Number(form.quality_status) : null
          });
        }
        toast.success('Goods received note (GRN) logged into inventory.');
      }

      setIsAddOpen(false);
      setEditingItem(null);

      // Reload receipts to fetch the updated database entries
      setLoading(true);
      const recRes = await materialManagementApi.receipts.list();
      const rList = recRes?.data?.material_receipts ?? recRes?.data?.receipts ?? recRes?.data?.data ?? [];
      if (Array.isArray(rList)) {
        const normalized = rList.map((r, idx) => {
          const project = projects.find(p => String(p.id) === String(r.project_id));
          const site = sites.find(s => String(s.id) === String(r.site_id));
          const supplier = suppliers.find(s => String(s.id) === String(r.supplier_id));

          return {
            ...r,
            id: r.id || idx + 1,
            project_code: project?.project_code || 'PRJ-2026-001',
            project_name: project?.project_name || 'Civil Project',
            site_name: site?.site_name || 'Main Central Yard',
            supplier_name: supplier?.supplier_name || 'Supplier Partner',
            supplier_challan_no: r.supplier_challan_no || '—',
            invoice_no: r.invoice_no || '—',
            vehicle_no: r.vehicle_no || '—',
            material_code: r.material_code || 'MAT-GEN-001',
            material_name: r.material_name || 'Construction Material',
            received_qty: Number(r.received_qty || r.quantity || 0),
            uom: r.uom || r.unit_name || 'Nos',
            unit_rate: Number(r.unit_rate || 0),
            total_amount: 0,
            quality_status: r.status_name || 'Accepted (QC Passed)',
            status_name: r.status_name || 'Received & Stored',
            inspected_by: r.inspected_by || 'QC Engineer',
            notes: r.notes || '',
          };
        });
        setReceipts(normalized);
      }
    } catch {
      toast.error('Failed to save goods receipt.');
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setReceipts(prev => prev.filter(r => r.id !== deleteItem.id));
    toast.success('Goods receipt removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return receipts.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && String(r.quality_status || '').toUpperCase() !== String(statusFilter).toUpperCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        const no = String(r.receipt_no || '').toLowerCase();
        const sup = String(r.supplier_name || '').toLowerCase();
        const mat = String(r.material_name || '').toLowerCase();
        const ch = String(r.supplier_challan_no || '').toLowerCase();
        const veh = String(r.vehicle_no || '').toLowerCase();
        if (!no.includes(q) && !sup.includes(q) && !mat.includes(q) && !ch.includes(q) && !veh.includes(q)) return false;
      }
      return true;
    });
  }, [receipts, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics with safe fallbacks
  const totalInwardValue = useMemo(() => receipts.reduce((acc, r) => acc + Number(r.total_amount || 0), 0), [receipts]);
  const qcPassedCount = useMemo(() => receipts.filter(r => {
    const q = String(r.quality_status || '').toLowerCase();
    return q.includes('accept') || q.includes('pass');
  }).length, [receipts]);

  const getQualityVariant = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('ACCEPT') || s === 'POSTED') return 'success';
    if (s.includes('INSPECT') || s === 'DRAFT' || s === 'SUBMITTED') return 'warning';
    if (s.includes('REJECT') || s.includes('CANCEL')) return 'error';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Stock Receipts' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Inward Goods Receipts (GRN) & Gate Entry"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Inward GRNs"
            value={receipts.length}
            status="primary"
            icon={<ArrowDownToLine className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Inward Value"
            value={`₹${totalInwardValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="QC Accepted Deliveries"
            value={`${qcPassedCount} Lots`}
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Vehicles Inward Gate"
            value={`${receipts.length} Trucks`}
            status="neutral"
            icon={<Truck className="w-4 h-4 text-primary" />}
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
                  { value: 'all', label: 'All Quality Status' },
                  { value: 'POSTED', label: 'Posted' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'ACCEPTED', label: 'Accepted' },
                  { value: 'PARTIALLY_ACCEPTED', label: 'Partially Accepted' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search GRN, supplier, vehicle, challan..."
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
              title="Print Inward Register"
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
              Inward Receipt (GRN)
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
                  <th className="px-3 py-2 w-28">GRN No.</th>
                  <th className="px-3 py-2">Supplier & Challan</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Vehicle No.</th>
                  <th className="px-3 py-2 text-right w-24">Received Qty</th>
                  <th className="px-3 py-2 text-right w-28">Total Value</th>
                  <th className="px-3 py-2 text-center w-28">Quality Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading stock receipts...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No goods receipts found matching criteria.
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
                          {r.receipt_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.receipt_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.supplier_name}>
                            {r.supplier_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            DC: {r.supplier_challan_no} • Inv: {r.invoice_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.material_name}>
                            {r.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {r.vehicle_no || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {r.received_qty} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(r.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getQualityVariant(r.quality_status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {r.quality_status || 'Accepted'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View GRN 360"
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeleteItem(r)}
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((r, idx) => (
            <div key={r.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.receipt_no} • {r.receipt_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.supplier_name}</span>
                </div>
                <Badge
                  variant={getQualityVariant(r.quality_status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.quality_status || 'Accepted'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Received Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.received_qty} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Total Value</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(r.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono">{r.vehicle_no}</span>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(r)}>
                  <Eye className="w-3 h-3 mr-1" /> View GRN
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

      {/* View GRN 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.receipt_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.supplier_name} • {viewingItem.receipt_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Material Delivered</span> <span className="font-semibold text-text-primary">{viewingItem.material_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Quantity Inwarded</span> <span className="font-bold text-primary font-mono text-sm">{viewingItem.received_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total Inward Value</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.total_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Quality Inspection</span> <span className="font-semibold text-emerald-600">{viewingItem.quality_status}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Supplier Challan</span> <span className="font-mono">{viewingItem.supplier_challan_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Vehicle</span> <span className="font-mono text-text-primary">{viewingItem.vehicle_no}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Yard Storage Bay</span> <span className="text-text-primary font-medium">{viewingItem.site_name}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">QA/QC Engineer Remarks:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print GRN Slip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit GRN Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={ArrowDownToLine}
          title={editingItem ? 'Edit Goods Receipt (GRN)' : 'Inward Goods Receipt (GRN)'}
          subtitle="Log supplier gate delivery, vehicle challan, received quantities, and QC verification."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="grn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Supplier & Delivery Gate Entry">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="GRN Number" required error={errors.receipt_no}>
                  <Input
                    value={form.receipt_no}
                    onChange={(e) => handleFormChange('receipt_no', e.target.value)}
                    placeholder="GRN-2026-085"
                  />
                </FormField>

                 <FormField label="Supplier" required error={errors.supplier_id} className="md:col-span-2">
                  <Select
                    options={suppliers.map(s => ({ value: String(s.id), label: s.supplier_name }))}
                    value={form.supplier_id}
                    onChange={(v) => handleFormChange('supplier_id', v)}
                    placeholder="Select Supplier"
                  />
                </FormField>

                <FormField label="Supplier Delivery Challan">
                  <Input
                    value={form.supplier_challan_no}
                    onChange={(e) => handleFormChange('supplier_challan_no', e.target.value)}
                    placeholder="DC-9812"
                  />
                </FormField>

                <FormField label="Vehicle Number">
                  <Input
                    value={form.vehicle_no}
                    onChange={(e) => handleFormChange('vehicle_no', e.target.value)}
                    placeholder="TN-45-AZ-1024"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Material Inward & QC Inspection">
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

                <FormField label="Received Quantity">
                  <Input
                    type="number"
                    value={form.received_qty}
                    onChange={(e) => handleFormChange('received_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Valuation Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Quality Inspection Status">
                  <Select
                    options={qualityStatuses.map(q => ({ value: String(q.id), label: q.quality_status_name }))}
                    value={form.quality_status}
                    onChange={(v) => handleFormChange('quality_status', v)}
                    placeholder="Select Quality Status"
                  />
                </FormField>

                <FormField label="Storage Bay Location" required error={errors.site_id} className="md:col-span-2">
                  <Select
                    options={sites.filter(s => String(s.project_id) === String(form.project_id)).map(s => ({ value: String(s.id), label: s.site_name }))}
                    value={form.site_id}
                    onChange={(v) => handleFormChange('site_id', v)}
                    placeholder="Select Yard/Site Location"
                  />
                </FormField>

                <FormField label="QC Notes & Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Test certificate verified, weighbridge slip reference..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="grn-form"
            submitLabel={editingItem ? 'Update GRN' : 'Inward to Inventory'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Goods Receipt"
        message={`Are you sure you want to delete "${deleteItem?.receipt_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
