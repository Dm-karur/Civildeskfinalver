import { Users } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { crewsApi } from '../../../api/apiservice';

export function CrewsPage() {
  return (
    <MasterCrudPage
      title="Crews & Gangs"
      subtitle="Manage labor gangs, crews, and work units"
      icon={Users}
      apiService={crewsApi}
      dataKey="crews"
      codeField="crew_code"
      nameField="crew_name"
    />
  );
}

export default CrewsPage;
