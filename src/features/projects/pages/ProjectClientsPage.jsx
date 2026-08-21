import { useState, useEffect, useMemo } from 'react';
import { Building2, IndianRupee, FileText, CheckCircle2, Search, Filter, Eye, Edit, Layers, Briefcase } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { projectsApi, clientsApi } from '../../../api/apiservice';
import { ProjectFormModal } from '../components/ProjectFormModal';

export function ProjectClientsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      clientsApi.list().catch(() => ({ data: { clients: [] } })),
    ]).then(([pRes, cRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const cList = cRes?.data?.clients ?? cRes?.clients ?? (Array.isArray(cRes?.data) ? cRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      setClients(Array.isArray(cList) ? cList : []);
    }).finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        const code = (p.project_code || '').toLowerCase();
        const name = (p.project_name || '').toLowerCase();
        const client = (p.client_name || p.client_code || '').toLowerCase();
        const wo = (p.work_order_no || p.client_reference_no || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !client.includes(q) && !wo.includes(q)) return false;
      }
      if (clientFilter !== 'all' && String(p.client_id) !== String(clientFilter)) return false;
      if (statusFilter !== 'all' && String(p.project_status_id) !== String(statusFilter)) return false;
      return true;
    });
  }, [projects, search, clientFilter, statusFilter]);

  const totalContractVal = useMemo(() => {
    return projects.reduce((acc, p) => acc + Number(p.contract_value || 0), 0);
  }, [projects]);

  const uniqueClientsCount = useMemo(() => {
    return new Set(projects.map(p => p.client_id).filter(Boolean)).size;
  }, [projects]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const getStatusVariant = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress') || s.includes('active') || s === '1' || s === '2') return 'success';
    if (s.includes('hold') || s.includes('pending') || s === '3') return 'warning';
    if (s.includes('complete')) return 'info';
    return 'neutral';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: 'Project Clients' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Project Clients"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-4">
        {/* KPI Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Linked Client Projects"
            value={projects.length}
            status="primary"
            icon={<Briefcase className="w-4 h-4" />}
          />
          <KpiCard
            label="Distinct Client Entities"
            value={uniqueClientsCount}
            status="info"
            icon={<Building2 className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Total Contract Value"
            value={`₹${totalContractVal.toLocaleString('en-IN')}`}
            status="success"
            icon={<IndianRupee className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Average Value / Project"
            value={projects.length ? `₹${Math.round(totalContractVal / projects.length).toLocaleString('en-IN')}` : '₹0'}
            status="neutral"
            icon={<Layers className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface border border-border rounded-lg p-3 shadow-xs">
          <div className="flex-1 sm:max-w-xs">
            <SearchField
              placeholder="Search by project, client, or WO#..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              options={[{ value: 'all', label: 'All Clients' }, ...clients.map(c => ({ value: String(c.id), label: c.client_name || c.name }))]}
              value={clientFilter}
              onChange={setClientFilter}
              className="w-44 text-xs h-8"
            />

            {(search || clientFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-text-secondary"
                onClick={() => { setSearch(''); setClientFilter('all'); setStatusFilter('all'); }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Project Client Details Table */}
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
                <th className="px-2 py-1.5 w-28">Project Code</th>
                <th className="px-2 py-1.5 w-44">Project Name</th>
                <th className="px-2 py-1.5 w-40">Client Details</th>
                <th className="px-2 py-1.5 w-28">Work Order / Ref</th>
                <th className="px-2 py-1.5 w-28">Billing Method</th>
                <th className="px-2 py-1.5 w-20 text-center">Retention %</th>
                <th className="px-2 py-1.5 w-20 text-center">Tax / GST %</th>
                <th className="px-2 py-1.5 text-right w-28">Contract Value</th>
                <th className="px-2 py-1.5 text-right w-28">Approved Budget</th>
                <th className="px-2 py-1.5 text-center w-24">Status</th>
                <th className="px-2 py-1.5 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-8 text-text-muted text-[12px]">
                    Loading project client details from database...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-8 text-text-muted text-[12px]">
                    No project client records found matching your filters.
                  </td>
                </tr>
              ) : (
                paged.map((project, index) => {
                  const clientCode = project.client_code || '';
                  const clientName = project.client_name || project.client || '—';
                  const woNo = project.work_order_no || project.client_reference_no || '—';
                  const billingMethod = project.billing_method_name || 'Progressive Milestone';
                  const status = project.project_status_name || project.status_name || 'Active';
                  const contractVal = Number(project.contract_value || 0);
                  const budgetVal = Number(project.approved_budget || 0);

                  return (
                    <tr key={project.id || index} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-2 py-1.5 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + index + 1}
                      </td>
                      <td className="px-2 py-1.5 font-mono font-semibold text-text-primary text-[11px]">
                        {project.project_code}
                      </td>
                      <td className="px-2 py-1.5 font-medium text-text-primary truncate" title={project.project_name}>
                        {project.project_name}
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[11px] truncate" title={clientName}>
                            {clientName}
                          </span>
                          {clientCode && (
                            <span className="text-[10px] font-mono text-text-secondary">
                              {clientCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-text-secondary font-mono text-[11px] truncate" title={woNo}>
                        {woNo}
                      </td>
                      <td className="px-2 py-1.5 text-text-secondary text-[11px] truncate">
                        {billingMethod}
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono text-[11px]">
                        {project.retention_percentage != null ? `${project.retention_percentage}%` : '0%'}
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono text-[11px]">
                        {project.tax_percentage != null ? `${project.tax_percentage}%` : '18%'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-bold text-text-primary text-[11px]">
                        ₹{contractVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-emerald-600 text-[11px]">
                        ₹{budgetVal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <Badge
                          variant={getStatusVariant(status)}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Client Commercial Breakdown"
                            onClick={() => setSelectedProject(project)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Project Commercials"
                            onClick={() => setEditingProject(project)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
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
      </div>

      {/* Project Client Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {selectedProject.project_name}
                  </h3>
                  <p className="text-xs text-text-secondary font-mono">
                    {selectedProject.project_code} • Client: {selectedProject.client_name}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-surface-muted/40 p-3 rounded-lg border border-border">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Contract Value</span>
                  <span className="text-sm font-bold font-mono text-text-primary">
                    ₹{Number(selectedProject.contract_value || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-surface-muted/40 p-3 rounded-lg border border-border">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Approved Budget</span>
                  <span className="text-sm font-bold font-mono text-emerald-600">
                    ₹{Number(selectedProject.approved_budget || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-surface-muted/40 p-3 rounded-lg border border-border">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Estimated Margin</span>
                  <span className="text-sm font-bold font-mono text-primary">
                    {selectedProject.contract_value > 0
                      ? `${(((selectedProject.contract_value - (selectedProject.approved_budget || 0)) / selectedProject.contract_value) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-2 text-xs">
                <h4 className="font-bold text-text-primary text-[13px] border-b border-border pb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" /> Commercial & Billing Terms
                </h4>
                <div className="grid grid-cols-2 gap-y-2 pt-1 text-[12px]">
                  <div><span className="text-text-muted">Client Code:</span> <span className="font-mono font-semibold">{selectedProject.client_code || '—'}</span></div>
                  <div><span className="text-text-muted">Work Order No:</span> <span className="font-mono font-semibold">{selectedProject.work_order_no || '—'}</span></div>
                  <div><span className="text-text-muted">Client Ref No:</span> <span className="font-mono">{selectedProject.client_reference_no || '—'}</span></div>
                  <div><span className="text-text-muted">Billing Method:</span> <span>{selectedProject.billing_method_name || 'Progressive Milestone'}</span></div>
                  <div><span className="text-text-muted">Retention %:</span> <span className="font-mono">{selectedProject.retention_percentage || 0}%</span></div>
                  <div><span className="text-text-muted">Tax / GST %:</span> <span className="font-mono">{selectedProject.tax_percentage || 18}%</span></div>
                  <div><span className="text-text-muted">Currency:</span> <span className="font-mono">{selectedProject.currency_code || 'INR'}</span></div>
                  <div><span className="text-text-muted">Branch:</span> <span>{selectedProject.branch_name || 'Headquarters'}</span></div>
                </div>
              </div>

              {selectedProject.description && (
                <div className="border border-border rounded-lg p-3 text-xs bg-surface-muted/20">
                  <span className="font-bold text-text-primary block mb-1">Scope / Deliverables:</span>
                  <p className="text-text-secondary whitespace-pre-wrap">{selectedProject.description}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedProject(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectFormModal
          isOpen={Boolean(editingProject)}
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaveSuccess={() => {
            setEditingProject(null);
            setRefreshKey(k => k + 1);
          }}
        />
      )}
    </PageContainer>
  );
}
