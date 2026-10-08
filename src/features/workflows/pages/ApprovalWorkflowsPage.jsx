import { useState, useEffect, useCallback, useMemo } from 'react';
import { GitMerge, Plus, Edit, Trash2, RefreshCw, ShieldCheck, Layers, Clock } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { approvalWorkflowsApi } from '../../../api/apiservice';

const MODULE_OPTIONS = [
  { value: 'boq', label: 'BOQ & Takeoff Approvals' },
  { value: 'budgets', label: 'Budget & Variation Approvals' },
  { value: 'procurement', label: 'Purchase Requisition & PO Approvals' },
  { value: 'subcontracts', label: 'RA Bill & Subcontract Approvals' },
  { value: 'labour', label: 'Wage Batch Approvals' },
  { value: 'finance', label: 'Expense & Advance Approvals' }
];

export function ApprovalWorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    workflow_name: '',
    module_code: 'budgets',
    trigger_condition: '',
    approver_roles: 'Project Manager, Finance Head',
    steps_count: '2',
    is_active: '1',
    description: ''
  });

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await approvalWorkflowsApi.list();
      const list = res?.data?.workflows ?? res?.data ?? (Array.isArray(res) ? res : []);
      setWorkflows(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load approval workflows:', err);
      toast.error('Failed to load approval workflows from backend.');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleOpenAdd = () => {
    setForm({
      workflow_name: '',
      module_code: 'budgets',
      trigger_condition: '',
      approver_roles: 'Project Manager, Finance Head',
      steps_count: '2',
      is_active: '1',
      description: ''
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      workflow_name: item.workflow_name || item.name || '',
      module_code: item.module_code || item.module || 'budgets',
      trigger_condition: item.trigger_condition || '',
      approver_roles: item.approver_roles || 'Project Manager',
      steps_count: String(item.steps_count || '1'),
      is_active: item.is_active !== 0 ? '1' : '0',
      description: item.description || ''
    });
    setEditingItem(item);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.workflow_name.trim()) {
      toast.error('Workflow name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        steps_count: Number(form.steps_count) || 1,
        is_active: form.is_active === '1' ? 1 : 0
      };

      if (editingItem) {
        await approvalWorkflowsApi.update(editingItem.id, payload);
        toast.success('Approval workflow scheme updated.');
        setEditingItem(null);
      } else {
        await approvalWorkflowsApi.create(payload);
        toast.success('New approval workflow scheme configured.');
        setIsAddOpen(false);
      }
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to save approval workflow:', err);
      toast.error(err.response?.data?.message || 'Failed to save workflow.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    try {
      await approvalWorkflowsApi.remove(deletingItem.id);
      toast.success('Approval workflow scheme deleted.');
      setDeletingItem(null);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      toast.error(err.response?.data?.message || 'Failed to delete workflow.');
    } finally {
      setSaving(false);
    }
  };

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(w => {
      const q = search.toLowerCase();
      const name = String(w.workflow_name || w.name || '').toLowerCase();
      const mod = String(w.module_code || w.module || '').toLowerCase();
      const roles = String(w.approver_roles || '').toLowerCase();
      const matchesSearch = name.includes(q) || mod.includes(q) || roles.includes(q);

      const matchesModule = selectedModule === 'all' || mod === selectedModule.toLowerCase();
      const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'active' ? w.is_active !== 0 : w.is_active === 0);

      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [workflows, search, selectedModule, selectedStatus]);

  const totalPages = Math.ceil(filteredWorkflows.length / perPage) || 1;
  const pagedWorkflows = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredWorkflows.slice(start, start + perPage);
  }, [filteredWorkflows, page, perPage]);

  // KPI Calculations
  const activeCount = useMemo(() => workflows.filter(w => w.is_active !== 0).length, [workflows]);
  const inactiveCount = useMemo(() => workflows.filter(w => w.is_active === 0).length, [workflows]);

  return (
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title="Approval Workflow Schemes"
        subtitle="Configure multi-tier document approval chains, role thresholds, and governance matrices"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Client Portal', href: '#' },
          { label: 'Approval Workflow Schemes' }
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflows}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* KPI Stats Bar - Standard Site Team Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Workflow Schemes"
          value={workflows.length}
          status="info"
          icon={<GitMerge className="w-4 h-4 text-sky-500" />}
        />
        <KpiCard
          label="Active Schemes"
          value={activeCount}
          status="success"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
        />
        <KpiCard
          label="Configured Modules"
          value={MODULE_OPTIONS.length}
          status="warning"
          icon={<Layers className="w-4 h-4 text-amber-500" />}
        />
        <KpiCard
          label="Inactive Schemes"
          value={inactiveCount}
          status="neutral"
          icon={<Clock className="w-4 h-4 text-slate-500" />}
        />
      </div>

      {/* Filter and Action Bar - Matched with Site Team Assignment */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Module Selector */}
          <div className="w-full sm:w-56">
            <Select
              options={[
                { value: 'all', label: 'All Target Modules' },
                ...MODULE_OPTIONS
              ]}
              value={selectedModule}
              onChange={(val) => {
                setSelectedModule(val);
                setPage(1);
              }}
              className="text-xs h-8"
            />
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-52">
            <SearchField
              placeholder="Search workflow name, approvers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val);
                setPage(1);
              }}
              className="text-xs h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWorkflows}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenAdd}
            className="text-xs h-8 shadow-xs"
          >
            Add Approval Workflow
          </Button>
        </div>
      </div>

      {/* Desktop & Tablet Table (Hidden on small screens) */}
      <div className="hidden sm:block">
        <DataTableContainer
          pagination={
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredWorkflows.length}
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
                <th className="px-3 py-2">Workflow Scheme Name</th>
                <th className="px-3 py-2">Target Module</th>
                <th className="px-3 py-2 text-center w-28">Approval Steps</th>
                <th className="px-3 py-2">Approver Roles</th>
                <th className="px-3 py-2 text-center w-28">Status</th>
                <th className="px-3 py-2 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                    Loading approval workflows from backend...
                  </td>
                </tr>
              ) : pagedWorkflows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-text-muted text-[12px]">
                    No approval workflow schemes found matching filters.
                  </td>
                </tr>
              ) : (
                pagedWorkflows.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-3 py-2 text-center text-text-muted text-[11px]">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-text-primary text-[12px]">
                        {item.workflow_name || item.name}
                      </div>
                      {item.description && (
                        <div className="text-[10px] text-text-muted truncate max-w-xs">{item.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] font-semibold text-primary">
                      {MODULE_OPTIONS.find(m => m.value === (item.module_code || item.module))?.label || item.module_code || item.module}
                    </td>
                    <td className="px-3 py-2 text-center text-text-primary font-semibold">
                      {item.steps_count || 1} Step(s)
                    </td>
                    <td className="px-3 py-2 text-text-secondary text-[11px]">
                      {item.approver_roles || 'Project Manager'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge
                        variant={item.is_active !== 0 ? 'success' : 'neutral'}
                        className="text-[8px] px-1.5 py-0.5"
                      >
                        {item.is_active !== 0 ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => setDeletingItem(item)}
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Mobile Card Layout (Visible only on small screens) */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">
            Loading approval workflows...
          </div>
        ) : pagedWorkflows.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">
            No approval workflows found.
          </div>
        ) : (
          pagedWorkflows.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-lg p-3 space-y-2.5 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-text-primary text-xs">{item.workflow_name || item.name}</h4>
                  <span className="font-mono text-[10px] text-primary font-bold">{item.module_code || item.module}</span>
                </div>
                <Badge
                  variant={item.is_active !== 0 ? 'success' : 'neutral'}
                  className="text-[8px] px-1.5 py-0.5"
                >
                  {item.is_active !== 0 ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="text-xs pt-1 border-t border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Approvers ({item.steps_count || 1} Steps)</span>
                <span className="font-medium text-text-primary text-[11px] truncate block">{item.approver_roles || 'Project Manager'}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(item)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-rose-600" onClick={() => setDeletingItem(item)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal - Exact SiteTeamPage Form Structure */}
      {(isAddOpen || editingItem) && (
        <EntityEditModal
          isOpen={true}
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        >
          <EntityEditModal.Header
            icon={GitMerge}
            title={editingItem ? 'Edit Approval Workflow Scheme' : 'Configure New Approval Workflow'}
            subtitle="Define multi-tier approval chains, threshold rules, and approver roles."
            onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
          />
          <form id="approval-workflow-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EntityEditModal.Body>
              <EntityEditModal.Section title="Workflow Identification & Target Module">
                <EntityEditModal.Grid>
                  <FormField label="Workflow Scheme Name" required>
                    <Input
                      value={form.workflow_name}
                      onChange={e => setForm(prev => ({ ...prev, workflow_name: e.target.value }))}
                      placeholder="e.g. High Value PO Approval Scheme"
                    />
                  </FormField>

                  <FormField label="Target Module" required>
                    <Select
                      options={MODULE_OPTIONS}
                      value={form.module_code}
                      onChange={(val) => setForm(prev => ({ ...prev, module_code: val }))}
                    />
                  </FormField>

                  <FormField label="Approver Roles (Comma-separated)" required className="md:col-span-2">
                    <Input
                      value={form.approver_roles}
                      onChange={e => setForm(prev => ({ ...prev, approver_roles: e.target.value }))}
                      placeholder="e.g. Site Engineer, Project Manager, Finance Head"
                    />
                  </FormField>

                  <FormField label="Number of Steps">
                    <Input
                      type="number"
                      value={form.steps_count}
                      onChange={e => setForm(prev => ({ ...prev, steps_count: e.target.value }))}
                      placeholder="2"
                    />
                  </FormField>

                  <FormField label="Scheme Status">
                    <Select
                      options={[
                        { value: '1', label: 'Active' },
                        { value: '0', label: 'Inactive' },
                      ]}
                      value={form.is_active}
                      onChange={(val) => setForm(prev => ({ ...prev, is_active: val }))}
                    />
                  </FormField>

                  <FormField label="Description & Governance Rules" className="md:col-span-2">
                    <Textarea
                      rows={3}
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe trigger conditions, financial threshold limits, or escalation policies..."
                    />
                  </FormField>
                </EntityEditModal.Grid>
              </EntityEditModal.Section>
            </EntityEditModal.Body>

            <EntityEditModal.Footer
              formId="approval-workflow-form"
              submitLabel={editingItem ? 'Update Scheme' : 'Save Scheme'}
              onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
              isSubmitting={saving}
            />
          </form>
        </EntityEditModal>
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Approval Workflow Scheme"
          message={`Are you sure you want to delete workflow scheme "${deletingItem.workflow_name || deletingItem.name}"?`}
          confirmLabel="Delete Scheme"
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
          loading={saving}
          variant="danger"
        />
      )}
    </PageContainer>
  );
}

export default ApprovalWorkflowsPage;
