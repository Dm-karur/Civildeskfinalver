import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  CheckCircle2,
  Clock,
  IndianRupee,
  Plus,
  RotateCcw,
  Eye,
  MoreVertical,
  Check,
  XCircle,
  Trash2,
  Send,
  TrendingUp,
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

export function BudgetRevisionsPage() {
  const { hasPermission } = useAuth();
  const [projects, setProjects] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [revisions, setRevisions] = useState([]);
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
  const [viewingRevision, setViewingRevision] = useState(null); // { budgetId, revisionId }
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Workflow confirmation dialog
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'submit'|'approve'|'reject'|'delete', item: rev }
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

  // Fetch Projects and Approved Budgets
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

  // Fetch Revisions across budgets
  useEffect(() => {
    setLoading(true);

    // Fetch revisions for all budgets or selected budget
    budgetsApi.list()
      .then(async (res) => {
        const budgetList = res?.data?.project_budgets ?? res?.project_budgets ?? res?.data?.data ?? (Array.isArray(res) ? res : []);
        const approvedBudgets = (Array.isArray(budgetList) ? budgetList : []).filter(
          (b) => String(b.status_code || b.status_name || b.status || '').toUpperCase() === 'APPROVED' || (b.revision_count && Number(b.revision_count) > 0)
        );

        // Filter by selected budget if specific
        const targetBudgets = filters.budget_id !== 'all'
          ? approvedBudgets.filter((b) => String(b.id) === String(filters.budget_id))
          : approvedBudgets;

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
              }));
            })
            .catch(() => [])
        );

        const results = await Promise.all(revPromises);
        const flattened = results.flat().sort((a, b) => new Date(b.created_at || b.revision_date || 0) - new Date(a.created_at || a.revision_date || 0));
        setRevisions(flattened);
      })
      .catch(() => setRevisions([]))
      .finally(() => setLoading(false));
  }, [refreshKey, filters.budget_id, projects]);

  const refresh = () => setRefreshKey((k) => k + 1);

  // Filter and search revisions
  const filteredRevisions = useMemo(() => {
    return revisions.filter((rev) => {
      if (filters.project_id !== 'all' && String(rev.project_id) !== String(filters.project_id)) {
        return false;
      }
      if (filters.status !== 'all') {
        const s = String(rev.status_code || rev.status_name || rev.status || '').toLowerCase();
        if (filters.status === 'draft' && !s.includes('draft')) return false;
        if (filters.status === 'submitted' && !(s.includes('submit') || s.includes('review') || s.includes('pending'))) return false;
        if (filters.status === 'approved' && !s.includes('approv')) return false;
        if (filters.status === 'rejected' && !s.includes('reject')) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const no = `rev-${String(rev.revision_no || '').padStart(2, '0')}`.toLowerCase();
        const code = String(rev.budget_code || '').toLowerCase();
        const name = String(rev.budget_name || '').toLowerCase();
        const reason = String(rev.reason || '').toLowerCase();
        const prj = String(rev.project_name || '').toLowerCase();
        if (!no.includes(q) && !code.includes(q) && !name.includes(q) && !reason.includes(q) && !prj.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [revisions, filters, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    let draft = 0;
    let submitted = 0;
    let approved = 0;
    let totalVariance = 0;

    revisions.forEach((rev) => {
      const s = String(rev.status_code || rev.status_name || rev.status || '').toLowerCase();
      const variance = Number(rev.variance_amount || 0);
      totalVariance += variance;
      if (s.includes('draft')) draft++;
      else if (s.includes('submit') || s.includes('pending') || s.includes('review')) submitted++;
      else if (s.includes('approv')) approved++;
    });

    return {
      total: revisions.length,
      draft,
      submitted,
      approved,
      totalVariance,
    };
  }, [revisions]);

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

  // Workflow confirmation execution
  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, item } = confirmAction;
    setActionSubmitting(true);
    try {
      if (type === 'submit') {
        await budgetsApi.revisions.submit(item.budget_id, item.id, { comments: actionComments || undefined });
        toast.success('Budget revision submitted for approval.');
      } else if (type === 'approve') {
        await budgetsApi.revisions.approve(item.budget_id, item.id, { comments: actionComments || undefined });
        toast.success('Budget revision approved. Master baseline updated.');
      } else if (type === 'reject') {
        if (!actionComments.trim()) {
          toast.error('Rejection comments are required.');
          setActionSubmitting(false);
          return;
        }
        await budgetsApi.revisions.reject(item.budget_id, item.id, { comments: actionComments });
        toast.success('Budget revision rejected.');
      } else if (type === 'delete') {
        await budgetsApi.revisions.remove(item.budget_id, item.id);
        toast.success('Budget revision deleted.');
      }
      setConfirmAction(null);
      setActionComments('');
      refresh();
    } catch (err) {
      toast.error(err?.message || `Failed to ${type} budget revision.`);
    } finally {
      setActionSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/budgets' },
    { label: 'Budget Revisions' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Budget Revisions"
        breadcrumbs={breadcrumbs}
        description="Track, review, and control project budget revisions, baseline adjustments, and variance impact."
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Revisions"
            value={kpis.total}
            status="primary"
            icon={<Layers className="w-4 h-4" />}
          />
          <KpiCard
            label="Approved Revisions"
            value={kpis.approved}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Pending Approval"
            value={kpis.submitted}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Net Variance Impact"
            value={`${kpis.totalVariance >= 0 ? '+' : ''}₹${(kpis.totalVariance / 100000).toFixed(1)} L`}
            status={kpis.totalVariance >= 0 ? 'success' : 'neutral'}
            icon={<TrendingUp className="w-4 h-4 text-sky-500" />}
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
                onChange={(value) => setFilters((c) => ({ ...c, project_id: value }))}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                className="text-xs h-8"
                options={[
                  { value: 'all', label: 'All Budgets' },
                  ...budgets.map((b) => ({
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
                placeholder="Search rev no, budget, reason..."
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
                Create Revision
              </Button>
            )}
          </div>
        </div>

        {/* Fluid Zero-Scroll Table - Desktop View */}
        <div className="hidden sm:block border border-border rounded-lg overflow-hidden bg-surface shadow-xs">
          {loading ? (
            <div className="py-16 text-center text-text-muted text-xs">Loading budget revisions...</div>
          ) : filteredRevisions.length === 0 ? (
            <div className="py-16 text-center text-text-muted text-xs">
              No budget revisions found matching the selected criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2">Revision</th>
                  <th className="px-3 py-2">Parent Budget</th>
                  <th className="px-3 py-2">Project</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Reason / Scope</th>
                  <th className="px-3 py-2 text-right">Previous Baseline</th>
                  <th className="px-3 py-2 text-right">Net Variance</th>
                  <th className="px-3 py-2 text-right">Revised Baseline</th>
                  <th className="px-3 py-2 text-center w-28">Status</th>
                  <th className="px-3 py-2 w-28 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRevisions.map((rev, idx) => {
                  const variance = Number(rev.variance_amount || 0);
                  const statusStr = String(rev.status_code || rev.status_name || rev.status || 'DRAFT').toUpperCase();
                  const isDraft = statusStr.includes('DRAFT');
                  const isPending = statusStr.includes('SUBMIT') || statusStr.includes('PENDING') || statusStr.includes('REVIEW');

                  return (
                    <tr key={rev.id || idx} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-3 py-2 text-center text-text-muted text-[11px]">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono font-bold text-text-primary">
                        REV-{String(rev.revision_no || idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-mono font-semibold text-text-primary text-[11px]">{rev.budget_code}</div>
                        <div className="text-[11px] text-text-secondary truncate max-w-[140px]" title={rev.budget_name}>
                          {rev.budget_name || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-text-secondary max-w-[130px] truncate" title={rev.project_name}>
                        {rev.project_name || '—'}
                      </td>
                      <td className="px-3 py-2 text-text-secondary font-mono text-[11px]">
                        {rev.revision_date ? rev.revision_date.split('T')[0] : '—'}
                      </td>
                      <td className="px-3 py-2 text-text-primary max-w-xs truncate" title={rev.reason}>
                        {rev.reason || '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-text-secondary">
                        ₹{Number(rev.previous_total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-rose-600' : 'text-text-muted'}`}>
                        {variance > 0 ? '+' : ''}₹{variance.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-text-primary">
                        ₹{Number(rev.revised_total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant={getVariant(statusStr)} className="text-[9px] font-bold uppercase tracking-wide">
                          {rev.status_name || statusStr}
                        </Badge>
                      </td>

                      {/* Action Menu: View and Menu dropdown */}
                      <td className="px-3 py-2 text-center relative">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingRevision({ budgetId: rev.budget_id, revisionId: rev.id })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded transition-colors font-medium"
                            title="View Revision Details"
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
                            className="absolute right-3 top-8 z-30 w-44 rounded-md border border-border bg-surface shadow-lg py-1 text-left animate-in fade-in zoom-in-95 duration-100"
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
                                Submit Revision
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
                                  Approve Revision
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
                                  Reject Revision
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
                                Delete Revision
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

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="py-12 text-center text-text-muted text-xs bg-surface border border-border rounded-lg">
              Loading budget revisions...
            </div>
          ) : filteredRevisions.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs bg-surface border border-border rounded-lg">
              No budget revisions found matching the selected criteria.
            </div>
          ) : (
            filteredRevisions.map((rev, idx) => {
              const variance = Number(rev.variance_amount || 0);
              const statusStr = String(rev.status_code || rev.status_name || rev.status || 'DRAFT').toUpperCase();
              const isDraft = statusStr.includes('DRAFT');
              const isPending = statusStr.includes('SUBMIT') || statusStr.includes('PENDING') || statusStr.includes('REVIEW');

              return (
                <div key={rev.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                  {/* Top Bar: Rev Code, Parent Budget & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-primary">
                          REV-{String(rev.revision_no || idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">({rev.budget_code})</span>
                      </div>
                      <h4 className="font-semibold text-text-primary text-[13px] leading-snug truncate" title={rev.budget_name}>
                        {rev.budget_name || 'Untitled Budget'}
                      </h4>
                      <span className="text-[11px] text-text-muted block truncate">{rev.project_name || 'No Project'}</span>
                    </div>
                    <Badge variant={getVariant(statusStr)} className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0">
                      {rev.status_name || statusStr}
                    </Badge>
                  </div>

                  {/* Reason if available */}
                  {rev.reason && (
                    <p className="text-xs text-text-secondary bg-surface-muted/50 rounded p-2 text-[11px] italic">
                      "{rev.reason}"
                    </p>
                  )}

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border/60">
                    <div>
                      <span className="text-[10px] text-text-muted block">Previous</span>
                      <span className="font-mono font-medium text-text-secondary text-[11px]">
                        ₹{Number(rev.previous_total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-text-muted block">Variance</span>
                      <span className={`font-mono font-bold text-[11px] ${variance > 0 ? 'text-emerald-600' : variance < 0 ? 'text-rose-600' : 'text-text-muted'}`}>
                        {variance > 0 ? '+' : ''}₹{variance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted block">Revised</span>
                      <span className="font-mono font-bold text-text-primary text-[11px]">
                        ₹{Number(rev.revised_total || 0).toLocaleString('en-IN')}
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

      {/* Create Revision Modal */}
      <BudgetRevisionFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaveSuccess={(bId) => {
          refresh();
        }}
      />

      {/* Revision Detail Modal */}
      {viewingRevision && (
        <BudgetRevisionDetailModal
          isOpen={Boolean(viewingRevision)}
          budgetId={viewingRevision.budgetId}
          revisionId={viewingRevision.revisionId}
          onClose={() => setViewingRevision(null)}
          onRefresh={refresh}
        />
      )}

      {/* Confirmation & Workflow Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-text-primary capitalize">
              {confirmAction.type === 'submit' && 'Submit Revision for Approval'}
              {confirmAction.type === 'approve' && 'Approve Budget Revision'}
              {confirmAction.type === 'reject' && 'Reject Budget Revision'}
              {confirmAction.type === 'delete' && 'Delete Draft Revision'}
            </h3>
            <p className="text-xs text-text-secondary">
              {confirmAction.type === 'submit' && 'Submit this revision for management review. Baseline changes will become locked until approved.'}
              {confirmAction.type === 'approve' && 'Approving this revision will immediately recalculate and replace the active project budget baseline.'}
              {confirmAction.type === 'reject' && 'Provide a reason for rejecting this proposed budget revision.'}
              {confirmAction.type === 'delete' && 'Are you sure you want to delete this draft revision? This action cannot be undone.'}
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

export default BudgetRevisionsPage;
