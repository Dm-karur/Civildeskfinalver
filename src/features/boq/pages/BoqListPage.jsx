import { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle2, Clock, AlertCircle, TrendingUp, IndianRupee } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { BoqFilterBar } from '../components/BoqFilterBar';
import { BoqTable } from '../components/BoqTable';
import { BoqFormModal } from '../components/BoqFormModal';
import { BoqDetailModal } from '../components/BoqDetailModal';
import { boqApi, projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function BoqListPage() {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBoq, setEditingBoq] = useState(null);
  const [viewingBoq, setViewingBoq] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({ project_id: 'all', status: 'all' });
  const [projects, setProjects] = useState([]);
  const [kpis, setKpis] = useState({ total: 0, draft: 0, submitted: 0, approved: 0, totalAmount: 0 });

  useEffect(() => {
    projectsApi.list()
      .then((res) => {
        const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : []);
        setProjects(Array.isArray(list) ? list : []);
      })
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    boqApi.list()
      .then((res) => {
        const list = res?.data?.project_boqs ?? res?.project_boqs ?? res?.data?.data ?? (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          let draft = 0, submitted = 0, approved = 0, totalAmount = 0;
          list.forEach((b) => {
            const s = String(b.status_name || b.status || b.status_code || '').toLowerCase();
            const amt = Number(b.total_amount || b.grand_total || 0);
            totalAmount += amt;
            if (s.includes('draft')) draft++;
            else if (s.includes('submitted') || s.includes('review') || s.includes('pending')) submitted++;
            else if (s.includes('approved')) approved++;
          });
          setKpis({ total: list.length, draft, submitted, approved, totalAmount });
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'BOQ & Project Budget', href: '/boq' },
    { label: 'BOQ Register' },
  ];

  const refresh = () => setRefreshKey((v) => v + 1);

  return (
    <PageContainer>
      <PageHeader title="BOQ Register" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* Top-aligned KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total BOQs"
            value={kpis.total}
            status="primary"
            icon={<FileSpreadsheet className="w-4 h-4" />}
          />
          <KpiCard
            label="Approved BOQs"
            value={kpis.approved}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Under Review / Submitted"
            value={kpis.submitted}
            status="warning"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Total Value"
            value={`₹${(kpis.totalAmount / 100000).toFixed(1)} L`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <BoqFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAdd={() => setIsAddOpen(true)}
          canCreate={hasPermission('boq.create')}
          filters={filters}
          onFilterChange={(name, value) => setFilters((c) => ({ ...c, [name]: value }))}
          projects={projects}
        />

        {/* Fluid Zero-Scroll BOQ Table */}
        <BoqTable
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          onEdit={setEditingBoq}
          onView={setViewingBoq}
          filters={filters}
          onAction={refresh}
        />
      </div>

      <BoqFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaveSuccess={refresh} />
      <BoqFormModal isOpen={Boolean(editingBoq)} boq={editingBoq} onClose={() => setEditingBoq(null)} onSaveSuccess={refresh} />
      <BoqDetailModal isOpen={Boolean(viewingBoq)} boq={viewingBoq} onClose={() => setViewingBoq(null)} onRefresh={refresh} />
    </PageContainer>
  );
}
