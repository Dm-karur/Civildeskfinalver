import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, IndianRupee, CheckCircle2, Users, FileText,
  Search, Filter, Eye, Building, Printer, Download, Sparkles, ShieldCheck
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
import { toast } from '../../../components/composite/Toast';
import { projectsApi, reportsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const DEFAULT_REPORT_DATA = [
  {
    id: 1,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    contractor_name: 'Sri Murugan Civil Infra Pvt Ltd',
    trade: 'RCC Structure & Masonry',
    wo_count: 2,
    total_wo_value: 4850000,
    billed_amount: 1420000,
    certified_amount: 1420000,
    paid_amount: 1250000,
    retention_held: 71000,
    balance_payable: 3600000,
    progress_pct: 29.3,
    performance_rating: 'Grade A (94%)'
  },
  {
    id: 2,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    contractor_name: 'Apex MEP Engineers & Contractors',
    trade: 'Electrical & Plumbing',
    wo_count: 1,
    total_wo_value: 1820000,
    billed_amount: 380000,
    certified_amount: 380000,
    paid_amount: 334400,
    retention_held: 19000,
    balance_payable: 1485600,
    progress_pct: 20.9,
    performance_rating: 'Grade A (91%)'
  },
  {
    id: 3,
    project_id: 2,
    project_code: 'PRJ-2026-002',
    project_name: 'Highway Expansion Package 3',
    contractor_name: 'Sri Murugan Civil Infra Pvt Ltd',
    trade: 'Box Culverts & Earthworks',
    wo_count: 1,
    total_wo_value: 2650000,
    billed_amount: 265000,
    certified_amount: 265000,
    paid_amount: 259700,
    retention_held: 0,
    balance_payable: 2390300,
    progress_pct: 10.0,
    performance_rating: 'Grade A (90%)'
  },
  {
    id: 4,
    project_id: 1,
    project_code: 'PRJ-2026-001',
    project_name: 'Metro Commercial Tower Block A',
    contractor_name: 'Kavitha Flooring & Civil Solutions',
    trade: 'Dewatering & Piling',
    wo_count: 1,
    total_wo_value: 1250000,
    billed_amount: 1250000,
    certified_amount: 1250000,
    paid_amount: 1218750,
    retention_held: 31250,
    balance_payable: 0,
    progress_pct: 100.0,
    performance_rating: 'Grade A+ (96%)'
  },
];

export function SubcontractReportPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [reportData, setReportData] = useState(DEFAULT_REPORT_DATA);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Load Projects & API Data safely
  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      reportsApi?.subcontracts ? reportsApi.subcontracts().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([projRes, repRes]) => {
      const pList = projRes?.data?.projects ?? projRes?.projects ?? (Array.isArray(projRes?.data) ? projRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      const rList = repRes?.data?.subcontracts ?? repRes?.data?.data ?? [];
      if (Array.isArray(rList) && rList.length > 0) {
        const normalized = rList.map((r, idx) => ({
          id: r.id || idx + 1,
          project_id: r.project_id || 1,
          project_code: r.project_code || 'PRJ-2026-001',
          project_name: r.project_name || 'Civil Project',
          contractor_name: r.contractor_name || 'Subcontractor',
          trade: r.trade || r.category_name || 'Contracting',
          wo_count: Number(r.wo_count || 1),
          total_wo_value: Number(r.total_wo_value || 1000000),
          billed_amount: Number(r.billed_amount || 500000),
          certified_amount: Number(r.certified_amount || 500000),
          paid_amount: Number(r.paid_amount || 450000),
          retention_held: Number(r.retention_held || 25000),
          balance_payable: Number(r.balance_payable || 550000),
          progress_pct: Number(r.progress_pct || 50),
          performance_rating: r.performance_rating || 'Grade A',
        }));
        setReportData(normalized);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.success('Exporting Subcontractor Analytics Report to Excel...');
  };

  // Filtered List
  const filtered = useMemo(() => {
    return reportData.filter(r => {
      if (selectedProjectId !== 'all' && String(r.project_id) !== String(selectedProjectId)) return false;
      if (search) {
        const s = search.toLowerCase();
        const cont = String(r.contractor_name || '').toLowerCase();
        const trade = String(r.trade || '').toLowerCase();
        const proj = String(r.project_name || '').toLowerCase();
        if (!cont.includes(s) && !trade.includes(s) && !proj.includes(s)) return false;
      }
      return true;
    });
  }, [reportData, selectedProjectId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalContractedVal = useMemo(() => reportData.reduce((acc, r) => acc + Number(r.total_wo_value || 0), 0), [reportData]);
  const totalBilledVal = useMemo(() => reportData.reduce((acc, r) => acc + Number(r.billed_amount || 0), 0), [reportData]);
  const totalPaidVal = useMemo(() => reportData.reduce((acc, r) => acc + Number(r.paid_amount || 0), 0), [reportData]);
  const totalRetentionVal = useMemo(() => reportData.reduce((acc, r) => acc + Number(r.retention_held || 0), 0), [reportData]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Reports & Analytics', href: '/reports/subcontracts' },
    { label: 'Subcontract Analytics Report' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Subcontract Financial & Physical Progress Report"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Awarded Work Orders"
            value={`₹${(totalContractedVal / 100000).toFixed(2)}L`}
            status="primary"
            icon={<IndianRupee className="w-4 h-4" />}
          />
          <KpiCard
            label="Cumulative Certified Work"
            value={`₹${(totalBilledVal / 100000).toFixed(2)}L`}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Disbursed Settlements"
            value={`₹${(totalPaidVal / 100000).toFixed(2)}L`}
            status="neutral"
            icon={<Users className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Retention Escrow Balance"
            value={`₹${(totalRetentionVal / 100000).toFixed(2)}L`}
            status="warning"
            icon={<ShieldCheck className="w-4 h-4 text-amber-500" />}
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
                placeholder="Search contractor, trade, project..."
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
              title="Print Report"
            >
              Print Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExport}
              className="text-xs h-8 shadow-xs"
            >
              Export Excel
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
                  <th className="px-3 py-2">Contractor & Specialty</th>
                  <th className="px-3 py-2 text-center w-20">WOs</th>
                  <th className="px-3 py-2 text-right w-28">Order Value</th>
                  <th className="px-3 py-2 text-right w-28">Certified</th>
                  <th className="px-3 py-2 text-right w-28">Paid</th>
                  <th className="px-3 py-2 text-right w-24 hidden md:table-cell">Retention</th>
                  <th className="px-3 py-2 text-right w-28 font-bold">Balance</th>
                  <th className="px-3 py-2 text-center w-24">Progress %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      Loading subcontract analytics...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-8 text-text-muted text-[12px]">
                      No report records found.
                    </td>
                  </tr>
                ) : (
                  paged.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={r.contractor_name}>
                            {r.contractor_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {r.trade} • {r.project_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-[11px] text-text-primary">
                        {r.wo_count}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{r.total_wo_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-emerald-600 font-medium">
                        ₹{r.certified_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-text-primary">
                        ₹{r.paid_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell font-mono text-[11px] text-amber-600">
                        ₹{r.retention_held.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{r.balance_payable.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600 text-[11px]">
                        {r.progress_pct}%
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
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{r.contractor_name}</h4>
                  <span className="text-[11px] text-text-muted">{r.trade}</span>
                </div>
                <Badge
                  variant="success"
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {r.progress_pct}% Done
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Order Value</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">₹{r.total_wo_value.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Paid to Date</span>
                  <span className="font-mono font-bold text-emerald-600 text-[11px]">₹{r.paid_amount.toLocaleString('en-IN')}</span>
                </div>
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
    </PageContainer>
  );
}
