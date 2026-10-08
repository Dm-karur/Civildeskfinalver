import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, Building2, Calendar, IndianRupee, FileText, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { toast } from '../../../components/composite/Toast';
import { projectsApi, clientsApi, branchesApi, mastersApi } from '../../../api/apiservice';

export const generateProjectCode = (existingProjects = []) => {
  const currentYear = new Date().getFullYear();
  const prefix = `PRJ-${currentYear}-`;

  let maxSeq = 0;
  if (Array.isArray(existingProjects)) {
    existingProjects.forEach((p) => {
      const code = (p.project_code || p.code || '').trim();
      const regex = new RegExp(`^PRJ-${currentYear}-(\\d+)$`, 'i');
      const match = code.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
};

const EMPTY_FORM = {
  project_code: generateProjectCode([]),
  project_name: '',
  client_id: '',
  project_type_id: '',
  project_status_id: '',
  billing_method_id: '',
  priority_id: '',
  branch_id: '',
  financial_year_id: '',
  planned_start_date: '',
  expected_completion_date: '',
  contract_value: '',
  approved_budget: '',
  retention_percentage: '0',
  tax_percentage: '18',
  currency_code: 'INR',
  description: '',
  notes: '',
};

const toOpts = (arr = [], labelKey = 'name') =>
  (arr || []).map((item) => ({
    value: String(item.id),
    label: item[labelKey] || item.status_name || item.type_name || item.client_name || item.name || `#${item.id}`,
  }));

export function ProjectCreatePage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const projectId = params.id || searchParams.get('id');
  const isEditing = Boolean(projectId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [initialStatusId, setInitialStatusId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [masters, setMasters] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      projectsApi.list().catch(() => ({ data: [] })),
      clientsApi.list().catch(() => ({ data: [] })),
      branchesApi.list().catch(() => ({ data: [] })),
      mastersApi.all().catch(() => ({ data: {} })),
      isEditing && projectId ? projectsApi.get(projectId).catch(() => null) : Promise.resolve(null),
    ]).then(([pRes, cRes, bRes, mRes, singlePRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : (Array.isArray(pRes) ? pRes : []));
      setClients(cRes?.data?.clients ?? cRes?.data ?? []);
      setBranches(bRes?.data?.branches ?? bRes?.data ?? []);
      setMasters(mRes?.data ?? {});

      const editProjectData = singlePRes?.data?.project ?? singlePRes?.project ?? pList.find(x => String(x.id) === String(projectId));

      if (isEditing && editProjectData) {
        setInitialStatusId(editProjectData.project_status_id);
        setForm({
          project_code: editProjectData.project_code || editProjectData.code || '',
          project_name: editProjectData.project_name || editProjectData.name || '',
          client_id: String(editProjectData.client_id ?? ''),
          project_type_id: String(editProjectData.project_type_id ?? ''),
          project_status_id: String(editProjectData.project_status_id ?? ''),
          billing_method_id: String(editProjectData.billing_method_id ?? ''),
          priority_id: String(editProjectData.priority_id ?? ''),
          branch_id: String(editProjectData.branch_id ?? ''),
          financial_year_id: String(editProjectData.financial_year_id ?? ''),
          planned_start_date: editProjectData.planned_start_date || editProjectData.start_date ? String(editProjectData.planned_start_date || editProjectData.start_date).split(' ')[0] : '',
          expected_completion_date: editProjectData.expected_completion_date || editProjectData.end_date ? String(editProjectData.expected_completion_date || editProjectData.end_date).split(' ')[0] : '',
          contract_value: editProjectData.contract_value ?? editProjectData.estimated_cost ?? editProjectData.budget ?? '',
          approved_budget: editProjectData.approved_budget ?? editProjectData.budget ?? '',
          retention_percentage: editProjectData.retention_percentage ?? '0',
          tax_percentage: editProjectData.tax_percentage ?? '18',
          currency_code: editProjectData.currency_code || 'INR',
          description: editProjectData.description || '',
          notes: editProjectData.notes || '',
        });
      } else {
        setInitialStatusId(null);
        const autoCode = generateProjectCode(pList);
        setForm({
          ...EMPTY_FORM,
          project_code: autoCode,
        });
        setErrors({});
      }
    }).finally(() => setLoading(false));
  }, [projectId, isEditing]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.project_name.trim()) newErrors.project_name = 'Project name is required';
    if (!form.client_id) newErrors.client_id = 'Client is required';
    if (!form.project_type_id) newErrors.project_type_id = 'Project type is required';
    if (!form.project_status_id) newErrors.project_status_id = 'Status is required';
    if (form.expected_completion_date && form.planned_start_date && form.expected_completion_date < form.planned_start_date) {
      newErrors.expected_completion_date = 'Completion date cannot be before the start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const nullableNumber = (value) => value === '' || value === null || value === undefined ? null : Number(value);
      const payload = {
        ...form,
        client_id: Number(form.client_id),
        project_type_id: Number(form.project_type_id),
        project_status_id: Number(form.project_status_id),
        billing_method_id: nullableNumber(form.billing_method_id),
        priority_id: nullableNumber(form.priority_id),
        branch_id: nullableNumber(form.branch_id),
        financial_year_id: nullableNumber(form.financial_year_id),
        contract_value: form.contract_value ? Number(form.contract_value) : 0,
        approved_budget: form.approved_budget ? Number(form.approved_budget) : 0,
        retention_percentage: form.retention_percentage ? Number(form.retention_percentage) : 0,
        tax_percentage: form.tax_percentage ? Number(form.tax_percentage) : 0,
      };

      if (isEditing) {
        await projectsApi.update(projectId, payload);
        if (initialStatusId && String(initialStatusId) !== String(form.project_status_id)) {
          await projectsApi.changeStatus(projectId, {
            project_status_id: Number(form.project_status_id),
            change_reason: 'Status changed during project details edit.'
          }).catch(() => {});
        }
        toast.success('Project updated successfully!');
      } else {
        await projectsApi.create(payload);
        toast.success('Project created successfully!');
      }
      navigate('/projects');
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || (isEditing ? 'Failed to update project' : 'Failed to create project'));
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Projects', href: '/projects' },
    { label: isEditing ? 'Edit Project' : 'Add New Project' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={isEditing ? `Edit Project${form.project_name ? ` — ${form.project_name}` : ''}` : 'Add New Project'}
        breadcrumbs={breadcrumbs}
      />

      <form onSubmit={handleSubmit} className="w-full space-y-6 pb-12">
        {/* Section 1: Basic Information */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-border text-text-primary font-semibold text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Basic Project Details</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => navigate('/projects')}
            >
              Back to Project Register
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Project Name" required className="md:col-span-3" error={errors.project_name}>
              <Input
                value={form.project_name}
                onChange={(e) => handleChange('project_name', e.target.value)}
                placeholder="e.g. Metro Commercial Tower Block A"
              />
            </FormField>

            <FormField label="Primary Client" required error={errors.client_id}>
              <Select
                options={[{ value: '', label: 'Select Client' }, ...toOpts(clients, 'client_name')]}
                value={form.client_id}
                onChange={(v) => handleChange('client_id', v)}
              />
            </FormField>

            <FormField label="Project Type" required error={errors.project_type_id}>
              <Select
                options={[{ value: '', label: 'Select Type' }, ...toOpts(masters.project_types, 'type_name')]}
                value={form.project_type_id}
                onChange={(v) => handleChange('project_type_id', v)}
              />
            </FormField>

            <FormField label="Project Status" required error={errors.project_status_id}>
              <Select
                options={[{ value: '', label: 'Select Status' }, ...toOpts(masters.project_statuses, 'status_name')]}
                value={form.project_status_id}
                onChange={(v) => handleChange('project_status_id', v)}
              />
            </FormField>

            <FormField label="Branch" error={errors.branch_id}>
              <Select
                options={[{ value: '', label: 'Select Branch' }, ...toOpts(branches, 'branch_name')]}
                value={form.branch_id}
                onChange={(v) => handleChange('branch_id', v)}
              />
            </FormField>

            <FormField label="Financial Year" error={errors.financial_year_id}>
              <Select
                options={[{ value: '', label: 'Select FY' }, ...toOpts(masters.financial_years, 'fy_name')]}
                value={form.financial_year_id}
                onChange={(v) => handleChange('financial_year_id', v)}
              />
            </FormField>

            <FormField label="Priority" error={errors.priority_id}>
              <Select
                options={[{ value: '', label: 'Select Priority' }, ...toOpts(masters.priorities, 'priority_name')]}
                value={form.priority_id}
                onChange={(v) => handleChange('priority_id', v)}
              />
            </FormField>
          </div>
        </Card>

        {/* Section 2: Timeline & Schedule */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border text-text-primary font-semibold text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Timeline & Schedule</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Planned Start Date" error={errors.planned_start_date}>
              <Input
                type="date"
                value={form.planned_start_date}
                onChange={(e) => handleChange('planned_start_date', e.target.value)}
              />
            </FormField>

            <FormField label="Expected Completion Date" error={errors.expected_completion_date}>
              <Input
                type="date"
                value={form.expected_completion_date}
                onChange={(e) => handleChange('expected_completion_date', e.target.value)}
              />
            </FormField>
          </div>
        </Card>

        {/* Section 3: Financials & Commercials */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border text-text-primary font-semibold text-sm">
            <IndianRupee className="w-4 h-4 text-primary" />
            <span>Commercial & Financial Terms</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Contract Value (₹)" error={errors.contract_value}>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.contract_value}
                onChange={(e) => handleChange('contract_value', e.target.value)}
              />
            </FormField>

            <FormField label="Approved Budget (₹)" error={errors.approved_budget}>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.approved_budget}
                onChange={(e) => handleChange('approved_budget', e.target.value)}
              />
            </FormField>

            <FormField label="Billing Method" error={errors.billing_method_id}>
              <Select
                options={[{ value: '', label: 'Select Method' }, ...toOpts(masters.billing_methods, 'name')]}
                value={form.billing_method_id}
                onChange={(v) => handleChange('billing_method_id', v)}
              />
            </FormField>

            <FormField label="Retention Percentage (%)" error={errors.retention_percentage}>
              <Input
                type="number"
                step="0.01"
                placeholder="5"
                value={form.retention_percentage}
                onChange={(e) => handleChange('retention_percentage', e.target.value)}
              />
            </FormField>

            <FormField label="Tax / GST Rate (%)" error={errors.tax_percentage}>
              <Input
                type="number"
                step="0.01"
                placeholder="18"
                value={form.tax_percentage}
                onChange={(e) => handleChange('tax_percentage', e.target.value)}
              />
            </FormField>

            <FormField label="Currency Code" error={errors.currency_code}>
              <Input
                value={form.currency_code}
                onChange={(e) => handleChange('currency_code', e.target.value)}
                placeholder="INR"
              />
            </FormField>
          </div>
        </Card>

        {/* Section 4: Description & Notes */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border text-text-primary font-semibold text-sm">
            <FileText className="w-4 h-4 text-primary" />
            <span>Scope Description & Notes</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Scope of Work / Description" error={errors.description}>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe project deliverables, site location context, and scope..."
              />
            </FormField>

            <FormField label="Internal Notes & Remarks" error={errors.notes}>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any special handling instructions, client agreements, or conditions..."
              />
            </FormField>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/projects')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={saving || loading}
          >
            {isEditing ? 'Update Project' : 'Save Project'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
