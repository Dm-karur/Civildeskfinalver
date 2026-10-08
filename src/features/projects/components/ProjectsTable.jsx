import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2, MoreVertical, PlayCircle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { projectsApi } from '../../../api/apiservice';

function extractProjectsList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.projects)) return response.projects;
  if (Array.isArray(response.data?.projects)) return response.data.projects;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data && typeof response.data === 'object' && (response.data.id || response.data.project_name || response.data.name)) {
    return [response.data];
  }
  if (response && typeof response === 'object' && (response.id || response.project_name || response.name)) {
    return [response];
  }
  return [];
}

export function ProjectsTable({ searchQuery = '', refreshKey = 0, onEdit, filters }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.list();
      const list = extractProjectsList(response);
      setProjects(list);
    } catch (error) {
      console.error('[ProjectsTable] Failed to load projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [refreshKey]);

  const confirmDelete = async () => {
    if (!deleteProject?.id) return;
    try {
      await projectsApi.remove(deleteProject.id);
      toast.success('Project deleted successfully.');
      setDeleteProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete project.');
    }
  };

  const getStatusType = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress') || s.includes('active') || s === '1' || s === '2') return 'success';
    if (s.includes('hold') || s.includes('pending') || s === '3') return 'warning';
    if (s.includes('complete')) return 'info';
    return 'neutral';
  };

  const filteredProjects = projects.filter(project => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (project.project_name || project.name || '').toLowerCase();
      const code = (project.project_code || project.code || '').toLowerCase();
      const client = (project.client_name || project.client || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !client.includes(q)) return false;
    }
    if (filters?.client_id !== 'all' && String(project.client_id) !== String(filters.client_id)) return false;
    if (filters?.project_status_id !== 'all' && String(project.project_status_id) !== String(filters.project_status_id)) return false;
    if (filters?.project_type_id !== 'all' && String(project.project_type_id) !== String(filters.project_type_id)) return false;
    if (filters?.financial_year_id !== 'all' && String(project.financial_year_id) !== String(filters.financial_year_id)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / perPage));
  const pagedProjects = filteredProjects.slice((page - 1) * perPage, page * perPage);

  const renderPagination = () => (
    <Pagination 
      currentPage={page}
      totalPages={totalPages}
      totalItems={filteredProjects.length}
      itemsPerPage={perPage}
      onPageChange={setPage}
      onItemsPerPageChange={() => {}}
    />
  );

  return (
    <>
      <DataTableContainer pagination={renderPagination()}>
        <table className="w-full text-left text-[13px] whitespace-nowrap table-auto">
          <thead className="bg-surface-muted text-text-secondary text-[12px] uppercase font-semibold border-b border-border tracking-wider">
            <tr>
              <th className="px-3 py-2.5 w-12 text-center">#</th>
              <th className="px-3 py-2.5">Project Code</th>
              <th className="px-3 py-2.5">Project Name</th>
              <th className="px-3 py-2.5">Client</th>
              <th className="px-3 py-2.5">Project Type</th>
              <th className="px-3 py-2.5 text-center">Status</th>
              <th className="px-3 py-2.5">Start Date</th>
              <th className="px-3 py-2.5">End Date</th>
              <th className="px-3 py-2.5 text-right">Budget (₹)</th>
              <th className="px-3 py-2.5 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-8 text-text-muted text-[13px]">
                  Loading projects from database...
                </td>
              </tr>
            ) : pagedProjects.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center py-8 text-text-muted text-[13px]">
                  No projects found in database.
                </td>
              </tr>
            ) : (
              pagedProjects.map((project, index) => {
                const code = project.project_code || project.code || '—';
                const name = project.project_name || project.name || '—';
                const clientName = project.client_name || project.client || '—';
                const clientsList = Array.isArray(project.clients) ? project.clients : (project.client_names ? project.client_names : []);
                const clientCount = clientsList.length > 0 ? clientsList.length : (project.client_count || 1);
                const clientDisplay = clientsList.length > 0 ? clientsList.map(c => c.name || c.client_name || c).join(', ') : clientName;
                const type = project.project_type_name || project.project_type || project.type || '—';
                const status = project.project_status_name || project.status_name || project.status || 'Active';
                const startDate = project.start_date || project.planned_start_date ? (project.start_date || project.planned_start_date).split(' ')[0] : '—';
                const endDate = project.end_date || project.expected_completion_date ? (project.end_date || project.expected_completion_date).split(' ')[0] : '—';
                const budget = project.contract_value || project.estimated_cost || project.budget;
                const formattedBudget = budget !== undefined && budget !== null ? Number(budget).toLocaleString('en-IN') : '0.00';

                return (
                  <tr key={project.id || index} className="hover:bg-surface-muted/30 transition-colors group">
                    <td className="px-3 py-2.5 text-center font-medium text-text-primary text-[12px]">
                      {(page - 1) * perPage + index + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-text-primary text-[12px]">{code}</td>
                    <td className="px-3 py-2.5 font-semibold text-text-primary truncate max-w-[220px]" title={name}>{name}</td>
                    <td className="px-3 py-2.5 text-text-secondary truncate max-w-[180px]" title={clientDisplay}>
                      <span>{clientDisplay}</span>
                      {clientCount > 1 && (
                        <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">+{clientCount - 1} clients</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary truncate text-[13px]">{type}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge 
                        variant={getStatusType(status)}
                        className="text-[10px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center gap-1 leading-none"
                      >
                        {status === 'In Progress' && <PlayCircle className="w-3 h-3" />}
                        {status === 'On Hold' && <AlertCircle className="w-3 h-3" />}
                        {status === 'Not Started' && <Clock className="w-3 h-3" />}
                        <span>{status}</span>
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary truncate font-mono text-[12px]">
                      {startDate}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary truncate font-mono text-[12px]">
                      {endDate}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-text-primary text-[13px]">
                      ₹{formattedBudget}
                    </td>
                    <td className="px-3 py-2.5 text-center relative">
                      <div className="relative inline-block text-left">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="View Project"
                            onClick={() => navigate(`/projects/overview?id=${project.id}`)}
                          >
                            <Eye className="w-4 h-4 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Edit Project"
                            onClick={() => onEdit?.(project)}
                          >
                            <Edit className="w-4 h-4 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="More Actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === project.id ? null : project.id);
                            }}
                          >
                            <MoreVertical className="w-4 h-4 text-text-secondary hover:text-primary" />
                          </Button>
                        </div>

                        {openMenuId === project.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)} 
                            />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-md shadow-lg py-1 z-20 text-left">
                              <button
                                className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-muted w-full text-left font-medium transition-colors"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/projects/overview?id=${project.id}`);
                                }}
                              >
                                <Eye className="w-3.5 h-3.5 text-primary" />
                                <span>View Project</span>
                              </button>
                              <button
                                className="flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-surface-muted w-full text-left font-medium transition-colors"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEdit?.(project);
                                }}
                              >
                                <Edit className="w-3.5 h-3.5 text-primary" />
                                <span>Edit Project</span>
                              </button>
                              <button
                                className="flex items-center gap-2 px-3 py-2 text-xs text-error hover:bg-error/10 w-full text-left font-medium transition-colors border-t border-border/50 mt-0.5 pt-2"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setDeleteProject(project);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-error" />
                                <span>Delete Project</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTableContainer>

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteProject)}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteProject?.project_name || deleteProject?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete Project"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteProject(null)}
      />
    </>
  );
}
