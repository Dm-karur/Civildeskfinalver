import { useEffect, useState } from 'react';
import { Package, Plus, Edit, Trash2, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { SearchField } from '../../../components/composite/SearchField';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';
import { advancedMastersApi } from '../../../api/apiservice';

const EMPTY_FORM = {
  name: '',
  equipment_type: 'Rental',
  description: '',
  is_active: true,
};

export function EquipmentMasterPage() {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await advancedMastersApi.equipment.list();
      const list = res?.data?.equipment ?? res?.data ?? (Array.isArray(res) ? res : []);
      setEquipments(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.message || 'Failed to load equipment list.');
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenAdd = () => {
    setForm(EMPTY_FORM);
    setEditingItem(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      name: item.name || '',
      equipment_type: item.equipment_type || 'Rental',
      description: item.description || '',
      is_active: item.is_active === 1 || item.is_active === true,
    });
    setEditingItem(item);
    setIsAddOpen(true);
  };

  const handleClose = () => {
    setIsAddOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Equipment Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        equipment_type: form.equipment_type,
        description: form.description.trim(),
        is_active: form.is_active ? 1 : 0,
      };

      if (editingItem?.id) {
        await advancedMastersApi.equipment.update(editingItem.id, payload);
        toast.success('Equipment updated successfully.');
      } else {
        await advancedMastersApi.equipment.create(payload);
        toast.success('Equipment added successfully.');
      }
      handleClose();
      fetchEquipments();
    } catch (err) {
      const msg = err?.message || (editingItem ? 'Failed to update equipment.' : 'Failed to add equipment.');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await advancedMastersApi.equipment.remove(deletingItem.id);
      toast.success('Equipment deleted successfully.');
      setDeletingItem(null);
      fetchEquipments();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete equipment.');
      setDeletingItem(null);
    }
  };

  const filteredEquipments = equipments.filter(item =>
    (item.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = equipments.filter(e => e.is_active === 1 || e.is_active === true).length;

  return (
    <PageContainer>
      <PageHeader
        title="Equipment Master"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters' },
          { label: 'Equipment Master' },
        ]}
      />

      <div className="flex w-full flex-col gap-3 sm:gap-4">
        {/* KPI Ribbons */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 sm:gap-3">
          <KpiCard label="Total Equipment" value={loading ? '…' : equipments.length} icon={<Package />} status="info" />
          <KpiCard label="Active Equipment" value={loading ? '…' : activeCount} icon={<ShieldCheck className="text-emerald-500" />} status="success" />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-stretch justify-between gap-2.5 rounded-lg border border-border bg-surface p-2.5 shadow-xs sm:flex-row sm:items-center sm:p-3">
          <div className="w-full sm:w-64">
            <SearchField
              placeholder="Search equipment..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleOpenAdd}
            className="w-full sm:w-auto"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Equipment
          </Button>
        </div>

        <DataTableContainer>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-muted border-y border-border">
                <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-1/3">
                  Equipment Name
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-1/5">
                  Type
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">
                  Description
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-center w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-text-secondary uppercase tracking-wider text-right w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-[13px]">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading equipment...
                    </div>
                  </td>
                </tr>
              ) : filteredEquipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-[13px]">
                    {search ? 'No equipment matches your search.' : 'No equipment found. Add your first equipment above.'}
                  </td>
                </tr>
              ) : (
                filteredEquipments.map((item) => {
                  const isActive = item.is_active === 1 || item.is_active === true;
                  return (
                    <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text-primary text-[13px]">{item.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral" className="text-[10px] font-bold uppercase tracking-wider">
                          {item.equipment_type || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-[12px] hidden md:table-cell">
                        {item.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={isActive ? 'success' : 'neutral'}
                          className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center"
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="h-4 w-4 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Delete"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="h-4 w-4 text-text-secondary hover:text-error" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      <EntityEditModal
        isOpen={isAddOpen || Boolean(editingItem)}
        onClose={handleClose}
      >
        <EntityEditModal.Header
          icon={Package}
          title={editingItem ? 'Edit Equipment' : 'Add New Equipment'}
          subtitle="Configure equipment details."
          onClose={handleClose}
        />
        <form id="equipment-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Equipment Details">
              <EntityEditModal.Grid>
                <FormField label="Equipment Name" required className="md:col-span-2">
                  <Input
                    placeholder="e.g. Concrete Mixer"
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </FormField>

                <FormField label="Equipment Type" required>
                  <Select
                    options={[
                      { value: 'Rental', label: 'Rental' },
                      { value: 'Own', label: 'Own' },
                    ]}
                    value={form.equipment_type}
                    onChange={(val) => handleFormChange('equipment_type', val)}
                  />
                </FormField>

                <FormField label="Description" className="md:col-span-2">
                  <Input
                    placeholder="e.g. 200L Diesel"
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </FormField>

                <div className="md:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      checked={form.is_active}
                      onChange={(e) => handleFormChange('is_active', e.target.checked)}
                    />
                    <span className="text-sm text-text-primary font-medium group-hover:text-primary transition-colors">
                      Active
                    </span>
                  </label>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer
            formId="equipment-form"
            submitLabel={editingItem ? 'Update' : 'Create'}
            isSubmitting={saving}
            onCancel={handleClose}
          />
        </form>
      </EntityEditModal>

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title="Delete Equipment"
        message={`Are you sure you want to delete "${deletingItem?.name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
