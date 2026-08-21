import { ArrowDownToLine } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { materialManagementApi } from '../../../api/apiservice';

/* Backend: MaterialDocumentsController → ok('...','material_receipts', [...])
   DB: material_receipts → receipt_no, receipt_date, supplier_challan_no, vehicle_no, invoice_no */
const extract = (res) => res?.data?.material_receipts ?? res?.data?.data ?? [];

export function StockReceiptsPage() {
  return (
    <DocumentListPage
      title="Stock Receipts"
      icon={ArrowDownToLine}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials & Inventory' }, { label: 'Stock Receipts' }]}
      api={materialManagementApi.receipts}
      extractList={extract}
      columns={[
        { key: 'receipt_no', label: 'Receipt No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'receipt_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'project_name', label: 'Project', className: 'w-32' },
        { key: 'site_name', label: 'Site', className: 'w-28' },
        { key: 'supplier_name', label: 'Supplier', className: 'w-32' },
        { key: 'supplier_challan_no', label: 'Challan No.', className: 'w-24' },
        { key: 'invoice_no', label: 'Invoice No.', className: 'w-24' },
        { key: 'vehicle_no', label: 'Vehicle', className: 'w-20' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['receipt_no', 'supplier_name', 'supplier_challan_no', 'invoice_no']}
      entityName="Receipt"
      permissionPrefix="material_receipts"
    />
  );
}
