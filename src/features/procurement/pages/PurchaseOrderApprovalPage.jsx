import { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, Clock, IndianRupee, ShoppingCart,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight, RotateCcw,
  Check, AlertCircle, Sparkles, Building, Layers, Printer
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
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

/* 
const DEFAULT_APPROVAL_POS = [

  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    site_name: 'Steel Stacking Yard',
    po_no: 'PO-2026-089',
    po_date: '2026-08-20',
    expected_delivery_date: '2026-08-24',
    supplier_name: 'JSW Steel Regional Supply Hub',
    material_code: 'MAT-STL-002',
    material_name: 'Fe 550D TMT Rebar 16mm (15.0 MT)',
    taxable_amount: 735000,
    grand_total: 885300,
    status: 'Pending Director Approval',
    threshold_tier: 'Tier 2 (> ₹5 Lakhs)',
    approver: 'Er. Suresh Babu (Project Director)',
    notes: 'Major steel reinforcement procurement for Level 3 structure.'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    site_name: 'Main Central Godown Bay 1',
    po_no: 'PO-2026-088',
    po_date: '2026-08-21',
    expected_delivery_date: '2026-08-25',
    supplier_name: 'UltraTech Cement Distributors Ltd',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement (500 Bags)',
    taxable_amount: 170000,
    grand_total: 225100,
    status: 'Approved & Dispatched',
    threshold_tier: 'Tier 1 (< ₹5 Lakhs)',
    approver: 'Er. Rajesh Kumar (Project Manager)',
    notes: 'Standard cement supply under approved CS-2026-012.'
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
    material_code: 'MAT-AGG-003',
    material_name: '20mm Blue Metal Aggregate (120 Tons)',
    taxable_amount: 165600,
    grand_total: 185880,
    status: 'Approved & Dispatched',
    threshold_tier: 'Tier 1 (< ₹5 Lakhs)',
    approver: 'K. Balaji (Highway PM)',
    notes: 'Approved for direct batching delivery.'
  },
];
*/

export function PurchaseOrderApprovalPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  // Load Projects
  useEffect(() => {
    projectsApi.list().then(res => {
      const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
      setProjects(Array.isArray(list) ? list : []);
    }).catch(() => setProjects([]));
  }, []);

  const handleApprove = (item) => {
    setOrders(prev => prev.map(o => o.id === item.id ? { ...o, status: 'Approved & Dispatched' } : o));
    toast.success(`Purchase Order ${item.po_no} signed off & authorized.`);
  };

  const handleReturn = (item) => {
    setOrders(prev => prev.map(o => o.id === item.id ? { ...o, status: 'Returned for Revision' } : o));
    toast.success(`Purchase Order ${item.po_no} returned to procurement cell.`);
  };

  // Safe Filtered List
  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (selectedProjectId !== 'all' && String(o.project_id) !== String(selectedProjectId)) return false;
      if (statusFilter !== 'all' && String(o.status || '') !== statusFilter) return false;
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
  const pendingCount = useMemo(() => orders.filter(o => String(o.status || '').toLowerCase().includes('pending')).length, [orders]);
  const approvedCount = useMemo(() => orders.filter(o => String(o.status || '').toLowerCase().includes('approved')).length, [orders]);
  const pendingValue = useMemo(() => orders.filter(o => String(o.status || '').toLowerCase().includes('pending')).reduce((acc, o) => acc + Number(o.grand_total || 0), 0), [orders]);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('approved')) return 'success';
    if (s.includes('pending')) return 'warning';
    if (s.includes('returned')) return 'neutral';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Procurement', href: '/procurement/purchase-orders' },
    { label: 'PO Approval' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Purchase Order Authorization & Sign-Off"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total POs in Approval Queue"
            value={orders.length}
            status="primary"
            icon={<ShoppingCart className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Director Sign-Off"
            value={`${pendingCount} POs`}
            status={pendingCount > 0 ? 'warning' : 'success'}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Pending Financial Value"
            value={`₹${pendingValue.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Authorized & Dispatched"
            value={`${approvedCount} POs`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-sky-500" />}
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Stages' },
                  { value: 'Pending Director Approval', label: 'Pending Director Approval' },
                  { value: 'Approved & Dispatched', label: 'Approved & Dispatched' },
                  { value: 'Returned for Revision', label: 'Returned for Revision' },
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
                  <th className="px-3 py-2">Supplier Vendor</th>
                  <th className="px-3 py-2">Material Item & Project</th>
                  <th className="px-3 py-2 text-right w-28">Grand Total (₹)</th>
                  <th className="px-3 py-2 text-center w-28 hidden md:table-cell">Tier Limit</th>
                  <th className="px-3 py-2 text-center w-36">Status</th>
                  <th className="px-3 py-2 text-center w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading authorization queue...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No purchase orders in approval queue.
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
                        <span className="font-semibold text-text-primary text-[12px] truncate block" title={o.supplier_name}>
                          {o.supplier_name}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={o.material_name}>
                            {o.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {o.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(o.grand_total).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center hidden md:table-cell text-[10px] font-mono text-text-secondary">
                        {o.threshold_tier}
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
                            title="View PO 360"
                            onClick={() => setViewingItem(o)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {String(o.status || '').toLowerCase().includes('pending') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                title="Approve & Dispatch PO"
                                onClick={() => handleApprove(o)}
                              >
                                <Check className="w-3 h-3 mr-0.5" /> Authorize
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                title="Return for Revision"
                                onClick={() => handleReturn(o)}
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-500 hover:text-amber-700" />
                              </Button>
                            </>
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
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Tier Rule</span>
                  <span className="font-mono text-[10px] text-text-secondary">{o.threshold_tier}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Grand Total</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(o.grand_total).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(o)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                {String(o.status || '').toLowerCase().includes('pending') && (
                  <Button variant="primary" size="sm" className="h-7 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(o)}>
                    <Check className="w-3 h-3 mr-1" /> Authorize
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

      {/* View PO 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
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
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Total PO Commitment</span> <span className="font-bold text-emerald-600 font-mono text-base">₹{Number(viewingItem.grand_total).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Authorization Level</span> <span className="font-semibold text-primary">{viewingItem.threshold_tier}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Material & Scope</span> <span className="text-text-primary font-medium">{viewingItem.material_name}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Target Site Delivery</span> <span className="font-mono text-text-primary">{viewingItem.expected_delivery_date}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Designated Approver</span> <span className="text-text-primary font-semibold">{viewingItem.approver}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Current Approval Status</span> <span className="font-semibold text-emerald-600">{viewingItem.status}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Justification & Contract Notes:</span>
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
    </PageContainer>
  );
}
