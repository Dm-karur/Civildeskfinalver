import { Calendar } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { paymentTermsApi } from '../../../api/apiservice';

export function PaymentTermsPage() {
  return (
    <MasterCrudPage
      title="Payment Terms"
      subtitle="Manage standard payment milestones & credit periods"
      icon={Calendar}
      apiService={paymentTermsApi}
      dataKey="payment_terms"
      codeField="code"
      nameField="name"
      extraFields={[{ name: 'due_days', label: 'Due Days', type: 'number', placeholder: 'e.g. 30' }]}
    />
  );
}

export default PaymentTermsPage;
