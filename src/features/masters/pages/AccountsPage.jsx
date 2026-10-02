import { BookOpen } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { accountsApi } from '../../../api/apiservice';

export function AccountsPage() {
  return (
    <MasterCrudPage
      title="Chart of Accounts"
      subtitle="Manage financial ledger accounts & head classifications"
      icon={BookOpen}
      apiService={accountsApi}
      dataKey="accounts"
      codeField="account_code"
      nameField="account_name"
    />
  );
}

export default AccountsPage;
