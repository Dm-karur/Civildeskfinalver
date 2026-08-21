import { Layers } from 'lucide-react';
import { MasterCrudPage } from '../components/MasterCrudPage';
import { workCategoriesApi } from '../../../api/apiservice';

const breadcrumbs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Masters' },
  { label: 'Work Categories' },
];

const columns = [
  { key: 'category_name', label: 'Category Name', className: 'w-48', cellClass: 'text-text-primary font-medium', render: (item) => item.category_name || item.name || '—' },
  { key: 'category_code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary', render: (item) => item.category_code || item.code || '—' },
  { key: 'work_stage', label: 'Work Stage', className: 'w-28', cellClass: 'text-text-secondary', render: (item) => item.work_stage || item.stage_name || '—' },
  { key: 'progress_method', label: 'Progress Method', className: 'w-32', cellClass: 'text-text-secondary', render: (item) => item.progress_method || item.method_name || '—' },
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
  { name: 'category_name', label: 'Category Name', required: true, placeholder: 'e.g. RCC Work' },
  { name: 'category_code', label: 'Category Code', required: true, placeholder: 'e.g. RCC' },
  { name: 'sort_order', label: 'Sort Order', type: 'number', min: '0', step: '1', placeholder: '0' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true },
];

const emptyForm = { category_name: '', category_code: '', sort_order: '0', description: '' };

const extractList = (res) => {
  if (Array.isArray(res)) return res;
  return res?.data?.work_categories ?? res?.work_categories ?? res?.data?.data ?? [];
};

export function WorkCategoriesPage() {
  return (
    <MasterCrudPage
      title="Work Categories"
      icon={Layers}
      breadcrumbs={breadcrumbs}
      api={workCategoriesApi}
      extractList={extractList}
      columns={columns}
      formFields={formFields}
      emptyForm={emptyForm}
      formId="work-category-form"
      entityName="Work Category"
      permissionPrefix="master"
    />
  );
}
