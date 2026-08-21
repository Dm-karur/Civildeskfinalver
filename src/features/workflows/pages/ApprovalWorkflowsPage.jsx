import { useState, useMemo, useEffect } from 'react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { Button } from '../../../components/ui/Button';
import { Plus, Workflow, CheckCircle2, XCircle, Grid2x2 } from 'lucide-react';
import { WorkflowsFilterBar } from '../components/WorkflowsFilterBar';
import { WorkflowsTable } from '../components/WorkflowsTable';
import { WorkflowDetailsModal } from '../components/WorkflowDetailsModal';
import { WorkflowFormModal } from '../components/WorkflowFormModal';
import { toast } from '../../../components/composite/Toast';
import { approvalsApi } from '../../../api/apiservice';

const DEFAULT_WORKFLOWS = [
  { id: '1', name: 'BOQ Approval Workflow', code: 'WF-BOQ', module: 'BOQ & Budget', transaction: 'BOQ Register', status: 'Active', scope: 'Company-Wide', levels: 2, approvers: 'Project Manager, Director', updated_at: '2026-08-20' },
  { id: '2', name: 'Budget Approval & Revision', code: 'WF-BDG', module: 'BOQ & Budget', transaction: 'Project Budgets', status: 'Active', scope: 'Company-Wide', levels: 3, approvers: 'QS, Finance Head, MD', updated_at: '2026-08-20' },
  { id: '3', name: 'Purchase Order Approval', code: 'WF-PO', module: 'Procurement', transaction: 'Purchase Orders', status: 'Active', scope: 'Project-Specific', levels: 2, approvers: 'Purchase Head, Director', updated_at: '2026-08-20' },
  { id: '4', name: 'Material Requisition Flow', code: 'WF-MR', module: 'Materials', transaction: 'Material Requests', status: 'Active', scope: 'Site-Specific', levels: 1, approvers: 'Site Incharge', updated_at: '2026-08-20' },
  { id: '5', name: 'Daily Work Report Certification', code: 'WF-DWR', module: 'Daily Operations', transaction: 'Daily Work Reports', status: 'Active', scope: 'Site-Specific', levels: 1, approvers: 'Project Engineer', updated_at: '2026-08-20' },
  { id: '6', name: 'Subcontract RA Bill Verification', code: 'WF-RA', module: 'Subcontracts', transaction: 'RA Bills', status: 'Active', scope: 'Project-Specific', levels: 2, approvers: 'Billing Engineer, PM', updated_at: '2026-08-20' },
  { id: '7', name: 'Labour Wage Period Finalization', code: 'WF-WG', module: 'Labour & Attendance', transaction: 'Daily Wages', status: 'Active', scope: 'Company-Wide', levels: 2, approvers: 'HR Manager, Finance Head', updated_at: '2026-08-20' },
  { id: '8', name: 'Expense Voucher Approval', code: 'WF-EXP', module: 'Finance', transaction: 'Expense Bills', status: 'Active', scope: 'Company-Wide', levels: 2, approvers: 'Accountant, CFO', updated_at: '2026-08-20' },
];

export function ApprovalWorkflowsPage() {
  const [workflows, setWorkflows] = useState(DEFAULT_WORKFLOWS);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingWorkflow, setViewingWorkflow] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  useEffect(() => {
    approvalsApi.summary()
      .then(res => {
        const list = res?.data?.workflows ?? res?.data?.data ?? [];
        if (Array.isArray(list) && list.length > 0) {
          setWorkflows(list);
        }
      })
      .catch(() => {});
  }, []);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(wf => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !(wf.name || '').toLowerCase().includes(q) &&
          !(wf.code || '').toLowerCase().includes(q) &&
          !(wf.transaction || '').toLowerCase().includes(q)
        ) return false;
      }

      if (moduleFilter !== 'all' && wf.module !== moduleFilter) return false;
      if (statusFilter !== 'all' && wf.status !== statusFilter) return false;
      if (scopeFilter !== 'all' && wf.scope !== scopeFilter) return false;

      return true;
    });
  }, [workflows, searchQuery, moduleFilter, statusFilter, scopeFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setModuleFilter('all');
    setStatusFilter('all');
    setScopeFilter('all');
  };

  const handleDelete = (id) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast.success('Workflow deleted');
  };

  const handleToggleStatus = (wf) => {
    const newStatus = wf.status === 'Active' ? 'Inactive' : 'Active';
    setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, status: newStatus } : w));
    toast.success(`Workflow marked as ${newStatus}`);
  };

  const handleSave = (newWorkflow, isEdit) => {
    if (isEdit) {
      setWorkflows(prev => prev.map(w => w.id === newWorkflow.id ? newWorkflow : w));
      toast.success('Workflow updated successfully');
    } else {
      setWorkflows(prev => [newWorkflow, ...prev]);
      toast.success('Workflow created successfully');
    }
    setEditingWorkflow(null);
    setIsAddOpen(false);
  };

  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter(w => w.status === 'Active').length;
  const inactiveWorkflows = workflows.filter(w => w.status === 'Inactive').length;
  const uniqueModules = new Set(workflows.map(w => w.module)).size;

  return (
    <PageContainer>
      <PageHeader
        title="Approval Workflows"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Administration' },
          { label: 'Approval Workflows' }
        ]}
      />

      <div className="flex flex-col gap-4 min-w-0 h-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-xs">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <Workflow className="w-4 h-4 text-primary" />
              <span className="text-[12px] font-semibold">Total Workflows</span>
            </div>
            <span className="text-xl font-bold text-text-primary">{totalWorkflows}</span>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-xs">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[12px] font-semibold">Active</span>
            </div>
            <span className="text-xl font-bold text-emerald-600">{activeWorkflows}</span>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-xs">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <XCircle className="w-4 h-4 text-text-muted" />
              <span className="text-[12px] font-semibold">Inactive</span>
            </div>
            <span className="text-xl font-bold text-text-primary">{inactiveWorkflows}</span>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-xs">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <Grid2x2 className="w-4 h-4 text-blue-500" />
              <span className="text-[12px] font-semibold">Approval Modules</span>
            </div>
            <span className="text-xl font-bold text-text-primary">{uniqueModules}</span>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="flex flex-col min-h-0 flex-1 bg-surface border border-border rounded-lg overflow-hidden shadow-xs">
          <WorkflowsFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            moduleFilter={moduleFilter}
            onModuleChange={setModuleFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            scopeFilter={scopeFilter}
            onScopeChange={setScopeFilter}
            onReset={handleResetFilters}
          />
          <div className="flex-1 min-h-0 flex flex-col min-w-0">
            <WorkflowsTable
              workflows={filteredWorkflows}
              onView={setViewingWorkflow}
              onEdit={setEditingWorkflow}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewingWorkflow && (
        <WorkflowDetailsModal
          workflow={viewingWorkflow}
          onClose={() => setViewingWorkflow(null)}
        />
      )}

      {(editingWorkflow || isAddOpen) && (
        <WorkflowFormModal
          isOpen={Boolean(editingWorkflow || isAddOpen)}
          workflow={editingWorkflow}
          onClose={() => {
            setEditingWorkflow(null);
            setIsAddOpen(false);
          }}
          onSaveSuccess={handleSave}
        />
      )}
    </PageContainer>
  );
}
