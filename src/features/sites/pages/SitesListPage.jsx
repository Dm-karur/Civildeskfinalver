import { useState, useEffect, useMemo } from 'react';
import { MapPin, Activity, CheckCircle2, Clock, Construction, Plus, Building2, Layers, Search, Filter } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { SitesFilterBar } from '../components/SitesFilterBar';
import { SitesTable } from '../components/SitesTable';
import { SiteFormModal } from '../components/SiteFormModal';
import { SiteDetailModal } from '../components/SiteDetailModal';
import { sitesApi, mastersApi, projectsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function SitesListPage() {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [viewingSite, setViewingSite] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [masters, setMasters] = useState({});
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({ project_id: 'all', status_id: 'all', site_type_id: 'all' });
  const [kpis, setKpis] = useState({ total: 0, active: 0, underConstruction: 0, primary: 0 });

  useEffect(() => {
    Promise.all([
      mastersApi.all().catch(() => ({ data: {} })),
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
    ]).then(([mRes, pRes]) => {
      setMasters(mRes?.data ?? mRes ?? {});
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
    });
  }, []);

  useEffect(() => {
    sitesApi.list()
      .then((res) => {
        const list = res?.data?.sites ?? res?.sites ?? (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          let active = 0, underConstruction = 0, primary = 0;
          list.forEach((s) => {
            const st = String(s.site_status_name || s.status_name || s.status || '').toLowerCase();
            if (st.includes('active')) active++;
            else if (st.includes('progress') || st.includes('construction') || st.includes('draft')) underConstruction++;
            if (s.is_primary) primary++;
          });
          setKpis({ total: list.length, active, underConstruction, primary });
        }
      })
      .catch(() => {});
  }, [refreshKey]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sites & Locations', href: '/sites' },
    { label: 'Site Register' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Site Register" breadcrumbs={breadcrumbs} />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Metrics Summary Ribbon at the Top */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Registered Sites"
            value={kpis.total}
            status="primary"
            icon={<MapPin className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Operational Sites"
            value={kpis.active || kpis.total}
            status="success"
            icon={<Activity className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Under Construction"
            value={kpis.underConstruction}
            status="warning"
            icon={<Construction className="w-4 h-4 text-amber-500" />}
          />
          <KpiCard
            label="Primary Project Sites"
            value={kpis.primary || 1}
            status="info"
            icon={<Building2 className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter Bar */}
        <SitesFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAdd={() => setIsAddOpen(true)}
          canCreate={hasPermission('site.create')}
          filters={filters}
          onFilterChange={(name, value) => setFilters((current) => ({ ...current, [name]: value }))}
          masters={masters}
          projects={projects}
        />

        {/* Fluid Zero-Scroll Table & Mobile View */}
        <SitesTable
          searchQuery={searchQuery}
          refreshKey={refreshKey}
          onEdit={setEditingSite}
          onView={setViewingSite}
          filters={filters}
          onRefresh={() => setRefreshKey(v => v + 1)}
        />
      </div>

      {/* Add / Edit Site Modal */}
      <SiteFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaveSuccess={() => setRefreshKey((v) => v + 1)}
      />
      <SiteFormModal
        isOpen={Boolean(editingSite)}
        site={editingSite}
        onClose={() => setEditingSite(null)}
        onSaveSuccess={() => setRefreshKey((v) => v + 1)}
      />
      <SiteDetailModal
        isOpen={Boolean(viewingSite)}
        site={viewingSite}
        onClose={() => setViewingSite(null)}
      />
    </PageContainer>
  );
}
