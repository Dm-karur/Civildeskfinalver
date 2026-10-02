import { Warehouse } from 'lucide-react';
import { MasterCrudPage } from './MasterCrudPage';
import { warehousesApi } from '../../../api/apiservice';

export function WarehousesPage() {
  return (
    <MasterCrudPage
      title="Warehouses & Stores"
      subtitle="Manage central stores, yards, and site material warehouses"
      icon={Warehouse}
      apiService={warehousesApi}
      dataKey="warehouses"
      codeField="warehouse_code"
      nameField="warehouse_name"
    />
  );
}

export default WarehousesPage;
