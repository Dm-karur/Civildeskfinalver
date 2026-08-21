import { BookOpen } from 'lucide-react';
import { ReportPage } from '../../shared/components/ReportPage';
import { materialManagementApi } from '../../../api/apiservice';

/* Backend: MaterialDocumentsController ledger() → ok('...','material_ledger', [...])
   Columns: movement_date, movement_type, reference_no, from_site_id, to_site_id, quantity, unit_rate, line_value */

export function StockLedgerPage() {
  return (
    <ReportPage
      title="Stock Ledger"
      icon={BookOpen}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Materials & Inventory' }, { label: 'Stock Ledger' }]}
      fetchData={(params) => materialManagementApi.ledger(params)}
      extractList={(res) => res?.data?.material_ledger ?? res?.data?.data ?? []}
      columns={[
        { key: 'movement_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'movement_type', label: 'Movement Type', className: 'w-28' },
        { key: 'reference_no', label: 'Reference No.', className: 'w-28', cellClass: 'font-mono text-text-primary' },
        { key: 'quantity', label: 'Quantity', className: 'w-20 text-right font-mono' },
        { key: 'unit_rate', label: 'Unit Rate', className: 'w-24 text-right', format: 'currency' },
        { key: 'line_value', label: 'Line Value', className: 'w-24 text-right font-semibold', format: 'currency' },
      ]}
      searchKeys={['reference_no', 'movement_type']}
    />
  );
}
