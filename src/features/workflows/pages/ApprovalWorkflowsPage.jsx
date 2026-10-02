import { useState, useEffect, useCallback } from 'react';
import { GitMerge, Plus, Edit, Trash2, RefreshCw, ShieldCheck } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
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
      is_active: item.is_active ? '1' : '0',
      description: item.description || ''
    });
    setEditingItem(item);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        steps_count: Number(form.steps_count) || 1,
        is_active: form.is_active === '1' ? 1 : 0
      };

      if (editingItem) {
        await approvalWorkflowsApi.update(editingItem.id, payload);
        toast.success('Approval workflow updated.');
        setEditingItem(null);
      } else {
        await approvalWorkflowsApi.create(payload);
        toast.success('New approval workflow configured.');
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
      toast.success('Approval workflow deleted.');
      setDeletingItem(null);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to delete workflow:', err);
      toast.error(err.response?.data?.message || 'Failed to delete workflow.');
    } finally {
      setSaving(false);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    const q = searchQuery.toLowerCase();
    const name = String(w.workflow_name || w.name || '').toLowerCase();
    const mod = String(w.module_code || w.module || '').toLowerCase();
    return name.includes(q) || mod.includes(q);
  });

  const totalPages = Math.ceil(filteredWorkflows.length / perPage) || 1;
  const paginatedWorkflows = filteredWorkflows.slice((page - 1) * perPage, page * perPage);

  return (
    <PageContainer>
      <PageHeader
        title="Approval Workflow Schemes"
        subtitle="Configure multi-tier document approval chains, role thresholds, and governance matrices"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchWorkflows} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} className="gap-2 bg-[#0056C9] hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Approval Workflow
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="Active Workflow Schemes"
          value={workflows.filter(w => w.is_active !== 0).length}
          icon={GitMerge}
          variant="primary"
        />
        <KpiCard
          title="Configured Modules"
          value={MODULE_OPTIONS.length}
          icon={ShieldCheck}
          variant="success"
        />
        <KpiCard
          title="Total Workflows"
          value={workflows.length}
          icon={GitMerge}
          variant="neutral"
        />
      </div>

      <DataTableContainer
        toolbar={
          <div className="flex items-center gap-4">
            <div className="w-72">
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search workflows..."
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Workflow Name</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Approval Steps</th>
                <th className="py-3 px-4">Approver Roles</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading approval workflows from backend...
                  </td>
                </tr>
              ) : paginatedWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No approval workflow schemes found in database.
                  </td>
                </tr>
              ) : (
                paginatedWorkflows.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {item.workflow_name || item.name}
                      {item.description && <p className="text-xs text-slate-500 font-normal">{item.description}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-amber-600 dark:text-amber-400">
                      {item.module_code || item.module}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {item.steps_count || 1} Step(s)
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs">
                      {item.approver_roles || 'Project Manager'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.is_active === 0 ? 'neutral' : 'success'}>
                        {item.is_active === 0 ? 'Inactive' : 'Active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                          <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingItem(item)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalEntries={filteredWorkflows.length}
          perPage={perPage}
        />
      </DataTableContainer>

      {/* Edit Modal */}
      {(isAddOpen || editingItem) && (
        <EntityEditModal
          isOpen={true}
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
          onSave={handleSubmit}
          title={editingItem ? 'Edit Approval Workflow' : 'Add Approval Workflow'}
          saving={saving}
        >
          <div className="space-y-4">
            <FormField label="Workflow Name" required>
              <Input
                value={form.workflow_name}
                onChange={e => setForm(prev => ({ ...prev, workflow_name: e.target.value }))}
                placeholder="e.g. High Value PO Approval Scheme"
              />
            </FormField>

            <FormField label="Target Module" required>
              <Select
                value={form.module_code}
                onChange={e => setForm(prev => ({ ...prev, module_code: e.target.value }))}
              >
                {MODULE_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Approver Roles (Comma separated)" required>
              <Input
                value={form.approver_roles}
                onChange={e => setForm(prev => ({ ...prev, approver_roles: e.target.value }))}
                placeholder="Site Engineer, Project Manager, Finance Head"
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

            <FormField label="Description">
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Trigger conditions & escalation rules"
              />
            </FormField>
          </div>
        </EntityEditModal>
      )}

      {/* Delete Dialog */}
      {deletingItem && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Approval Workflow"
          message={`Are you sure you want to delete workflow "${deletingItem.workflow_name || deletingItem.name}"?`}
          confirmLabel="Delete"
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
