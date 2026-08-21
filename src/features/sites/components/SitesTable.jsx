import { useState, useEffect } from 'react';
import { Eye, Edit, MoreVertical } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { sitesApi } from '../../../api/apiservice';

function extractList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.sites)) return response.sites;
  if (Array.isArray(response.data?.sites)) return response.data.sites;
  if (Array.isArray(response.data?.data)) return response.data.data;
  return [];
}

const getStatusVariant = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('active') || s.includes('progress')) return 'success';
  if (s.includes('hold') || s.includes('pending')) return 'warning';
  if (s.includes('complete')) return 'info';
  if (s.includes('closed') || s.includes('cancel')) return 'error';
  return 'neutral';
};

export function SitesTable({ searchQuery = '', refreshKey = 0, onEdit, onView, filters }) {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    setLoading(true);
    sitesApi.list()
      .then((response) => setSites(extractList(response)))
      .catch(() => setSites([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = sites.filter((site) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (site.site_name || site.name || '').toLowerCase();
      const code = (site.site_code || site.code || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q)) return false;
    }
    if (filters?.status_id !== 'all' && String(site.site_status_id || site.status_id) !== String(filters.status_id)) return false;
    if (filters?.site_type_id !== 'all' && String(site.site_type_id) !== String(filters.site_type_id)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <DataTableContainer
      pagination={
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={perPage}
          onPageChange={setPage}
          onItemsPerPageChange={() => {}}
        />
      }
    >
      <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
        <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
          <tr>
            <th className="px-2 py-1.5 w-10 text-center">#</th>
            <th className="px-2 py-1.5 w-24">Site Code</th>
            <th className="px-2 py-1.5 w-48">Site Name</th>
            <th className="px-2 py-1.5 w-40">Project</th>
            <th className="px-2 py-1.5 w-32">Site Type</th>
            <th className="px-2 py-1.5 w-28 text-center">Status</th>
            <th className="px-2 py-1.5 w-36">Location</th>
            <th className="px-2 py-1.5 w-28">Start Date</th>
            <th className="px-2 py-1.5 text-center w-20">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr><td colSpan="9" className="text-center py-6 text-text-muted text-[12px]">Loading sites...</td></tr>
          ) : paged.length === 0 ? (
            <tr><td colSpan="9" className="text-center py-6 text-text-muted text-[12px]">No sites found.</td></tr>
          ) : (
            paged.map((site, index) => {
              const code = site.site_code || site.code || '—';
              const name = site.site_name || site.name || '—';
              const project = site.project_name || site.project || '—';
              const type = site.site_type || site.type_name || '—';
              const status = site.status_name || site.status || 'Draft';
              const location = site.location || site.address || '—';
              const startDate = site.start_date ? site.start_date.split(' ')[0] : '—';

              return (
                <tr key={site.id || index} className="hover:bg-surface-muted/30 transition-colors group">
                  <td className="px-2 py-1 text-center font-medium text-text-primary text-[11px]">{(page - 1) * perPage + index + 1}</td>
                  <td className="px-2 py-1 font-mono font-semibold text-text-primary text-[11px]">{code}</td>
                  <td className="px-2 py-1 font-medium text-text-primary truncate" title={name}>{name}</td>
                  <td className="px-2 py-1 text-text-secondary truncate" title={project}>{project}</td>
                  <td className="px-2 py-1 text-text-secondary truncate text-[11px]">{type}</td>
                  <td className="px-2 py-1 text-center">
                    <Badge
                      variant={getStatusVariant(status)}
                      className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                    >
                      {status}
                    </Badge>
                  </td>
                  <td className="px-2 py-1 text-text-secondary truncate text-[11px]" title={location}>{location}</td>
                  <td className="px-2 py-1 text-text-secondary truncate text-[11px]">{startDate}</td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="View" onClick={() => onView?.(site)}>
                        <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit" onClick={() => onEdit?.(site)}>
                        <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="More">
                        <MoreVertical className="w-3.5 h-3.5 text-text-secondary" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </DataTableContainer>
  );
}
