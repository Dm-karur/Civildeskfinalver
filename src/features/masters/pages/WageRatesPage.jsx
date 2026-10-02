import { IndianRupee } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { wagesApi } from '../../../api/apiservice';

export function WageRatesPage() {
  return (
    <MasterCrudPage
      title="Standard Wage Rates"
      subtitle="Manage daily base wage rates by trade & category"
      icon={IndianRupee}
      apiService={wagesApi}
      dataKey="wage_rates"
      codeField="trade_code"
      nameField="trade_name"
      extraFields={[{ name: 'daily_rate', label: 'Daily Base Rate (₹)', type: 'number', placeholder: '850' }]}
    />
  );
}

export default WageRatesPage;
