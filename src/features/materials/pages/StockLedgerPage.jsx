import { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, CheckCircle2, IndianRupee, Layers,
  Search, Filter, Eye, ArrowUpFromLine, ArrowDownToLine,
  Truck, RotateCcw, SlidersHorizontal, Printer, Download
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
import { projectsApi, materialManagementApi } from '../../../api/apiservice';

/* 
const DEFAULT_LEDGER_ENTRIES = [

  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    movement_date: '2026-08-20',
    movement_type: 'Inward Receipt (GRN)',
    reference_no: 'GRN-2026-081',
    site_name: 'Central Godown Bay 1',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    uom: 'Bags',
    inward_qty: 400,
    outward_qty: 0,
    balance_qty: 700,
    unit_rate: 385,
    line_value: 154000,
    running_valuation: 269500,
    party: 'UltraTech Cement Distributors Ltd',
    notes: 'Inward gate delivery truck TN-45-AZ-1024.'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    movement_date: '2026-08-20',
    movement_type: 'Outward Issue (MIN)',
    reference_no: 'MIN-2026-112',
    site_name: 'Central Godown Bay 1',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    uom: 'Bags',
    inward_qty: 0,
    outward_qty: 250,
    balance_qty: 450,
    unit_rate: 385,
    line_value: 96250,
    running_valuation: 173250,
    party: 'Sri Murugan Labour Services',
    notes: 'Level 2 slab and shear wall casting issue.'
  },
  {
    id: 3,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    movement_date: '2026-08-20',
    movement_type: 'Surplus Return (MRN)',
    reference_no: 'RTN-2026-021',
    site_name: 'Central Godown Bay 1',
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    uom: 'Bags',
    inward_qty: 30,
    outward_qty: 0,
    balance_qty: 480,
    unit_rate: 385,
    line_value: 11550,
    running_valuation: 184800,
    party: 'Sri Murugan Labour Services',
    notes: 'Surplus bags returned after pour completion.'
  },
  {
    id: 4,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    movement_date: '2026-08-19',
    movement_type: 'Inward Receipt (GRN)',
    reference_no: 'GRN-2026-082',
    site_name: 'Main Steel Yard',
    material_code: 'MAT-STL-002',
    material_name: 'Fe 550D TMT Rebar 16mm',
    uom: 'MT',
    inward_qty: 12.5,
    outward_qty: 0,
    balance_qty: 12.5,
    unit_rate: 58500,
    line_value: 731250,
    running_valuation: 731250,
    party: 'JSW Steel Regional Supply Hub',
    notes: 'Direct mill dispatch trailer KA-01-MJ-8842.'
  },
  {
    id: 5,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    movement_date: '2026-08-20',
    movement_type: 'Outward Issue (MIN)',
    reference_no: 'MIN-2026-113',
    site_name: 'Main Steel Yard',
    material_code: 'MAT-STL-002',
    material_name: 'Fe 550D TMT Rebar 16mm',
    uom: 'MT',
    inward_qty: 0,
    outward_qty: 4.5,
    balance_qty: 8.0,
    unit_rate: 58500,
    line_value: 263250,
    running_valuation: 468000,
    party: 'Sri Murugan Labour Services',
    notes: 'Core 1 column splice cutting issue.'
  },
];
*/

export function StockLedgerPage() {
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [movementFilter, setMovementFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [viewingItem, setViewingItem] = useState(null);

  // Load Projects & API Data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      materialManagementApi.ledger().catch(() => ({ data: [] }))
    ]).then(([projRes, ledRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      const lList = ledRes?.data?.material_ledger ?? ledRes?.data?.data ?? [];
      if (Array.isArray(lList) && lList.length > 0) {
        setEntries(lList);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success('Exporting Perpetual Stock Ledger to CSV / Excel...');
  };

  // Filtered List
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (selectedProjectId !== 'all' && String(e.project_id) !== String(selectedProjectId)) return false;
      if (movementFilter !== 'all' && !e.movement_type.includes(movementFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const ref = (e.reference_no || '').toLowerCase();
        const mat = (e.material_name || '').toLowerCase();
        const type = (e.movement_type || '').toLowerCase();
        const party = (e.party || '').toLowerCase();
        const site = (e.site_name || '').toLowerCase();
        if (!ref.includes(q) && !mat.includes(q) && !type.includes(q) && !party.includes(q) && !site.includes(q)) return false;
      }
      return true;
    });
  }, [entries, selectedProjectId, movementFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalInwardValue = useMemo(() => entries.reduce((acc, e) => acc + (e.inward_qty > 0 ? Number(e.line_value || 0) : 0), 0), [entries]);
  const totalOutwardValue = useMemo(() => entries.reduce((acc, e) => acc + (e.outward_qty > 0 ? Number(e.line_value || 0) : 0), 0), [entries]);

  const getMovementIcon = (type) => {
    if (type.includes('Inward')) return <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />;
    if (type.includes('Outward')) return <ArrowUpFromLine className="w-3.5 h-3.5 text-sky-600 inline mr-1" />;
    if (type.includes('Return')) return <RotateCcw className="w-3.5 h-3.5 text-amber-600 inline mr-1" />;
    if (type.includes('Transfer')) return <Truck className="w-3.5 h-3.5 text-indigo-600 inline mr-1" />;
    return <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-600 inline mr-1" />;
  };

  const getMovementBadgeVariant = (type) => {
    if (type.includes('Inward')) return 'success';
    if (type.includes('Outward')) return 'info';
    if (type.includes('Return')) return 'warning';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Stock Ledger' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Stock Ledger & Perpetual Audit Trail (Bin Card)"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Ledger Movements"
            value={entries.length}
            status="primary"
            icon={<BookOpen className="w-4 h-4" />}
          />
          <KpiCard
            label="Total Inward Inflow"
            value={`₹${totalInwardValue.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Total Outward Issues"
            value={`₹${totalOutwardValue.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Audit Trail Status"
            value="100% Perpetual"
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

            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Movement Types' },
                  { value: 'Inward', label: 'Inward Receipts (GRN)' },
                  { value: 'Outward', label: 'Outward Issues (MIN)' },
                  { value: 'Return', label: 'Surplus Returns (MRN)' },
                  { value: 'Transfer', label: 'Inter-Site Transfers' },
                ]}
                value={movementFilter}
                onChange={setMovementFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search ref no, material, party, store..."
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
              title="Print Ledger"
            >
              Print Ledger
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExport}
              className="text-xs h-8 shadow-xs"
              title="Export CSV"
            >
              Export
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
                  <th className="px-3 py-2 w-28">Date & Voucher</th>
                  <th className="px-3 py-2">Movement Type & Party</th>
                  <th className="px-3 py-2">Material Item</th>
                  <th className="px-3 py-2 text-right w-20 text-emerald-600">Inward (+)</th>
                  <th className="px-3 py-2 text-right w-20 text-sky-600">Outward (-)</th>
                  <th className="px-3 py-2 text-right w-24 font-bold">Balance Qty</th>
                  <th className="px-3 py-2 text-right w-28">Txn Value</th>
                  <th className="px-3 py-2 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading stock ledger audit trail...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No ledger transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {e.reference_no}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono block pt-0.5">{e.movement_date}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center">
                            {getMovementIcon(e.movement_type)}
                            <span className="font-semibold text-text-primary text-[12px] truncate" title={e.movement_type}>
                              {e.movement_type}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted truncate">
                            {e.party}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={e.material_name}>
                            {e.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {e.site_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 text-[11px]">
                        {e.inward_qty > 0 ? `+${e.inward_qty}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-sky-600 text-[11px]">
                        {e.outward_qty > 0 ? `-${e.outward_qty}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {e.balance_qty} <span className="text-text-muted font-normal text-[10px]">{e.uom}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-primary text-[11px]">
                        ₹{Number(e.line_value).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="View Ledger Voucher 360"
                          onClick={() => setViewingItem(e)}
                        >
                          <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                        </Button>
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
          {paged.map((e, idx) => (
            <div key={e.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{e.reference_no} • {e.movement_date}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{e.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{e.movement_type}</span>
                </div>
                <Badge
                  variant={getMovementBadgeVariant(e.movement_type)}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {e.inward_qty > 0 ? `+${e.inward_qty}` : `-${e.outward_qty}`} {e.uom}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Running Balance</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{e.balance_qty} {e.uom}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Txn Value</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(e.line_value).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                <span className="text-[10px] text-text-muted font-mono truncate">{e.party}</span>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(e)}>
                  <Eye className="w-3 h-3 mr-1" /> View Voucher
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

      {/* View Ledger Entry 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.reference_no}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_name} • {viewingItem.movement_date}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Movement Type</span> <span className="font-semibold text-text-primary">{viewingItem.movement_type}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Transaction Value</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingItem.line_value).toLocaleString('en-IN')}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Inward / Outward Qty</span> <span className="font-mono font-bold text-text-primary">{viewingItem.inward_qty > 0 ? `+${viewingItem.inward_qty}` : `-${viewingItem.outward_qty}`} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Perpetual Balance Qty</span> <span className="font-mono font-bold text-emerald-600 text-sm">{viewingItem.balance_qty} {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Unit Valuation Rate</span> <span className="font-mono">₹{viewingItem.unit_rate} / {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Running Yard Value</span> <span className="font-mono font-bold text-primary">₹{Number(viewingItem.running_valuation).toLocaleString('en-IN')}</span></div>
                <div className="col-span-2"><span className="text-text-muted block text-[10px] uppercase font-bold">Counterparty / Contractor</span> <span className="text-text-primary font-medium">{viewingItem.party}</span></div>
              </div>

              {viewingItem.notes && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Audit Voucher Log Details:</span>
                  <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Bin Card Slip
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
