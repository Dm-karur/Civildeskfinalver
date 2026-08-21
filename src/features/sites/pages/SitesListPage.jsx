import { useState, useEffect } from 'react';
import { MapPin, Activity, CheckCircle, Clock, Construction } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { SitesFilterBar } from '../components/SitesFilterBar';
import { SitesTable } from '../components/SitesTable';
import { SiteFormModal } from '../components/SiteFormModal';
import { SiteDetailModal } from '../components/SiteDetailModal';
import { sitesApi, mastersApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function SitesListPage() {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [viewingSite, setViewingSite] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [masters, setMasters] = useState({});
  const [filters, setFilters] = useState({ status_id: 'all', site_type_id: 'all' });
  const [kpis, setKpis] = useState({ total: 0, active: 0, underConstruction: 0, completed: 0 });

  useEffect(() => {
    mastersApi.all()
      .then((res) => setMasters(res?.data ?? res ?? {}))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    sitesApi.list()
      .then((res) => {
        const list = res?.data?.sites ?? res?.sites ?? (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          let active = 0, underConstruction = 0, completed = 0;
          list.forEach((s) => {
            const st = String(s.status_name || s.status || '').toLowerCase();
            if (st.includes('active')) active++;
            else if (st.includes('progress') || st.includes('construction')) underConstruction++;
            else if (st.includes('complete')) completed++;
          });
          setKpis({ total: list.length, active, underConstruction, completed });
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Masters' },
    { label: 'Sites' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Project Sites" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-4">
        <SitesFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAdd={() => setIsAddOpen(true)}
          canCreate={hasPermission('site.create')}
          filters={filters}
          onFilterChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          masters={masters}
        />

        <SitesTable
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          onEdit={setEditingSite}
          onView={setViewingSite}
          filters={filters}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <KpiCard label="Total Sites" value={kpis.total} description="All project sites" status="primary" icon={<MapPin className="w-5 h-5" />} />
          <KpiCard label="Active" value={kpis.active} description="Currently active sites" status="success" icon={<Activity className="w-5 h-5" />} />
          <KpiCard label="Under Construction" value={kpis.underConstruction} description="In progress" status="warning" icon={<Construction className="w-5 h-5" />} />
          <KpiCard label="Completed" value={kpis.completed} description="Finished projects" status="info" icon={<CheckCircle className="w-5 h-5" />} />
        </div>
      </div>

      <SiteFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSaveSuccess={() => setRefreshKey((v) => v + 1)} />
      <SiteFormModal isOpen={Boolean(editingSite)} site={editingSite} onClose={() => setEditingSite(null)} onSaveSuccess={() => setRefreshKey((v) => v + 1)} />
      <SiteDetailModal isOpen={Boolean(viewingSite)} site={viewingSite} onClose={() => setViewingSite(null)} />
    </PageContainer>
  );
}
