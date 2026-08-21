import { ArrowUpFromLine } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { materialManagementApi } from '../../../api/apiservice';

/* Backend: MaterialDocumentsController → ok('...','material_transactions', [...])
   DB: material_transactions → transaction_no, transaction_date, transaction_type_id, purpose */
const extract = (res) => res?.data?.material_transactions ?? res?.data?.data ?? [];

function StockTransactionsBase({ title, type }) {
  return (
    <DocumentListPage
      title={title}
      icon={ArrowUpFromLine}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials & Inventory' }, { label: title }]}
      api={materialManagementApi.transactions}
      extractList={extract}
      columns={[
        { key: 'transaction_no', label: 'Txn No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'transaction_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'transaction_type_name', label: 'Type', className: 'w-24' },
        { key: 'project_name', label: 'Project', className: 'w-32' },
        { key: 'from_site_name', label: 'From Site', className: 'w-28' },
        { key: 'to_site_name', label: 'To Site', className: 'w-28' },
        { key: 'purpose', label: 'Purpose', className: 'w-36' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['transaction_no', 'project_name', 'purpose']}
      entityName="Transaction"
      permissionPrefix="material_stock"
    />
  );
}

export function StockIssuesPage() { return <StockTransactionsBase title="Stock Issues" type="issue" />; }
export function StockTransfersPage() { return <StockTransactionsBase title="Stock Transfers" type="transfer" />; }
export function MaterialReturnsPage() { return <StockTransactionsBase title="Material Returns" type="return" />; }
export function StockAdjustmentsPage() { return <StockTransactionsBase title="Stock Adjustments" type="adjustment" />; }
export function DeliveryChallansPage() { return <StockTransactionsBase title="Delivery Challans" type="delivery_challan" />; }
export function MaterialConsumptionPage() { return <StockTransactionsBase title="Material Consumption" type="consumption" />; }
