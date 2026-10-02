import { Percent } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { taxRatesApi } from '../../../api/apiservice';

export function TaxRatesPage() {
  return (
    <MasterCrudPage
      title="Tax Rates & GST"
      subtitle="Manage GST percentages, TDS, and statutory tax slabs"
      icon={Percent}
      apiService={taxRatesApi}
      dataKey="tax_rates"
      codeField="tax_code"
      nameField="tax_name"
      extraFields={[{ name: 'rate_percent', label: 'Rate (%)', type: 'number', placeholder: 'e.g. 18' }]}
    />
  );
}

export default TaxRatesPage;
