import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Plus, RefreshCw, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { toast } from '../../../components/composite/Toast';
import { drawingTakeoffApi, projectsApi } from '../../../api/apiservice';
import { useNavigate } from 'react-router-dom';

export function DrawingTakeoffPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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

  const filteredJobs = jobs.filter(j => {
    const q = searchQuery.toLowerCase();
    const name = String(j.job_name || j.name || '').toLowerCase();
    const ref = String(j.drawing_ref || '').toLowerCase();
    return name.includes(q) || ref.includes(q);
  });

  const totalPages = Math.ceil(filteredJobs.length / perPage) || 1;
  const paginatedJobs = filteredJobs.slice((page - 1) * perPage, page * perPage);

  return (
    <PageContainer>
      <PageHeader
        title="Drawing Quantity Takeoff"
        subtitle="Extract, review, and map structural/architectural drawing quantities directly to BOQ line items"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setIsAddOpen(true)} className="gap-2 bg-[#0056C9] hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Takeoff Job
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title="Total Takeoff Jobs"
          value={jobs.length}
          icon={FileSpreadsheet}
          variant="primary"
        />
        <KpiCard
          title="Reviewed Jobs"
          value={jobs.filter(j => j.status === 'Approved' || j.status === 'Completed').length}
          icon={CheckCircle2}
          variant="success"
        />
        <KpiCard
          title="Pending Review"
          value={jobs.filter(j => j.status !== 'Approved' && j.status !== 'Completed').length}
          icon={FileSpreadsheet}
          variant="neutral"
        />
      </div>

      <DataTableContainer
        toolbar={
          <div className="w-72">
            <SearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search takeoff jobs..."
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Job Name</th>
                <th className="py-3 px-4">Drawing Ref</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading drawing takeoff jobs...
                  </td>
                </tr>
              ) : paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No drawing takeoff jobs found in database.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {job.job_name || job.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-amber-600 dark:text-amber-400">
                      {job.drawing_ref || 'DWG-001'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {job.project_name || 'General Project'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={job.status === 'Approved' ? 'success' : 'info'}>
                        {job.status || 'Draft'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/boq/takeoff/review?job_id=${job.id}`)}>
                          <Eye className="w-4 h-4 text-slate-600" /> Review
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/boq/takeoff/convert?job_id=${job.id}`)}>
                          <ArrowRight className="w-4 h-4 text-amber-500" /> Convert to BOQ
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalEntries={filteredJobs.length}
          perPage={perPage}
        />
      </DataTableContainer>

      {/* Add Modal */}
      {isAddOpen && (
        <EntityEditModal
          isOpen={true}
          onClose={() => setIsAddOpen(false)}
          onSave={handleSubmit}
          title="New Drawing Takeoff Job"
          saving={saving}
        >
          <div className="space-y-4">
            <FormField label="Job Name" required>
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
            <FormField label="Project">
              <select
                value={form.project_id}
                onChange={e => setForm(prev => ({ ...prev, project_id: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="">Select Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                ))}
              </select>
            </FormField>
          </div>
        </EntityEditModal>
      )}
    </PageContainer>
  );
}

export default DrawingTakeoffPage;
