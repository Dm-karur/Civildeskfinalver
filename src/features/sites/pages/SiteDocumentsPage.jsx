import { MasterCrudPage } from '../../masters/pages/MasterCrudPage';
import { FileText } from 'lucide-react';
import { projectDocumentsApi } from '../../../api/apiservice';

export function SiteDocumentsPage() {
  return (
    <MasterCrudPage
      title="Site Documents & Blueprints"
      subtitle="Manage site drawings, safety permits, and inspection certificates"
      icon={FileText}
      apiService={projectDocumentsApi}
      dataKey="documents"
      codeField="document_type"
      nameField="title"
      extraFields={[{ name: 'file_path', label: 'File Reference / Path', placeholder: '/uploads/dwg/sheet1.pdf' }]}
    />
  );
}

export default SiteDocumentsPage;
