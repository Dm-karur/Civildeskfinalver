import { useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { boqApi, projectsApi } from '../../../api/apiservice';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { toast } from '../../../components/composite/Toast';

const EMPTY_FORM = {
  boq_code: '',
  boq_name: '',
  project_id: '',
  boq_date: '',
  notes: '',
};

const options = (items, labelKeys) => (items ?? []).map((item) => ({
  value: String(item.id),
  label: labelKeys.map((key) => item[key]).find(Boolean) ?? `#${item.id}`,
}));

export function BoqFormModal({ isOpen, boq = null, onClose, onSaveSuccess }) {
  const isEditing = Boolean(boq?.id);
  const [form, setForm] = useState(EMPTY_FORM);
  const [projects, setProjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(boq ? {
      ...EMPTY_FORM,
      ...boq,
      project_id: String(boq.project_id ?? ''),
      boq_date: boq.boq_date ? boq.boq_date.substring(0, 10) : '',
    } : EMPTY_FORM);
    setErrors({});
    setLoadingMasters(true);
    projectsApi.list()
      .then((res) => {
        const list = res?.data?.projects ?? res?.projects ?? (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        setProjects(Array.isArray(list) ? list : []);
      })
      .catch((err) => toast.error(err?.message || 'Unable to load projects.'))
      .finally(() => setLoadingMasters(false));
  }, [isOpen, boq]);

  const change = (name, value) => {
    setForm((c) => ({ ...c, [name]: value }));
    setErrors((c) => ({ ...c, [name]: null }));
  };

  const validate = () => {
    const next = {};
    if (!form.boq_code.trim()) next.boq_code = 'Required.';
    if (!form.boq_name.trim()) next.boq_name = 'Required.';
    if (!form.project_id) next.project_id = 'Required.';
    if (!form.boq_date) next.boq_date = 'Required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, project_id: Number(form.project_id), status_id: 1 };
      if (isEditing) await boqApi.update(boq.id, payload);
      else await boqApi.create(payload);
      toast.success(isEditing ? 'BOQ updated.' : 'BOQ created.');
      onSaveSuccess?.();
      onClose?.();
    } catch (error) {
      setErrors(error?.errors ?? {});
      toast.error(error?.message || 'Failed to save BOQ.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <EntityEditModal isOpen={isOpen} onClose={onClose}>
      <EntityEditModal.Header icon={FileSpreadsheet} title={isEditing ? 'Edit BOQ' : 'Create BOQ'} subtitle="Bill of Quantities for a project." onClose={onClose} />
      <form id="boq-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <EntityEditModal.Body>
          <EntityEditModal.Section title="BOQ Details">
            <EntityEditModal.Grid>
              <FormField label="BOQ Code" required error={errors.boq_code}><Input value={form.boq_code} onChange={(e) => change('boq_code', e.target.value)} placeholder="BOQ-001" /></FormField>
              <FormField label="BOQ Name" required error={errors.boq_name}><Input value={form.boq_name} onChange={(e) => change('boq_name', e.target.value)} /></FormField>
              <FormField label="Project" required error={errors.project_id}><Select value={form.project_id} onChange={(v) => change('project_id', v)} options={options(projects, ['project_name', 'name'])} placeholder="Select project" /></FormField>
              <FormField label="BOQ Date" required error={errors.boq_date}><Input type="date" value={form.boq_date} onChange={(e) => change('boq_date', e.target.value)} /></FormField>
            </EntityEditModal.Grid>
          </EntityEditModal.Section>
          <EntityEditModal.Section title="Notes" noBorder>
            <Textarea value={form.notes} onChange={(e) => change('notes', e.target.value)} rows={3} />
          </EntityEditModal.Section>
        </EntityEditModal.Body>
        <EntityEditModal.Footer formId="boq-form" submitLabel={isEditing ? 'Update BOQ' : 'Create BOQ'} onCancel={onClose} isSubmitting={saving || loadingMasters} />
      </form>
    </EntityEditModal>
  );
}
