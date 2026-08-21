import { Boxes } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { materialManagementApi } from '../../../api/apiservice';

/* Backend: MaterialDocumentsController stock() → ok('...','material_stock', [...])
   Columns: material_code, material_name, available_qty, minimum_stock_qty, reorder_qty, below_minimum */
const extract = (res) => res?.data?.material_stock ?? res?.data?.stock ?? res?.data?.data ?? [];

export function StockOverviewPage() {
  return (
    <DocumentListPage
      title="Stock Overview"
      icon={Boxes}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials & Inventory' }, { label: 'Stock Overview' }]}
      api={{ list: materialManagementApi.stock }}
      extractList={extract}
      columns={[
        { key: 'material_code', label: 'Code', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'material_name', label: 'Material Name', className: 'w-48', cellClass: 'font-medium text-text-primary' },
        { key: 'available_qty', label: 'Available Qty', className: 'w-24 text-right font-mono font-bold text-text-primary' },
        { key: 'minimum_stock_qty', label: 'Min Qty', className: 'w-20 text-right' },
        { key: 'reorder_qty', label: 'Reorder Qty', className: 'w-20 text-right' },
        { key: 'below_minimum', label: 'Alert', className: 'w-20 text-center', render: (r) => r.below_minimum ? <span className="text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">Low Stock</span> : <span className="text-[10px] text-success">OK</span> },
      ]}
      searchKeys={['material_code', 'material_name']}
      entityName="Stock"
      permissionPrefix="material_stock"
    />
  );
}
