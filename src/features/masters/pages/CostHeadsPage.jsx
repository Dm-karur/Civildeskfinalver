import { DollarSign } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { costHeadsApi } from '../../../api/apiservice';

export function CostHeadsPage() {
  return (
    <MasterCrudPage
      title="Cost Heads"
      subtitle="Manage cost breakdown structures & accounting heads"
      icon={DollarSign}
      apiService={costHeadsApi}
      dataKey="cost_heads"
      codeField="cost_head_code"
      nameField="cost_head_name"
    />
  );
}

export default CostHeadsPage;
