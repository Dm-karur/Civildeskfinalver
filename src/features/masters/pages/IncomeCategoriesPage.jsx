import { TrendingUp } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { incomeCategoriesApi } from '../../../api/apiservice';

export function IncomeCategoriesPage() {
  return (
    <MasterCrudPage
      title="Income Categories"
      subtitle="Manage project billing & non-billing revenue categories"
      icon={TrendingUp}
      apiService={incomeCategoriesApi}
      dataKey="income_categories"
      codeField="category_code"
      nameField="category_name"
    />
  );
}

export default IncomeCategoriesPage;
