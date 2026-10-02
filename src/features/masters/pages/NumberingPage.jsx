import { Hash } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { numberingApi } from '../../../api/apiservice';

export function NumberingPage() {
  return (
    <MasterCrudPage
      title="Auto-Numbering Series"
      subtitle="Configure document prefixes, numbering sequences, and vouchers"
      icon={Hash}
      apiService={numberingApi}
      dataKey="numbering"
      codeField="document_type"
      nameField="prefix"
      extraFields={[
        { name: 'current_number', label: 'Current Number', type: 'number', placeholder: '1001' },
        { name: 'suffix', label: 'Suffix', placeholder: 'e.g. /2026' }
      ]}
    />
  );
}

export default NumberingPage;
