import { MasterCrudPage } from '../../masters/pages/MasterCrudPage';
import { ClipboardList } from 'lucide-react';
import { sitesApi } from '../../../api/apiservice';

export function SiteInstructionsPage() {
  return (
    <MasterCrudPage
      title="Site Instructions & Directives"
      subtitle="Manage site engineer directives, architect instructions, and safety orders"
      icon={ClipboardList}
      apiService={sitesApi}
      dataKey="sites"
      codeField="site_code"
      nameField="site_name"
      extraFields={[{ name: 'location', label: 'Work Location', placeholder: 'e.g. Block A Slab' }]}
    />
  );
}

export default SiteInstructionsPage;
