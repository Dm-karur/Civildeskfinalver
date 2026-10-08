import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet, Plus, RefreshCw, Eye, CheckCircle2, ArrowRight,
  Building2, Clock, Search, Layers, FileText
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { drawingTakeoffApi, projectsApi } from '../../../api/apiservice';

export function DrawingTakeoffPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    job_name: '',
    project_id: '',
    drawing_ref: '',
    description: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resJobs, resProj] = await Promise.all([
        drawingTakeoffApi.jobs.list().catch(() => ({ data: [] })),
        projectsApi.list().catch(() => ({ data: [] }))
      ]);

      const jList = resJobs?.data?.jobs ?? resJobs?.data ?? (Array.isArray(resJobs) ? resJobs : []);
      setJobs(Array.isArray(jList) ? jList : []);

      const pList = resProj?.data?.projects ?? resProj?.projects ?? (Array.isArray(resProj?.data) ? resProj.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
    } catch (err) {
      console.error('Failed to load drawing takeoff jobs:', err);
      toast.error('Failed to load takeoff jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setForm({
      job_name: '',
      project_id: projects.length > 0 ? String(projects[0].id) : '',
      drawing_ref: '',
      description: ''
    });
    setIsAddOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.job_name.trim() || !form.drawing_ref.trim()) {
      toast.error('Job name and drawing reference are required.');
      return;
    }
    setSaving(true);
    try {
      await drawingTakeoffApi.jobs.create(form);
      toast.success('Drawing takeoff job created successfully.');
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create takeoff job:', err);
      toast.error(err.response?.data?.message || 'Failed to create takeoff job.');
    } finally {
      setSaving(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const q = search.toLowerCase();
      const name = String(j.job_name || j.name || '').toLowerCase();
      const ref = String(j.drawing_ref || '').toLowerCase();
      const pName = String(j.project_name || '').toLowerCase();
      const matchesSearch = name.includes(q) || ref.includes(q) || pName.includes(q);

      const matchesProject = selectedProjectId === 'all' || String(j.project_id) === String(selectedProjectId);
      const matchesStatus = selectedStatus === 'all' || String(j.status || 'Draft').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [jobs, search, selectedProjectId, selectedStatus]);

  const totalPages = Math.ceil(filteredJobs.length / perPage) || 1;
  const pagedJobs = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredJobs.slice(start, start + perPage);
  }, [filteredJobs, page, perPage]);

  // KPI Calculations
  const approvedCount = useMemo(() => jobs.filter(j => ['Approved', 'Completed'].includes(j.status)).length, [jobs]);
  const pendingCount = useMemo(() => jobs.filter(j => !['Approved', 'Completed'].includes(j.status)).length, [jobs]);
  const uniqueProjectsCount = useMemo(() => new Set(jobs.map(j => j.project_id).filter(Boolean)).size, [jobs]);

  return (
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title="Drawing Quantity Takeoff"
        subtitle="Extract, review, and map structural and architectural drawing quantities directly to BOQ line items"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'BOQ & Budget', href: '#' },
          { label: 'Drawing Takeoff' }
        ]}
      />

      {/* KPI Stats Bar - Standard Site Team Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Total Takeoff Jobs"
          value={jobs.length}
          status="info"
          icon={<FileSpreadsheet className="w-4 h-4 text-sky-500" />}
        />
        <KpiCard
          label="Approved & Mapped"
          value={approvedCount}
          status="success"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />
        <KpiCard
          label="Pending Review"
          value={pendingCount}
          status="warning"
          icon={<Clock className="w-4 h-4 text-amber-500" />}
        />
        <KpiCard
          label="Active Takeoff Projects"
          value={uniqueProjectsCount || projects.length}
          status="neutral"
          icon={<Building2 className="w-4 h-4 text-slate-500" />}
        />
      </div>

      {/* Clean Filter and Selector Bar - Matched with Site Team Assignment */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Project Selector */}
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'all', label: 'All Projects' },
                ...projects.map(p => ({ value: String(p.id), label: `${p.project_code || 'PRJ'} - ${p.project_name || p.name}` }))
              ]}
              value={selectedProjectId}
              onChange={(val) => {
                setSelectedProjectId(val);
                setPage(1);
              }}
              className="text-xs h-8"
            />
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-52">
            <SearchField
              placeholder="Search job name, drawing ref, project..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'under review', label: 'Under Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val);
                setPage(1);
              }}
              className="text-xs h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenAdd}
            className="text-xs h-8 shadow-xs"
          >
            New Takeoff Job
          </Button>
        </div>
      </div>

      {/* Desktop & Tablet Table (Hidden on small screens) */}
      <div className="hidden sm:block">
        <DataTableContainer
          pagination={
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredJobs.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          }
        >
          <table className="w-full text-left text-[12px] table-auto">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2">Job Name</th>
                <th className="px-3 py-2">Drawing Reference</th>
                <th className="px-3 py-2">Assigned Project</th>
                <th className="px-3 py-2 text-center w-28">Status</th>
                <th className="px-3 py-2 text-right w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-muted text-[12px]">
                    Loading drawing takeoff jobs...
                  </td>
                </tr>
              ) : pagedJobs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-muted text-[12px]">
                    No drawing takeoff jobs found matching filters.
                  </td>
                </tr>
              ) : (
                pagedJobs.map((job, idx) => (
                  <tr key={job.id || idx} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-3 py-2 text-center text-text-muted text-[11px]">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-text-primary text-[12px]">
                        {job.job_name || job.name}
                      </div>
                      {job.description && (
                        <div className="text-[10px] text-text-muted truncate max-w-xs">{job.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] font-semibold text-primary">
                      {job.drawing_ref || 'DWG-REF-001'}
                    </td>
                    <td className="px-3 py-2 text-text-secondary">
                      {job.project_name || 'General Project'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge
                        variant={
                          ['approved', 'completed'].includes(String(job.status).toLowerCase())
                            ? 'success'
                            : ['under review', 'in progress'].includes(String(job.status).toLowerCase())
                            ? 'warning'
                            : 'info'
                        }
                        className="text-[8px] px-1.5 py-0.5"
                      >
                        {job.status || 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 gap-1"
                          onClick={() => navigate(`/takeoff/review?job_id=${job.id}`)}
                        >
                          <Eye className="w-3 h-3 text-text-secondary" /> Review
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-7 text-[11px] px-2 gap-1"
                          onClick={() => navigate(`/takeoff/convert?job_id=${job.id}`)}
                        >
                          <ArrowRight className="w-3 h-3" /> Convert to BOQ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      {/* Mobile Card Layout (Visible only on small screens) */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">
            Loading drawing takeoff jobs...
          </div>
        ) : pagedJobs.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">
            No drawing takeoff jobs found.
          </div>
        ) : (
          pagedJobs.map((job) => (
            <div key={job.id} className="bg-surface border border-border rounded-lg p-3 space-y-2.5 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-text-primary text-xs">{job.job_name || job.name}</h4>
                  <span className="font-mono text-[10px] text-primary font-bold">{job.drawing_ref || 'DWG-REF-001'}</span>
                </div>
                <Badge
                  variant={
                    ['approved', 'completed'].includes(String(job.status).toLowerCase())
                      ? 'success'
                      : ['under review', 'in progress'].includes(String(job.status).toLowerCase())
                      ? 'warning'
                      : 'info'
                  }
                  className="text-[8px] px-1.5 py-0.5"
                >
                  {job.status || 'Draft'}
                </Badge>
              </div>

              <div className="text-xs pt-1 border-t border-border/60">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Project</span>
                <span className="font-medium text-text-primary text-[11px] truncate block">{job.project_name || 'General Project'}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => navigate(`/takeoff/review?job_id=${job.id}`)}>
                  <Eye className="w-3 h-3 mr-1" /> Review
                </Button>
                <Button variant="primary" size="sm" className="h-7 text-[11px] px-2" onClick={() => navigate(`/takeoff/convert?job_id=${job.id}`)}>
                  <ArrowRight className="w-3 h-3 mr-1" /> Convert
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal - Exact SiteTeamPage Form Structure */}
      {isAddOpen && (
        <EntityEditModal
          isOpen={true}
          onClose={() => setIsAddOpen(false)}
        >
          <EntityEditModal.Header
            icon={FileSpreadsheet}
            title="New Drawing Takeoff Job"
            subtitle="Configure job parameters to extract quantities from architectural/structural drawings."
            onClose={() => setIsAddOpen(false)}
          />
          <form id="takeoff-job-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EntityEditModal.Body>
              <EntityEditModal.Section title="Job Identification & Drawing Mapping">
                <EntityEditModal.Grid>
                  <FormField label="Takeoff Job Name" required>
                    <Input
                      value={form.job_name}
                      onChange={e => setForm(prev => ({ ...prev, job_name: e.target.value }))}
                      placeholder="e.g. Ground Floor Slab Beam Takeoff"
                    />
                  </FormField>

                  <FormField label="Drawing Reference / Ref No" required>
                    <Input
                      value={form.drawing_ref}
                      onChange={e => setForm(prev => ({ ...prev, drawing_ref: e.target.value }))}
                      placeholder="e.g. DWG-STR-S01"
                    />
                  </FormField>

                  <FormField label="Assigned Project" className="md:col-span-2">
                    <Select
                      options={[
                        { value: '', label: 'Select Project' },
                        ...projects.map(p => ({ value: String(p.id), label: `${p.project_code || 'PRJ'} - ${p.project_name || p.name}` }))
                      ]}
                      value={form.project_id}
                      onChange={(val) => setForm(prev => ({ ...prev, project_id: val }))}
                    />
                  </FormField>

                  <FormField label="Job Scope & Technical Description" className="md:col-span-2">
                    <Textarea
                      rows={3}
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Notes on drawing revision, scope of structural measurements, or special takeoff conditions..."
                    />
                  </FormField>
                </EntityEditModal.Grid>
              </EntityEditModal.Section>
            </EntityEditModal.Body>

            <EntityEditModal.Footer
              formId="takeoff-job-form"
              submitLabel="Create Takeoff Job"
              onCancel={() => setIsAddOpen(false)}
              isSubmitting={saving}
            />
          </form>
        </EntityEditModal>
      )}
    </PageContainer>
  );
}

export default DrawingTakeoffPage;
