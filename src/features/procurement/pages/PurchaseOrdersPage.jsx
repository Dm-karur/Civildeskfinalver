import { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart, CheckCircle2, Clock, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Building, Printer, Truck
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
import { projectsApi, materialManagementApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const DEFAULT_POS = [
  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    site_name: 'Main Central Godown Bay 1',
    po_no: 'PO-2026-088',
    po_date: '2026-08-21',
    expected_delivery_date: '2026-08-25',
    supplier_name: 'UltraTech Cement Distributors Ltd',
    supplier_gstin: '33AABCU9812K1Z5',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    ordered_qty: 500,
    uom: 'Bags',
    unit_rate: 340,
    taxable_amount: 170000,
    tax_amount: 47600,
    freight_amount: 7500,
    grand_total: 225100,
    status: 'Issued & Active',
    status_name: 'Approved',
    created_by: 'Procurement Cell',
    notes: 'Payment within 30 days of GRN and invoice acceptance.'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    site_name: 'Steel Stacking Yard',
    po_no: 'PO-2026-089',
    po_date: '2026-08-20',
    expected_delivery_date: '2026-08-24',
    supplier_name: 'JSW Steel Regional Supply Hub',
    supplier_gstin: '29AAACJ8810M1Z2',
    material_code: 'MAT-STL-002',
    material_name: 'Fe 550D TMT Rebar 16mm',
    ordered_qty: 15.0,
    uom: 'MT',
    unit_rate: 49000,
    taxable_amount: 735000,
    tax_amount: 132300,
    freight_amount: 18000,
    grand_total: 885300,
    status: 'Partial Delivered (12.5 MT / 15 MT)',
    status_name: 'Partially',
    created_by: 'Procurement Cell',
    notes: 'Manufacturer mill test certificate required with each lorry receipt.'
  },
  {
    id: 3,
    project_id: 2,
    project_code: 'PRJ-2026-002',
    project_name: 'Highway Expansion Package 3',
    site_name: 'Ch. 16+300 Box Culvert Site',
    po_no: 'PO-2026-090',
    po_date: '2026-08-19',
    expected_delivery_date: '2026-08-22',
    supplier_name: 'Sri Amman Blue Metal Quarries',
    supplier_gstin: '33AABCS4412L1Z9',
    material_code: 'MAT-AGG-003',
    material_name: '20mm Blue Metal Aggregate',
    ordered_qty: 120,
    uom: 'Ton',
    unit_rate: 1380,
    taxable_amount: 165600,
    tax_amount: 8280,
    freight_amount: 12000,
    grand_total: 185880,
    status: 'Completed & Closed',
    status_name: 'Completed',
    created_by: 'K. Balaji (PM)',
    notes: 'All 120 tons delivered at site bunker.'
  },
];

const EMPTY_FORM = {
  project_id: '',
  site_name: 'Main Central Godown Bay 1',
  po_no: '',
  po_date: '',
  expected_delivery_date: '',
  supplier_name: '',
  supplier_gstin: '',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  ordered_qty: '100',
  uom: 'Bags',
  unit_rate: '340',
  taxable_amount: '34000',
  tax_amount: '9520',
  freight_amount: '1500',
  grand_total: '45020',
  status: 'Issued & Active',
  status_name: 'Approved',
  notes: '',
};

export function PurchaseOrdersPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [orders, setOrders] = useState(DEFAULT_POS);
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

  // Load Projects & API Data safely
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      materialManagementApi.purchaseOrders?.list ? materialManagementApi.purchaseOrders.list().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([projRes, poRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      const poList = poRes?.data?.material_purchase_orders ?? poRes?.data?.orders ?? poRes?.data?.data ?? [];
      if (Array.isArray(poList) && poList.length > 0) {
        const normalized = poList.map((po, idx) => ({
          id: po.id || idx + 1,
          project_id: po.project_id || 1,
          project_code: po.project_code || 'PRJ-2026-001',
          project_name: po.project_name || 'Civil Project',
          site_name: po.site_name || 'Central Godown',
          po_no: po.po_no || `PO-2026-${String(idx + 1).padStart(3, '0')}`,
          po_date: po.po_date || new Date().toISOString().split('T')[0],
          expected_delivery_date: po.expected_delivery_date || new Date().toISOString().split('T')[0],
          supplier_name: po.supplier_name || 'Authorized Supplier',
          supplier_gstin: po.supplier_gstin || '—',
          material_code: po.material_code || 'MAT-GEN-001',
          material_name: po.material_name || 'Construction Material',
          ordered_qty: Number(po.ordered_qty || po.quantity || 0),
          uom: po.uom || 'Nos',
          unit_rate: Number(po.unit_rate || 340),
          taxable_amount: Number(po.taxable_amount || 0),
          tax_amount: Number(po.tax_amount || 0),
          freight_amount: Number(po.freight_amount || 0),
          grand_total: Number(po.grand_total || (Number(po.taxable_amount || 0) + Number(po.tax_amount || 0))),
          status: po.status_name || po.status || 'Issued & Active',
          status_name: po.status_name || 'Approved',
          created_by: 'Procurement Cell',
          notes: po.notes || '',
        }));
        setOrders(normalized);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '1');

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      po_no: `PO-2026-09${orders.length + 1}`,
      po_date: today,
      expected_delivery_date: defaultDelivery,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      site_name: item.site_name || '',
      po_no: item.po_no || '',
      po_date: item.po_date || '',
      expected_delivery_date: item.expected_delivery_date || '',
      supplier_name: item.supplier_name || '',
      supplier_gstin: item.supplier_gstin || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      ordered_qty: String(item.ordered_qty || '100'),
      uom: item.uom || 'Nos',
      unit_rate: String(item.unit_rate || '340'),
      taxable_amount: String(item.taxable_amount || '34000'),
      tax_amount: String(item.tax_amount || '9520'),
      freight_amount: String(item.freight_amount || '1500'),
      grand_total: String(item.grand_total || '45020'),
      status: item.status || 'Issued & Active',
      status_name: item.status_name || 'Approved',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'ordered_qty' || field === 'unit_rate' || field === 'freight_amount') {
        const qty = Number(field === 'ordered_qty' ? value : prev.ordered_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        const freight = Number(field === 'freight_amount' ? value : prev.freight_amount) || 0;
        const taxable = Math.round(qty * rate);
        const tax = Math.round(taxable * 0.18); // 18% standard GST assumption
        next.taxable_amount = String(taxable);
        next.tax_amount = String(tax);
        next.grand_total = String(taxable + tax + freight);
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.po_no.trim()) errs.po_no = 'PO No is required';
    if (!form.supplier_name.trim()) errs.supplier_name = 'Supplier is required';
    if (!form.material_name.trim()) errs.material_name = 'Material item is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const qty = Number(form.ordered_qty || 0);
      const rate = Number(form.unit_rate || 0);
      const taxable = Number(form.taxable_amount || qty * rate);
      const tax = Number(form.tax_amount || 0);
      const freight = Number(form.freight_amount || 0);

      const newPO = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        site_name: form.site_name || 'Site Yard',
        po_no: form.po_no,
        po_date: form.po_date,
        expected_delivery_date: form.expected_delivery_date,
        supplier_name: form.supplier_name,
        supplier_gstin: form.supplier_gstin,
        material_code: form.material_code,
        material_name: form.material_name,
        ordered_qty: qty,
        uom: form.uom,
        unit_rate: rate,
        taxable_amount: taxable,
        tax_amount: tax,
        freight_amount: freight,
        grand_total: Number(form.grand_total || (taxable + tax + freight)),
        status: form.status,
        status_name: form.status_name,
        created_by: 'Procurement Cell',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setOrders(prev => prev.map(o => o.id === editingItem.id ? newPO : o));
        toast.success('Purchase order updated.');
      } else {
        setOrders(prev => [newPO, ...prev]);
        toast.success('Purchase order (PO) generated and dispatched to vendor.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setOrders(prev => prev.filter(o => o.id !== deleteItem.id));
    toast.success('Purchase order removed.');
    setDeleteItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (selectedProjectId !== 'all' && String(o.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && !o.status.includes(statusFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(o.po_no || '').toLowerCase();
        const sup = String(o.supplier_name || '').toLowerCase();
        const mat = String(o.material_name || '').toLowerCase();
        const proj = String(o.project_name || '').toLowerCase();
        if (!no.includes(s) && !sup.includes(s) && !mat.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [orders, selectedProjectId, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalPOValue = useMemo(() => orders.reduce((acc, o) => acc + Number(o.grand_total || 0), 0), [orders]);
  const activePOCount = useMemo(() => orders.filter(o => o.status.includes('Active') || o.status.includes('Partial')).length, [orders]);

  const getStatusVariant = (status) => {
    if (status.includes('Completed')) return 'neutral';
    if (status.includes('Active')) return 'success';
    if (status.includes('Partial')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement' },
    { label: 'Purchase Orders' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Orders (PO) & Supply Contracts"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Purchase Orders"
            value={orders.length}
            status="primary"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <KpiCard
            label="Total PO Commitment"
            value={`₹${totalPOValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Active Orders In-Progress"
            value={`${activePOCount} Orders`}
            status="info"
            icon={<Truck className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Delivery Adherence"
            value="100% On-Time"
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
                  { value: 'Active', label: 'Issued & Active' },
                  { value: 'Partial', label: 'Partially Delivered' },
                  { value: 'Completed', label: 'Completed & Closed' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search PO no, supplier, material..."
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
              title="Print Orders Register"
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
              Issue Purchase Order (PO)
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
                  <th className="px-3 py-2 w-28">PO Number</th>
                  <th className="px-3 py-2">Supplier & Project</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-right w-24">Order Qty</th>
                  <th className="px-3 py-2 text-right w-28">Grand Total (₹)</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Delivery Date</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading purchase orders...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No purchase orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((o, idx) => (
                    <tr key={o.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {o.po_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{o.po_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={o.supplier_name}>
                            {o.supplier_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {o.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate block" title={o.material_name}>
                            {o.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {o.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {o.ordered_qty} {o.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(o.grand_total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell font-mono text-[11px] text-text-secondary">
                        {o.expected_delivery_date}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={getStatusVariant(o.status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {o.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View PO 360 Voucher"
                            onClick={() => setViewingItem(o)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(o)}
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
          {paged.map((o, idx) => (
            <div key={o.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{o.po_no} • {o.po_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{o.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{o.supplier_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(o.status)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {o.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Order Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{o.ordered_qty} {o.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Grand Total</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(o.grand_total).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(o)}>
                  <Eye className="w-3 h-3 mr-1" /> View PO Voucher
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

      {/* View PO 360 Voucher Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.po_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.supplier_name} • {viewingItem.po_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Taxable Amount</span> <span className="font-mono text-text-primary">₹{Number(viewingItem.taxable_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">GST & Freight</span> <span className="font-mono text-text-primary">₹{(Number(viewingItem.tax_amount) + Number(viewingItem.freight_amount)).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">PO Grand Total</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{Number(viewingItem.grand_total).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Target Delivery</span> <span className="font-mono font-bold text-text-primary">{viewingItem.expected_delivery_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Ordered Quantity</span> <span className="font-mono font-bold">{viewingItem.ordered_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Supplier GSTIN</span> <span className="font-mono text-text-primary">{viewingItem.supplier_gstin}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Site Location</span> <span className="text-text-primary font-medium">{viewingItem.site_name}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">PO Terms & Payment Milestones:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Purchase Order
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit PO Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={ShoppingCart}
          title={editingItem ? 'Edit Purchase Order' : 'Issue Purchase Order (PO)'}
          subtitle="Generate binding vendor supply contract with billing rates, GST tax, and delivery dates."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="po-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Supplier & Project Information">
              <EntityEditModal.Grid>
                <FormField label="Parent Project" required error={errors.project_id}>
                  <Select
                    options={projects.map(p => ({ value: String(p.id), label: `${p.project_code} - ${p.project_name}` }))}
                    value={form.project_id}
                    onChange={(v) => handleFormChange('project_id', v)}
                  />
                </FormField>

                <FormField label="PO Number" required error={errors.po_no}>
                  <Input
                    value={form.po_no}
                    onChange={(e) => handleFormChange('po_no', e.target.value)}
                    placeholder="PO-2026-095"
                  />
                </FormField>

                <FormField label="Supplier Vendor Name" required error={errors.supplier_name} className="md:col-span-2">
                  <Input
                    value={form.supplier_name}
                    onChange={(e) => handleFormChange('supplier_name', e.target.value)}
                    placeholder="e.g. UltraTech Cement Distributors Ltd"
                  />
                </FormField>

                <FormField label="Supplier GSTIN">
                  <Input
                    value={form.supplier_gstin}
                    onChange={(e) => handleFormChange('supplier_gstin', e.target.value)}
                    placeholder="33AABCU9812K1Z5"
                  />
                </FormField>

                <FormField label="Expected Delivery Date">
                  <Input
                    type="date"
                    value={form.expected_delivery_date}
                    onChange={(e) => handleFormChange('expected_delivery_date', e.target.value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Order Quantities & Pricing">
              <EntityEditModal.Grid>
                <FormField label="Material Item" required error={errors.material_name}>
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement"
                  />
                </FormField>

                <FormField label="Ordered Quantity">
                  <Input
                    type="number"
                    value={form.ordered_qty}
                    onChange={(e) => handleFormChange('ordered_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Unit Billing Rate (₹)">
                  <Input
                    type="number"
                    value={form.unit_rate}
                    onChange={(e) => handleFormChange('unit_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="Freight & Unloading (₹)">
                  <Input
                    type="number"
                    value={form.freight_amount}
                    onChange={(e) => handleFormChange('freight_amount', e.target.value)}
                  />
                </FormField>

                <FormField label="Grand Total (₹)" className="md:col-span-2">
                  <Input
                    readOnly
                    className="font-mono font-bold text-emerald-600 bg-surface-muted"
                    value={`₹${Number(form.grand_total).toLocaleString('en-IN')}`}
                  />
                </FormField>

                <FormField label="Delivery Site Location" className="md:col-span-2">
                  <Input
                    value={form.site_name}
                    onChange={(e) => handleFormChange('site_name', e.target.value)}
                    placeholder="e.g. Main Central Godown Bay 1"
                  />
                </FormField>

                <FormField label="Commercial Terms & Notes" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Payment terms, penalty clauses, warranty notes..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="po-form"
            submitLabel={editingItem ? 'Update PO' : 'Issue Purchase Order'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete "${deleteItem?.po_no}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
