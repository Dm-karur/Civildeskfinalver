import { useState, useEffect } from 'react';
import { FileSpreadsheet, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { BoqFilterBar } from '../components/BoqFilterBar';
import { BoqTable } from '../components/BoqTable';
import { BoqFormModal } from '../components/BoqFormModal';
import { BoqDetailModal } from '../components/BoqDetailModal';
import { boqApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function BoqListPage() {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBoq, setEditingBoq] = useState(null);
  const [viewingBoq, setViewingBoq] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState({ status: 'all' });
  const [kpis, setKpis] = useState({ total: 0, draft: 0, submitted: 0, approved: 0 });

  useEffect(() => {
    boqApi.list()
      .then((res) => {
        const list = res?.data?.project_boqs ?? res?.project_boqs ?? (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          let draft = 0, submitted = 0, approved = 0;
          list.forEach((b) => {
            const s = String(b.status_name || b.status || '').toLowerCase();
            if (s.includes('draft')) draft++;
            else if (s.includes('submitted') || s.includes('pending')) submitted++;
            else if (s.includes('approved')) approved++;
          });
          setKpis({ total: list.length, draft, submitted, approved });
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Masters' },
    { label: 'BOQ' },
  ];

  const refresh = () => setRefreshKey((v) => v + 1);

  return (
    <PageContainer>
      <PageHeader title="Bill of Quantities" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4">
        <BoqFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAdd={() => setIsAddOpen(true)}
          canCreate={hasPermission('boq.create')}
          filters={filters}
          onFilterChange={(name, value) => setFilters((c) => ({ ...c, [name]: value }))}
        />

        <BoqTable
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          onEdit={setEditingBoq}
          onView={setViewingBoq}
          filters={filters}
          onAction={refresh}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <KpiCard label="Total BOQs" value={kpis.total} description="All bill of quantities" status="primary" icon={<FileSpreadsheet className="w-5 h-5" />} />
          <KpiCard label="Draft" value={kpis.draft} description="Awaiting submission" status="neutral" icon={<Clock className="w-5 h-5" />} />
          <KpiCard label="Submitted" value={kpis.submitted} description="Pending approval" status="warning" icon={<AlertCircle className="w-5 h-5" />} />
          <KpiCard label="Approved" value={kpis.approved} description="Ready for use" status="success" icon={<CheckCircle className="w-5 h-5" />} />
        </div>
      </div>

      <BoqFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaveSuccess={refresh} />
      <BoqFormModal isOpen={Boolean(editingBoq)} boq={editingBoq} onClose={() => setEditingBoq(null)} onSaveSuccess={refresh} />
      <BoqDetailModal isOpen={Boolean(viewingBoq)} boq={viewingBoq} onClose={() => setViewingBoq(null)} />
    </PageContainer>
  );
}
