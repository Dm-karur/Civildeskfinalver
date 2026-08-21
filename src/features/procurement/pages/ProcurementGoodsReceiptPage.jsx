import { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownToLine, CheckCircle2, Clock, IndianRupee, Truck,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
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
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

/* 
const DEFAULT_PROC_GRNS = [

  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    receipt_no: 'GRN-2026-081',
    receipt_date: '2026-08-20',
    po_reference: 'PO-2026-088',
    supplier_name: 'UltraTech Cement Distributors Ltd',
    supplier_challan_no: 'DC-UT-9812',
    vehicle_no: 'TN-45-AZ-1024',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    ordered_qty: 500,
    received_qty: 400,
    pending_po_qty: 100,
    uom: 'Bags',
    unit_rate: 340,
    total_amount: 136000,
    qc_status: 'Accepted (QC Passed)',
    fulfillment_pct: 80,
    inspected_by: 'QA/QC Engineer',
    notes: '400 bags received in batch 1; balance 100 bags to arrive tomorrow.'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    receipt_no: 'GRN-2026-082',
    receipt_date: '2026-08-19',
    po_reference: 'PO-2026-089',
    supplier_name: 'JSW Steel Regional Supply Hub',
    supplier_challan_no: 'JSW-CH-3312',
    vehicle_no: 'KA-01-MJ-8842',
    material_code: 'MAT-STL-002',
    material_name: 'Fe 550D TMT Rebar 16mm',
    ordered_qty: 15.0,
    received_qty: 12.5,
    pending_po_qty: 2.5,
    uom: 'MT',
    unit_rate: 49000,
    total_amount: 612500,
    qc_status: 'Accepted (QC Passed)',
    fulfillment_pct: 83.3,
    inspected_by: 'QA/QC Engineer',
    notes: 'Trailer shipment weighed at bridge. Test tags verified.'
  },
  {
    id: 3,
    project_id: 2,
    project_code: 'PRJ-2026-002',
    project_name: 'Highway Expansion Package 3',
    receipt_no: 'GRN-2026-083',
    receipt_date: '2026-08-21',
    po_reference: 'PO-2026-090',
    supplier_name: 'Sri Amman Blue Metal Quarries',
    supplier_challan_no: 'AMN-8819',
    vehicle_no: 'TN-47-D-9918',
    material_code: 'MAT-AGG-003',
    material_name: '20mm Blue Metal Aggregate',
    ordered_qty: 120,
    received_qty: 120,
    pending_po_qty: 0,
    uom: 'Ton',
    unit_rate: 1380,
    total_amount: 165600,
    qc_status: 'Accepted (QC Passed)',
    fulfillment_pct: 100,
    inspected_by: 'K. Balaji (PM)',
    notes: 'Order 100% fulfilled. Sieve test passed.'
  },
];
*/

const EMPTY_FORM = {
  project_id: '',
  receipt_no: '',
  receipt_date: '',
  po_reference: 'PO-2026-088',
  supplier_name: '',
  supplier_challan_no: '',
  vehicle_no: '',
  material_code: 'MAT-CEM-001',
  material_name: 'OPC 53 Grade Cement',
  ordered_qty: '500',
  received_qty: '100',
  pending_po_qty: '400',
  uom: 'Bags',
  unit_rate: '340',
  total_amount: '34000',
  qc_status: 'Accepted (QC Passed)',
  notes: '',
};

export function ProcurementGoodsReceiptPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [receipts, setReceipts] = useState([]);
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
      receipt_no: `GRN-2026-08${receipts.length + 4}`,
      receipt_date: today,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      project_id: String(item.project_id || '1'),
      receipt_no: item.receipt_no || '',
      receipt_date: item.receipt_date || '',
      po_reference: item.po_reference || '',
      supplier_name: item.supplier_name || '',
      supplier_challan_no: item.supplier_challan_no || '',
      vehicle_no: item.vehicle_no || '',
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      ordered_qty: String(item.ordered_qty || '500'),
      received_qty: String(item.received_qty || '100'),
      pending_po_qty: String(item.pending_po_qty || '400'),
      uom: item.uom || 'Nos',
      unit_rate: String(item.unit_rate || '340'),
      total_amount: String(item.total_amount || '34000'),
      qc_status: item.qc_status || 'Accepted (QC Passed)',
      notes: item.notes || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'ordered_qty' || field === 'received_qty' || field === 'unit_rate') {
        const ord = Number(field === 'ordered_qty' ? value : prev.ordered_qty) || 0;
        const rec = Number(field === 'received_qty' ? value : prev.received_qty) || 0;
        const rate = Number(field === 'unit_rate' ? value : prev.unit_rate) || 0;
        next.pending_po_qty = String(Math.max(0, ord - rec));
        next.total_amount = String(Math.round(rec * rate));
      }
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.receipt_no.trim()) errs.receipt_no = 'GRN No is required';
    if (!form.supplier_name.trim()) errs.supplier_name = 'Supplier is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const ord = Number(form.ordered_qty || 0);
      const rec = Number(form.received_qty || 0);
      const rate = Number(form.unit_rate || 0);

      const newReceipt = {
        id: editingItem?.id || Date.now(),
        project_id: Number(form.project_id || 1),
        project_code: selectedProj?.project_code || 'PRJ-2026-001',
        project_name: selectedProj?.project_name || 'Civil Project',
        receipt_no: form.receipt_no,
        receipt_date: form.receipt_date,
        po_reference: form.po_reference,
        supplier_name: form.supplier_name,
        supplier_challan_no: form.supplier_challan_no,
        vehicle_no: form.vehicle_no,
        material_code: form.material_code,
        material_name: form.material_name,
        ordered_qty: ord,
        received_qty: rec,
        pending_po_qty: Math.max(0, ord - rec),
        uom: form.uom,
        unit_rate: rate,
        total_amount: Number(form.total_amount || rec * rate),
        qc_status: form.qc_status,
        fulfillment_pct: ord > 0 ? Number(((rec / ord) * 100).toFixed(1)) : 100,
        inspected_by: 'QA/QC Engineer',
        notes: form.notes,
      };

      if (editingItem?.id) {
        setReceipts(prev => prev.map(r => r.id === editingItem.id ? newReceipt : r));
        toast.success('Procurement goods receipt updated.');
      } else {
        setReceipts(prev => [newReceipt, ...prev]);
        toast.success('Goods receipt matched against purchase order.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save goods receipt.');
    } finally {
      setSaving(false);
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

  // Filtered List
  const filtered = useMemo(() => {
    return receipts.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const no = String(r.receipt_no || '').toLowerCase();
        const po = String(r.po_reference || '').toLowerCase();
        const sup = String(r.supplier_name || '').toLowerCase();
        const mat = String(r.material_name || '').toLowerCase();
        if (!no.includes(s) && !po.includes(s) && !sup.includes(s) && !mat.includes(s)) return false;
      }
      return true;
    });
  }, [receipts, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalReceivedValue = useMemo(() => receipts.reduce((acc, r) => acc + Number(r.total_amount || 0), 0), [receipts]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'Goods Receipt' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Procurement Goods Receipt & PO Matching"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total PO Deliveries Logged"
            value={receipts.length}
            status="primary"
            icon={<ArrowDownToLine className="w-4 h-4" />}
          />
          <KpiCard
            label="Received Stock Value"
            value={`₹${totalReceivedValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="QC Acceptance Ratio"
            value="100% Passed"
            status="neutral"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Truck Vehicles Inward"
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

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search GRN, PO ref, supplier..."
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
              title="Print Receipt Register"
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
              Receive PO Delivery
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
                  <th className="px-3 py-2 w-28">GRN Voucher</th>
                  <th className="px-3 py-2">Supplier & Challan</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-right w-24">Rec Qty</th>
                  <th className="px-3 py-2 text-right w-24">Pending PO</th>
                  <th className="px-3 py-2 text-right w-28">Value (₹)</th>
                  <th className="px-3 py-2 text-center w-28">QC Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading goods receipts...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No PO-linked goods receipts found.
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
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{r.po_reference}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.supplier_name}>
                            {r.supplier_name}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono truncate">
                            DC: {r.supplier_challan_no} • Veh: {r.vehicle_no}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={r.material_name}>
                          {r.material_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {r.received_qty} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-muted">
                        {r.pending_po_qty} {r.uom}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(r.total_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant="success"
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          QC Passed
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
                  <span className="font-mono text-[10px] font-bold text-primary block">{r.receipt_no} • {r.po_reference}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.supplier_name}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  QC Passed
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Received Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{r.received_qty} {r.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Inward Value</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(r.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1 border-t border-border/60 text-xs">
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
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.po_reference} • {viewingItem.receipt_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Ordered Qty</span> <span className="font-mono">{viewingItem.ordered_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Received Qty</span> <span className="font-mono font-bold text-primary">{viewingItem.received_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Pending PO Balance</span> <span className="font-mono text-amber-600">{viewingItem.pending_po_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Receipt Value</span> <span className="font-bold text-emerald-600 font-mono text-sm">₹{Number(viewingItem.total_amount).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Supplier Challan</span> <span className="font-mono">{viewingItem.supplier_challan_no}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Delivery Truck</span> <span className="font-mono">{viewingItem.vehicle_no}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">QC Status</span> <span className="text-emerald-600 font-semibold">{viewingItem.qc_status} ({viewingItem.inspected_by})</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Delivery Inspection Notes:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print GRN Docket
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
          title={editingItem ? 'Edit Goods Receipt' : 'Receive PO Inward Delivery'}
          subtitle="Match inward delivery challan against purchase order and update pending balances."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="proc-grn-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="PO & Inward Reference">
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

                <FormField label="Linked Purchase Order (PO)">
                  <Input
                    value={form.po_reference}
                    onChange={(e) => handleFormChange('po_reference', e.target.value)}
                    placeholder="PO-2026-088"
                  />
                </FormField>

                <FormField label="Supplier Vendor" required error={errors.supplier_name}>
                  <Input
                    value={form.supplier_name}
                    onChange={(e) => handleFormChange('supplier_name', e.target.value)}
                    placeholder="e.g. UltraTech Cement Distributors Ltd"
                  />
                </FormField>

                <FormField label="Delivery Challan No">
                  <Input
                    value={form.supplier_challan_no}
                    onChange={(e) => handleFormChange('supplier_challan_no', e.target.value)}
                    placeholder="DC-9812"
                  />
                </FormField>

                <FormField label="Delivery Vehicle No">
                  <Input
                    value={form.vehicle_no}
                    onChange={(e) => handleFormChange('vehicle_no', e.target.value)}
                    placeholder="TN-45-AZ-1024"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Quantities & Reconciliation">
              <EntityEditModal.Grid>
                <FormField label="Material Item">
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                  />
                </FormField>

                <FormField label="PO Ordered Quantity">
                  <Input
                    type="number"
                    value={form.ordered_qty}
                    onChange={(e) => handleFormChange('ordered_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Inward Received Quantity">
                  <Input
                    type="number"
                    value={form.received_qty}
                    onChange={(e) => handleFormChange('received_qty', e.target.value)}
                  />
                </FormField>

                <FormField label="Pending PO Balance">
                  <Input
                    readOnly
                    className="font-mono font-bold bg-surface-muted text-amber-600"
                    value={`${form.pending_po_qty} ${form.uom}`}
                  />
                </FormField>

                <FormField label="QC Remarks" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    placeholder="Inspection test notes, bag conditions, batch numbers..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="proc-grn-form"
            submitLabel={editingItem ? 'Update GRN' : 'Inward to Store'}
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
