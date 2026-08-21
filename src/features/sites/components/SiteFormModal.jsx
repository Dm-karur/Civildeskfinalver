import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { sitesApi, projectsApi, branchesApi, mastersApi } from '../../../api/apiservice';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { toast } from '../../../components/composite/Toast';

const EMPTY_FORM = {
  site_code: '',
  site_name: '',
  project_id: '',
  site_type_id: '',
  site_status_id: '',
  branch_id: '',
  location: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  latitude: '',
  longitude: '',
  start_date: '',
  expected_completion_date: '',
  description: '',
};

const options = (items, labelKeys) => (items ?? []).map((item) => ({
  value: String(item.id),
  label: labelKeys.map((key) => item[key]).find(Boolean) ?? `#${item.id}`,
}));

export function SiteFormModal({ isOpen, site = null, onClose, onSaveSuccess }) {
  const isEditing = Boolean(site?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [projects, setProjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [masters, setMasters] = useState({});
  const [errors, setErrors] = useState({});
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(site ? {
      ...EMPTY_FORM,
      ...site,
      project_id: String(site.project_id ?? ''),
      site_type_id: String(site.site_type_id ?? ''),
      site_status_id: String(site.site_status_id ?? ''),
      branch_id: String(site.branch_id ?? ''),
      start_date: site.start_date ? site.start_date.split(' ')[0] : '',
      expected_completion_date: site.expected_completion_date ? site.expected_completion_date.split(' ')[0] : '',
    } : EMPTY_FORM);
    setErrors({});
    setLoadingMasters(true);
    Promise.all([mastersApi.all(), projectsApi.list(), branchesApi.list()])
      .then(([masterRes, projRes, branchRes]) => {
        setMasters(masterRes?.data ?? masterRes ?? {});
        const projList = projRes?.data?.projects ?? projRes?.projects ?? [];
        setProjects(Array.isArray(projList) ? projList : []);
        const branchList = branchRes?.data?.branches ?? branchRes?.branches ?? [];
        setBranches(Array.isArray(branchList) ? branchList : []);
      })
      .catch((error) => toast.error(error?.message || 'Unable to load master data.'))
      .finally(() => setLoadingMasters(false));
  }, [isOpen, site]);

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: null }));
  };

  const validate = () => {
    const next = {};
    for (const field of ['site_code', 'site_name', 'project_id']) {
      if (!String(form[field] ?? '').trim()) next[field] = 'This field is required.';
    }
    if (form.expected_completion_date && form.start_date && form.expected_completion_date < form.start_date) {
      next.expected_completion_date = 'Completion date cannot be before start date.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const nullableNumber = (value) => value === '' ? null : Number(value);
      const payload = {
        site_code: form.site_code,
        site_name: form.site_name,
        project_id: Number(form.project_id),
        site_type_id: nullableNumber(form.site_type_id),
        site_status_id: nullableNumber(form.site_status_id),
        branch_id: nullableNumber(form.branch_id),
        location: form.location,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        latitude: form.latitude !== '' && form.latitude != null ? Number(form.latitude) : null,
        longitude: form.longitude !== '' && form.longitude != null ? Number(form.longitude) : null,
        start_date: form.start_date || null,
        expected_completion_date: form.expected_completion_date || null,
        description: form.description,
      };
      if (isEditing) await sitesApi.update(site.id, payload);
      else await sitesApi.create(payload);
      toast.success(isEditing ? 'Site updated successfully.' : 'Site created successfully.');
      onSaveSuccess?.();
      onClose?.();
    } catch (error) {
      setErrors(error?.errors ?? {});
      toast.error(error?.message || 'Unable to save site.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header icon={MapPin} title={isEditing ? 'Edit Site' : 'Add Site'} subtitle="Configure project site details." onClose={onClose} />
      <form id="site-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="Site identity">
            <EntityEditModal.Grid>
              <FormField label="Site Code" required error={errors.site_code}><Input value={form.site_code} onChange={(e) => change('site_code', e.target.value)} placeholder="SITE-001" /></FormField>
              <FormField label="Site Name" required error={errors.site_name}><Input value={form.site_name} onChange={(e) => change('site_name', e.target.value)} /></FormField>
              <FormField label="Project" required error={errors.project_id}><Select value={form.project_id} onChange={(value) => change('project_id', value)} options={options(projects, ['project_name', 'name'])} placeholder="Select project" /></FormField>
              <FormField label="Branch" error={errors.branch_id}><Select value={form.branch_id} onChange={(value) => change('branch_id', value)} options={options(branches, ['branch_name', 'name'])} placeholder="Select branch" /></FormField>
              <FormField label="Site Type" error={errors.site_type_id}><Select value={form.site_type_id} onChange={(value) => change('site_type_id', value)} options={options(masters.site_types, ['name', 'type_name'])} placeholder="Select type" /></FormField>
              <FormField label="Status" error={errors.site_status_id}><Select value={form.site_status_id} onChange={(value) => change('site_status_id', value)} options={options(masters.site_statuses, ['name', 'status_name'])} placeholder="Select status" /></FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
          <EntityEditModal.Section title="Location">
            <EntityEditModal.Grid>
              <FormField label="Address" error={errors.address}><Input value={form.address} onChange={(e) => change('address', e.target.value)} /></FormField>
              <FormField label="City" error={errors.city}><Input value={form.city} onChange={(e) => change('city', e.target.value)} /></FormField>
              <FormField label="State" error={errors.state}><Input value={form.state} onChange={(e) => change('state', e.target.value)} /></FormField>
              <FormField label="Pincode" error={errors.pincode}><Input value={form.pincode} onChange={(e) => change('pincode', e.target.value)} /></FormField>
              <FormField label="Latitude" error={errors.latitude}><Input type="number" step="any" value={form.latitude} onChange={(e) => change('latitude', e.target.value)} /></FormField>
              <FormField label="Longitude" error={errors.longitude}><Input type="number" step="any" value={form.longitude} onChange={(e) => change('longitude', e.target.value)} /></FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
          <EntityEditModal.Section title="Schedule">
            <EntityEditModal.Grid>
              <FormField label="Start Date" error={errors.start_date}><Input type="date" value={form.start_date} onChange={(e) => change('start_date', e.target.value)} /></FormField>
              <FormField label="Expected Completion" error={errors.expected_completion_date}><Input type="date" value={form.expected_completion_date} onChange={(e) => change('expected_completion_date', e.target.value)} /></FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
          <EntityEditModal.Section title="Description" noBorder>
            <FormField error={errors.description}>
              <Textarea value={form.description} onChange={(e) => change('description', e.target.value)} rows={3} />
            </FormField>
          </EntityEditModal.Section>
        </EntityEditModal.Body>
        <EntityEditModal.Footer formId="site-form" submitLabel={isEditing ? 'Update Site' : 'Create Site'} onCancel={onClose} isSubmitting={saving || loadingMasters} />
      </form>
    </EntityEditModal>
  );
}
