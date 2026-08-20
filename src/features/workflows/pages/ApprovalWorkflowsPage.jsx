import { useState, useMemo } from 'react';
import { PageContainer, PageHeader } from '../../../components/layout';
import { Button } from '../../../components/ui/Button';
import { Plus, Workflow, CheckCircle2, XCircle, Grid2x2 } from 'lucide-react';
import { MOCK_WORKFLOWS } from '../data/mockWorkflows';
import { WorkflowsFilterBar } from '../components/WorkflowsFilterBar';
import { WorkflowsTable } from '../components/WorkflowsTable';
import { WorkflowDetailsModal } from '../components/WorkflowDetailsModal';
import { WorkflowFormModal } from '../components/WorkflowFormModal';
import { toast } from '../../../components/composite/Toast';

export function ApprovalWorkflowsPage() {
  const [workflows, setWorkflows] = useState(MOCK_WORKFLOWS);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewingWorkflow, setViewingWorkflow] = useState(null);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(wf => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !wf.name.toLowerCase().includes(q) &&
          !wf.code.toLowerCase().includes(q) &&
          !wf.transaction.toLowerCase().includes(q)
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
    toast.success('Workflow deleted (mock)');
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
        description="Configure approval rules and authorization flows for Civil Desk transactions."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Administration', to: '/administration/users' }, // Dummy intermediate
          { label: 'Approval Workflows' }
        ]}
        rightContent={
          <Button 
            variant="primary" 
            onClick={() => setIsAddOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Workflow</span>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 min-w-0 h-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <Workflow className="w-4 h-4" />
              <span className="text-[12px] font-semibold">Total Workflows</span>
            </div>
            <span className="text-xl font-bold text-text-primary">{totalWorkflows}</span>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[12px] font-semibold">Active</span>
            </div>
            <span className="text-xl font-bold text-emerald-600">{activeWorkflows}</span>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <XCircle className="w-4 h-4 text-text-muted" />
              <span className="text-[12px] font-semibold">Inactive</span>
            </div>
            <span className="text-xl font-bold text-text-primary">{inactiveWorkflows}</span>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3 sm:p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 text-text-secondary mb-1">
              <Grid2x2 className="w-4 h-4 text-blue-500" />
              <span className="text-[12px] font-semibold">Approval Modules</span>
            </div>
            <span className="text-xl font-bold text-text-primary">{uniqueModules}</span>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="flex flex-col min-h-0 flex-1 bg-surface border border-border rounded-lg overflow-hidden shadow-sm">
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
