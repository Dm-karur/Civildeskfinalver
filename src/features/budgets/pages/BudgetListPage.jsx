import { useState, useEffect } from 'react';
import { Wallet, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { BudgetFilterBar } from '../components/BudgetFilterBar';
import { BudgetTable } from '../components/BudgetTable';
import { BudgetFormModal } from '../components/BudgetFormModal';
import { BudgetDetailModal } from '../components/BudgetDetailModal';
import { budgetsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function BudgetListPage() {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [viewingBudget, setViewingBudget] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({ status: 'all' });
  const [kpis, setKpis] = useState({ total: 0, draft: 0, submitted: 0, approved: 0, totalAmount: 0 });

  useEffect(() => {
    budgetsApi.list()
      .then((res) => {
        const list = res?.data?.project_budgets ?? res?.project_budgets ?? (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          let draft = 0, submitted = 0, approved = 0, totalAmount = 0;
          list.forEach((b) => {
            const s = String(b.status_name || b.status || '').toLowerCase();
            if (s.includes('draft')) draft++;
            else if (s.includes('submitted') || s.includes('pending')) submitted++;
            else if (s.includes('approved')) approved++;
            totalAmount += Number(b.total_amount || b.grand_total || 0);
          });
          setKpis({ total: list.length, draft, submitted, approved, totalAmount });
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Masters' },
    { label: 'Budgets' },
  ];

  const refresh = () => setRefreshKey((v) => v + 1);

  return (
    <PageContainer>
      <PageHeader title="Project Budgets" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4">
        <BudgetFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAdd={() => setIsAddOpen(true)}
          canCreate={hasPermission('budget.create')}
          filters={filters}
          onFilterChange={(name, value) => setFilters((c) => ({ ...c, [name]: value }))}
        />

        <BudgetTable
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          onEdit={setEditingBudget}
          onView={setViewingBudget}
          filters={filters}
          onAction={refresh}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <KpiCard label="Total Budgets" value={kpis.total} description="All project budgets" status="primary" icon={<Wallet className="w-5 h-5" />} />
          <KpiCard label="Draft" value={kpis.draft} description="Awaiting submission" status="neutral" icon={<Clock className="w-5 h-5" />} />
          <KpiCard label="Pending Approval" value={kpis.submitted} description="Under review" status="warning" icon={<AlertCircle className="w-5 h-5" />} />
          <KpiCard label="Approved" value={kpis.approved} description={`₹${kpis.totalAmount.toLocaleString('en-IN')} total`} status="success" icon={<CheckCircle className="w-5 h-5" />} />
        </div>
      </div>

      <BudgetFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaveSuccess={refresh} />
      <BudgetFormModal isOpen={Boolean(editingBudget)} budget={editingBudget} onClose={() => setEditingBudget(null)} onSaveSuccess={refresh} />
      <BudgetDetailModal isOpen={Boolean(viewingBudget)} budget={viewingBudget} onClose={() => setViewingBudget(null)} />
    </PageContainer>
  );
}
