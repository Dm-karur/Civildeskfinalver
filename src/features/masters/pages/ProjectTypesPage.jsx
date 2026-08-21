import { FolderCog } from 'lucide-react';
import { MasterCrudPage } from '../components/MasterCrudPage';
import { projectTypesApi } from '../../../api/apiservice';

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Masters' },
  { label: 'Project Types' },
];

const columns = [
  { key: 'name', label: 'Type Name', className: 'w-48', cellClass: 'text-text-primary font-medium' },
  { key: 'code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
  { key: 'description', label: 'Description', className: '', cellClass: 'text-text-secondary truncate' },
  {
    key: 'is_active',
    label: 'Status',
    className: 'w-20 text-center',
    render: (item) => (
      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${item.is_active ? 'bg-success/10 text-success' : 'bg-surface-muted text-text-secondary'}`}>
        {item.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

const formFields = [
  { name: 'name', label: 'Type Name', required: true, placeholder: 'e.g. Residential Building' },
  { name: 'code', label: 'Code', required: true, placeholder: 'e.g. RES' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

const emptyForm = { name: '', code: '', description: '' };

const extractList = (res) => {
  if (Array.isArray(res)) return res;
  return res?.data?.project_types ?? res?.project_types ?? res?.data?.data ?? [];
};

export function ProjectTypesPage() {
  return (
    <MasterCrudPage
      title="Project Types"
      icon={FolderCog}
      breadcrumbs={breadcrumbs}
      api={projectTypesApi}
      extractList={extractList}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
      formId="project-type-form"
      entityName="Project Type"
      permissionPrefix="project"
    />
  );
}
