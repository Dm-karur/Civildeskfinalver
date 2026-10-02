import { Building } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { banksApi } from '../../../api/apiservice';

export function BanksPage() {
  return (
    <MasterCrudPage
      title="Bank Accounts"
      subtitle="Manage corporate & project bank account master entries"
      icon={Building}
      apiService={banksApi}
      dataKey="banks"
      codeField="bank_code"
      nameField="bank_name"
      extraFields={[
        { name: 'account_number', label: 'Account Number', placeholder: 'e.g. 5010049102391' },
        { name: 'ifsc_code', label: 'IFSC Code', placeholder: 'e.g. HDFC0001234' }
      ]}
    />
  );
}

export default BanksPage;
