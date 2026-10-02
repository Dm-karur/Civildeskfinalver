import { Hammer } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { tradesApi } from '../../../api/apiservice';

export function TradesPage() {
  return (
    <MasterCrudPage
      title="Trades Registry"
      subtitle="Manage trade classifications for skilled labor & subcontractors"
      icon={Hammer}
      apiService={tradesApi}
      dataKey="trades"
      codeField="trade_code"
      nameField="trade_name"
    />
  );
}

export default TradesPage;
