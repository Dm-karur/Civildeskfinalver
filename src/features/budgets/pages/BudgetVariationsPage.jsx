import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  RotateCcw,
  Eye,
  MoreVertical,
  Check,
  XCircle,
  Trash2,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { SearchField } from '../../../components/composite/SearchField';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { budgetsApi, projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';
import { BudgetRevisionFormModal } from '../components/BudgetRevisionFormModal';
import { BudgetRevisionDetailModal } from '../components/BudgetRevisionDetailModal';

const INR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const INR_L = (v) => {
  const n = Number(v || 0);
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  return `₹${(n / 100000).toFixed(1)} L`;
};

export function BudgetVariationsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    project_id: 'all',
    budget_id: 'all',
    status: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingRevision, setViewingRevision] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Workflow confirmation dialog
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionComments, setActionComments] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Projects and Budgets
  useEffect(() => {
    Promise.allSettled([
      projectsApi.list(),
      budgetsApi.list(),
    ]).then(([projRes, budRes]) => {
      if (projRes.status === 'fulfilled') {
        const raw = projRes.value;
        const list = Array.isArray(raw) ? raw : (raw?.data?.projects ?? raw?.projects ?? (Array.isArray(raw?.data) ? raw.data : []));
        setProjects(Array.isArray(list) ? list : []);
      }
      if (budRes.status === 'fulfilled') {
        const raw = budRes.value;
        const list = raw?.data?.project_budgets ?? raw?.project_budgets ?? raw?.data?.data ?? (Array.isArray(raw) ? raw : []);
        setBudgets(Array.isArray(list) ? list : []);
      }
    });
  }, []);

  // Fetch Variations (Revisions) across budgets
  useEffect(() => {
    setLoading(true);

    budgetsApi.list()
      .then(async (res) => {
        const budgetList = res?.data?.project_budgets ?? res?.project_budgets ?? res?.data?.data ?? (Array.isArray(res) ? res : []);
        // Include budgets that are APPROVED or have had revisions
        const eligibleBudgets = (Array.isArray(budgetList) ? budgetList : []).filter(
          (b) => {
            const status = String(b.status_code || b.status_name || b.status || '').toUpperCase();
            return status === 'APPROVED' || (b.revision_count && Number(b.revision_count) > 0);
          }
        );

        // Filter by selected project
        let targetBudgets = eligibleBudgets;
        if (filters.project_id !== 'all') {
          targetBudgets = targetBudgets.filter(b => String(b.project_id) === String(filters.project_id));
        }
        // Filter by selected budget
        if (filters.budget_id !== 'all') {
          targetBudgets = targetBudgets.filter((b) => String(b.id) === String(filters.budget_id));
        }

        // Fetch revisions for these target budgets in parallel
        const revPromises = targetBudgets.map((b) =>
          budgetsApi.revisions.list(b.id)
            .then((r) => {
              const list = r?.data?.budget_revisions ?? r?.budget_revisions ?? r?.data?.revisions ?? r?.revisions ?? (Array.isArray(r?.data) ? r.data : []);
              return (Array.isArray(list) ? list : []).map((rev) => ({
                ...rev,
                budget_id: b.id,
                budget_code: b.budget_code,
                budget_name: b.budget_name,
                project_id: b.project_id,
                project_name: b.project_name || projects.find((p) => p.id === b.project_id)?.project_name || 'Project',
                project_code: b.project_code || projects.find((p) => p.id === b.project_id)?.project_code || '',
              }));
            })
            .catch(() => [])
        );

        const results = await Promise.all(revPromises);
        const flattened = results.flat().sort((a, b) => new Date(b.created_at || b.revision_date || 0) - new Date(a.created_at || a.revision_date || 0));
        setVariations(flattened);
      })
      .catch(() => setVariations([]))
      .finally(() => setLoading(false));
  }, [refreshKey, filters.budget_id, filters.project_id, projects]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Filter and search
  const filteredVariations = useMemo(() => {
    return variations.filter((rev) => {
      if (filters.status !== 'all') {
        const s = String(rev.status_code || rev.status_name || rev.status || '').toLowerCase();
        if (filters.status === 'draft' && !s.includes('draft')) return false;
        if (filters.status === 'submitted' && !(s.includes('submit') || s.includes('review') || s.includes('pending'))) return false;
        if (filters.status === 'approved' && !s.includes('approv')) return false;
        if (filters.status === 'rejected' && !s.includes('reject')) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const vo = `vo-${String(rev.revision_no || '').padStart(3, '0')}`.toLowerCase();
        const code = String(rev.budget_code || '').toLowerCase();
        const name = String(rev.budget_name || '').toLowerCase();
        const reason = String(rev.reason || '').toLowerCase();
        const prj = String(rev.project_name || '').toLowerCase();
        if (!vo.includes(q) && !code.includes(q) && !name.includes(q) && !reason.includes(q) && !prj.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [variations, filters, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    let draft = 0, submitted = 0, approved = 0, rejected = 0;
    let totalVariance = 0;
    let totalIncrease = 0, totalDecrease = 0;

    variations.forEach((rev) => {
      const s = String(rev.status_code || rev.status_name || rev.status || '').toLowerCase();
      const variance = Number(rev.variance_amount || 0);
      totalVariance += variance;
      if (variance > 0) totalIncrease += variance;
      if (variance < 0) totalDecrease += Math.abs(variance);
      if (s.includes('draft')) draft++;
      else if (s.includes('submit') || s.includes('pending') || s.includes('review')) submitted++;
      else if (s.includes('approv')) approved++;
      else if (s.includes('reject')) rejected++;
    });

    return { total: variations.length, draft, submitted, approved, rejected, totalVariance, totalIncrease, totalDecrease };
  }, [variations]);

  const hasActiveFilters = Boolean(
    (filters.project_id && filters.project_id !== 'all') ||
    (filters.budget_id && filters.budget_id !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    searchQuery
  );

  const resetFilters = () => {
    setFilters({ project_id: 'all', budget_id: 'all', status: 'all' });
    setSearchQuery('');
  };

  // Status badge variant
  const getVariant = (s) => {
    const v = String(s || '').toUpperCase();
    if (v.includes('APPROV')) return 'success';
    if (v.includes('SUBMIT') || v.includes('PENDING')) return 'warning';
    if (v.includes('REJECT')) return 'error';
    return 'neutral';
  };

  // Variance % calculation
  const variancePct = (rev) => {
    const prev = Number(rev.previous_total || 0);
    if (prev === 0) return '—';
    const pct = (Number(rev.variance_amount || 0) / prev) * 100;
    return `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  // Workflow confirmation execution
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, item } = confirmAction;
    setActionSubmitting(true);
    try {
      if (type === 'submit') {
        await budgetsApi.revisions.submit(item.budget_id, item.id, { comments: actionComments || undefined });
        toast.success('Variation order submitted for approval.');
      } else if (type === 'approve') {
        await budgetsApi.revisions.approve(item.budget_id, item.id, { comments: actionComments || undefined });
        toast.success('Variation order approved. Budget baseline updated.');
      } else if (type === 'reject') {
        if (!actionComments.trim()) {
          toast.error('Rejection comments are required.');
          setActionSubmitting(false);
          return;
        }
        await budgetsApi.revisions.reject(item.budget_id, item.id, { comments: actionComments });
        toast.success('Variation order rejected.');
      } else if (type === 'delete') {
        await budgetsApi.revisions.remove(item.budget_id, item.id);
        toast.success('Variation order deleted.');
      }
      setConfirmAction(null);
      setActionComments('');
      refresh();
    } catch (err) {
      toast.error(err?.message || `Failed to ${type} variation order.`);
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filtered budgets by selected project
  const filteredBudgets = useMemo(() => {
    if (filters.project_id === 'all') return budgets;
    return budgets.filter(b => String(b.project_id) === String(filters.project_id));
  }, [budgets, filters.project_id]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/budgets' },
    { label: 'Variation Orders' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Budget Variation Orders"
        breadcrumbs={breadcrumbs}
        description="Track scope changes, cost variations, and budget baseline adjustments with full audit trail."
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Variation Orders"
            value={kpis.total}
            status="primary"
            icon={<Activity className="w-4 h-4" />}
          />
          <KpiCard
            label="Pending Approval"
            value={kpis.submitted}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Approved Variations"
            value={kpis.approved}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Net Budget Impact"
            value={`${kpis.totalVariance >= 0 ? '+' : ''}${INR_L(kpis.totalVariance)}`}
            status={kpis.totalVariance >= 0 ? 'success' : 'neutral'}
            icon={<BarChart3 className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-44">
              <Select
                className="text-xs h-8"
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map((p) => ({
                    value: String(p.id),
                    label: `${p.project_code || 'PRJ'} - ${p.project_name || p.name}`,
                  })),
                ]}
                value={filters.project_id}
                onChange={(value) => setFilters((c) => ({ ...c, project_id: value, budget_id: 'all' }))}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                className="text-xs h-8"
                options={[
                  { value: 'all', label: 'All Budgets' },
                  ...filteredBudgets.map((b) => ({
                    value: String(b.id),
                    label: `${b.budget_code} - ${b.budget_name || 'Budget'}`,
                  })),
                ]}
                value={filters.budget_id}
                onChange={(value) => setFilters((c) => ({ ...c, budget_id: value }))}
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                className="text-xs h-8"
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'submitted', label: 'Pending Approval' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                value={filters.status}
                onChange={(value) => setFilters((c) => ({ ...c, status: value }))}
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search VO no, budget, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-2 text-text-muted hover:text-text-primary"
                onClick={resetFilters}
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {hasPermission('budget.revise') && (
              <Button
                variant="primary"
                size="sm"
                className="text-xs h-8 shadow-xs"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsCreateOpen(true)}
              >
                Create Variation Order
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block border border-border rounded-lg overflow-hidden bg-surface shadow-xs">
          {loading ? (
            <div className="py-16 text-center text-text-muted text-xs">Loading variation orders...</div>
          ) : filteredVariations.length === 0 ? (
            <div className="py-16 text-center text-text-muted text-xs">
              No variation orders found matching the selected criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2">VO Reference</th>
                  <th className="px-3 py-2">Budget & Project</th>
                  <th className="px-3 py-2">Change Scope / Reason</th>
                  <th className="px-3 py-2 text-right">Previous Total</th>
                  <th className="px-3 py-2 text-right">Revised Total</th>
                  <th className="px-3 py-2 text-right">Variance (+/-)</th>
                  <th className="px-3 py-2 text-center">% Impact</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVariations.map((rev, idx) => {
                  const variance = Number(rev.variance_amount || 0);
                  const statusStr = String(rev.status_code || rev.status_name || rev.status || 'DRAFT').toUpperCase();
                  const isDraft = statusStr.includes('DRAFT');
                  const isPending = statusStr.includes('SUBMIT') || statusStr.includes('PENDING') || statusStr.includes('REVIEW');
                  const pct = variancePct(rev);

                  return (
                    <tr key={rev.id || idx} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-3 py-2 text-center text-text-muted text-[11px]">{idx + 1}</td>

                      {/* VO Reference */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${variance > 0 ? 'bg-emerald-100 text-emerald-600' : variance < 0 ? 'bg-rose-100 text-rose-600' : 'bg-surface-muted text-text-muted'}`}>
                            {variance > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : variance < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-mono font-bold text-primary text-[12px]">
                              VO-{String(rev.revision_no || idx + 1).padStart(3, '0')}
                            </div>
                            <div className="text-[10px] text-text-muted font-mono">
                              {rev.revision_date ? rev.revision_date.split('T')[0] : '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Budget & Project */}
                      <td className="px-3 py-2">
                        <div className="font-mono font-semibold text-text-primary text-[11px]">{rev.budget_code}</div>
                        <div className="text-[10px] text-text-secondary truncate max-w-[140px]" title={rev.project_name}>
                          {rev.project_name || '—'}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-3 py-2 text-text-primary max-w-xs">
                        <p className="truncate text-[11px]" title={rev.reason}>{rev.reason || '—'}</p>
                      </td>

                      {/* Previous Total */}
                      <td className="px-3 py-2 text-right font-mono text-text-secondary text-[11px]">
                        {INR(rev.previous_total)}
                      </td>

                      {/* Revised Total */}
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[11px]">
                        {INR(rev.revised_total)}
                      </td>

                      {/* Variance */}
                      <td className={`px-3 py-2 text-right font-mono font-bold text-[11px] ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-rose-600' : 'text-text-muted'}`}>
                        {variance > 0 ? '+' : ''}{INR(variance)}
                      </td>

                      {/* % Impact */}
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          variance > 0 ? 'bg-emerald-50 text-emerald-700' : variance < 0 ? 'bg-rose-50 text-rose-700' : 'bg-surface-muted text-text-muted'
                        }`}>
                          {pct}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 text-center">
                        <Badge variant={getVariant(statusStr)} className="text-[9px] font-bold uppercase tracking-wide">
                          {rev.status_name || statusStr}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2 text-center relative">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingRevision({ budgetId: rev.budget_id, revisionId: rev.id })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors font-medium"
                            title="View Variation Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {(isDraft || isPending) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === rev.id ? null : rev.id);
                              }}
                              className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-muted rounded transition-colors"
                              title="Actions"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Dropdown Menu */}
                        {activeMenuId === rev.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-3 top-8 z-30 w-48 rounded-md border border-border bg-surface shadow-lg py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                          >
                            {isDraft && hasPermission('budget.revise') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setConfirmAction({ type: 'submit', item: rev });
                                }}
                                className="w-full px-3 py-1.5 text-xs text-text-primary hover:bg-surface-muted flex items-center gap-2"
                              >
                                <Send className="w-3.5 h-3.5 text-sky-600" />
                                Submit for Approval
                              </button>
                            )}

                            {isPending && hasPermission('budget.approve') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setConfirmAction({ type: 'approve', item: rev });
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Approve Variation
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setConfirmAction({ type: 'reject', item: rev });
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject Variation
                                </button>
                              </>
                            )}

                            {isDraft && hasPermission('budget.revise') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setConfirmAction({ type: 'delete', item: rev });
                                }}
                                className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-border mt-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Variation
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile View - Cards */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="py-12 text-center text-text-muted text-xs bg-surface border border-border rounded-lg">
              Loading variation orders...
            </div>
          ) : filteredVariations.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs bg-surface border border-border rounded-lg">
              No variation orders found matching the selected criteria.
            </div>
          ) : (
            filteredVariations.map((rev, idx) => {
              const variance = Number(rev.variance_amount || 0);
              const statusStr = String(rev.status_code || rev.status_name || rev.status || 'DRAFT').toUpperCase();
              const isDraft = statusStr.includes('DRAFT');
              const isPending = statusStr.includes('SUBMIT') || statusStr.includes('PENDING') || statusStr.includes('REVIEW');
              const pct = variancePct(rev);

              return (
                <div key={rev.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  {/* Header: VO Code, Budget & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${variance > 0 ? 'bg-emerald-100 text-emerald-600' : variance < 0 ? 'bg-rose-100 text-rose-600' : 'bg-surface-muted text-text-muted'}`}>
                        {variance > 0 ? <ArrowUpRight className="w-4 h-4" /> : variance < 0 ? <ArrowDownRight className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-primary">
                            VO-{String(rev.revision_no || idx + 1).padStart(3, '0')}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono">({rev.budget_code})</span>
                        </div>
                        <h4 className="font-semibold text-text-primary text-[13px] leading-snug truncate" title={rev.budget_name}>
                          {rev.budget_name || 'Untitled Budget'}
                        </h4>
                        <span className="text-[11px] text-text-muted block truncate">{rev.project_name || 'No Project'}</span>
                      </div>
                    </div>
                    <Badge variant={getVariant(statusStr)} className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0">
                      {rev.status_name || statusStr}
                    </Badge>
                  </div>

                  {/* Reason */}
                  {rev.reason && (
                    <p className="text-xs text-text-secondary bg-surface-muted/50 rounded p-2 text-[11px] italic">
                      "{rev.reason}"
                    </p>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 text-xs pt-2 border-t border-border/60">
                    <div>
                      <span className="text-[10px] text-text-muted block">Previous</span>
                      <span className="font-mono font-medium text-text-secondary text-[11px]">
                        {INR(rev.previous_total)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-text-muted block">Variance</span>
                      <span className={`font-mono font-bold text-[11px] ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-rose-600' : 'text-text-muted'}`}>
                        {variance > 0 ? '+' : ''}{INR(variance)}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-text-muted block">Impact</span>
                      <span className={`font-mono font-bold text-[10px] px-1 py-0.5 rounded ${
                        variance > 0 ? 'bg-emerald-50 text-emerald-700' : variance < 0 ? 'bg-rose-50 text-rose-700' : 'text-text-muted'
                      }`}>
                        {pct}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted block">Revised</span>
                      <span className="font-mono font-bold text-text-primary text-[11px]">
                        {INR(rev.revised_total)}
                      </span>
                    </div>
                  </div>

                  {/* Footer with Date & Actions */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/60 text-xs gap-2">
                    <span className="text-[10px] text-text-muted font-mono">
                      {rev.revision_date ? rev.revision_date.split('T')[0] : '—'}
                    </span>
                    <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2"
                        onClick={() => setViewingRevision({ budgetId: rev.budget_id, revisionId: rev.id })}
                      >
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>

                      {isDraft && hasPermission('budget.revise') && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[11px] px-2 text-sky-600"
                            onClick={() => setConfirmAction({ type: 'submit', item: rev })}
                          >
                            <Send className="w-3 h-3 mr-1" /> Submit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] px-1.5 text-rose-500 hover:text-rose-700"
                            onClick={() => setConfirmAction({ type: 'delete', item: rev })}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}

                      {isPending && hasPermission('budget.approve') && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-[11px] px-2 text-emerald-600"
                            onClick={() => setConfirmAction({ type: 'approve', item: rev })}
                          >
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] px-2 text-rose-600"
                            onClick={() => setConfirmAction({ type: 'reject', item: rev })}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Variation Order Modal (reuse BudgetRevisionFormModal) */}
      <BudgetRevisionFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaveSuccess={(bId) => {
          refresh();
        }}
      />

      {/* Variation Detail Modal (reuse BudgetRevisionDetailModal) */}
      {viewingRevision && (
        <BudgetRevisionDetailModal
          isOpen={Boolean(viewingRevision)}
          budgetId={viewingRevision.budgetId}
          revisionId={viewingRevision.revisionId}
          onClose={() => setViewingRevision(null)}
          onRefresh={refresh}
        />
      )}

      {/* Workflow Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-text-primary capitalize">
              {confirmAction.type === 'submit' && 'Submit Variation Order for Approval'}
              {confirmAction.type === 'approve' && 'Approve Variation Order'}
              {confirmAction.type === 'reject' && 'Reject Variation Order'}
              {confirmAction.type === 'delete' && 'Delete Draft Variation Order'}
            </h3>
            <p className="text-xs text-text-secondary">
              {confirmAction.type === 'submit' && 'Submit this variation order for management review. Baseline changes will become locked until approved.'}
              {confirmAction.type === 'approve' && 'Approving this variation will immediately recalculate and replace the active project budget baseline.'}
              {confirmAction.type === 'reject' && 'Provide a reason for rejecting this proposed budget variation.'}
              {confirmAction.type === 'delete' && 'Are you sure you want to delete this draft variation order? This action cannot be undone.'}
            </p>

            {confirmAction.type !== 'delete' && (
              <FormField label={confirmAction.type === 'reject' ? 'Rejection Reason (Required)' : 'Remarks (Optional)'}>
                <textarea
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  placeholder="Enter remarks or justification..."
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </FormField>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setConfirmAction(null); setActionComments(''); }}
              >
                Cancel
              </Button>
              <Button
                variant={confirmAction.type === 'delete' || confirmAction.type === 'reject' ? 'danger' : 'primary'}
                size="sm"
                className="h-8 text-xs"
                disabled={actionSubmitting || (confirmAction.type === 'reject' && !actionComments.trim())}
                onClick={handleConfirmAction}
              >
                {actionSubmitting ? 'Processing...' : (
                  confirmAction.type === 'submit' ? 'Confirm Submit' : (confirmAction.type === 'approve' ? 'Confirm Approval' : (confirmAction.type === 'reject' ? 'Confirm Reject' : 'Confirm Delete'))
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default BudgetVariationsPage;
