import { HardHat } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { labourTypesApi } from '../../../api/apiservice';

export function LabourTypesPage() {
  return (
    <MasterCrudPage
      title="Labour Types Master"
      subtitle="Manage skilled, semi-skilled, and un-skilled worker categories"
      icon={HardHat}
      apiService={labourTypesApi}
      dataKey="labour_types"
      codeField="type_code"
      nameField="type_name"
    />
  );
}

export default LabourTypesPage;
