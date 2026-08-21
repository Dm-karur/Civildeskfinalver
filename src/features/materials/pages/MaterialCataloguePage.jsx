import { Package } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { materialsApi } from '../../../api/apiservice';

/* Backend: MaterialMastersController listing → ok('...','materials', [...])
   DB: materials table → material_code, material_name, specification, brand_preference, hsn_code, gst_rate, standard_rate */
const extract = (res) => res?.data?.materials ?? res?.data?.data ?? [];

export function MaterialCataloguePage() {
  return (
    <DocumentListPage
      title="Material Catalogue"
      icon={Package}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials & Inventory' }, { label: 'Material Catalogue' }]}
      api={materialsApi.catalogue}
      extractList={extract}
      columns={[
        { key: 'material_code', label: 'Code', className: 'w-24', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'material_name', label: 'Material', className: 'w-44', cellClass: 'font-medium text-text-primary' },
        { key: 'category_name', label: 'Category', className: 'w-32' },
        { key: 'specification', label: 'Specification', className: 'w-36' },
        { key: 'brand_preference', label: 'Brand', className: 'w-24' },
        { key: 'hsn_code', label: 'HSN', className: 'w-20' },
        { key: 'gst_rate', label: 'GST%', className: 'w-16 text-right' },
        { key: 'standard_rate', label: 'Std Rate', className: 'w-24 text-right', format: 'currency' },
        { key: 'is_active', label: 'Active', className: 'w-16 text-center', render: (r) => r.is_active ? '✓' : '✗' },
      ]}
      searchKeys={['material_code', 'material_name', 'category_name', 'brand_preference', 'hsn_code']}
      entityName="Material"
      permissionPrefix="materials"
    />
  );
}
