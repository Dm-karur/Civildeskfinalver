import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, ShieldCheck, Search, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';

export function MasterCrudPage({
  title,
  subtitle,
  icon: Icon,
  apiService,
  dataKey,
  codeField = 'code',
  nameField = 'name',
  extraFields = []
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    [codeField]: '',
    [nameField]: '',
    description: '',
    is_active: '1',
    ...extraFields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue || '' }), {})
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.list();
      const list = dataKey ? res?.data?.[dataKey] ?? res?.[dataKey] : (res?.data ?? res);
      const arr = Array.isArray(list) ? list : (Array.isArray(res) ? res : []);
      setItems(arr);
    } catch (err) {
      console.error(`Failed to fetch ${title}:`, err);
      toast.error(`Failed to load ${title} from backend.`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [apiService, dataKey, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenAdd = () => {
    setForm({
      [codeField]: '',
      [nameField]: '',
      description: '',
      is_active: '1',
      ...extraFields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue || '' }), {})
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      [codeField]: item[codeField] || '',
      [nameField]: item[nameField] || item.title || '',
      description: item.description || '',
      is_active: item.is_active ? '1' : '0',
      ...extraFields.reduce((acc, f) => ({ ...acc, [f.name]: String(item[f.name] ?? f.defaultValue ?? '') }), {})
    });
    setEditingItem(item);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        is_active: form.is_active === '1' || form.is_active === true ? 1 : 0
      };

      if (editingItem) {
        await apiService.update(editingItem.id, payload);
        toast.success(`${title} updated successfully.`);
        setEditingItem(null);
      } else {
        await apiService.create(payload);
        toast.success(`New ${title} created successfully.`);
        setIsAddOpen(false);
      }
      fetchData();
    } catch (err) {
      console.error(`Failed to save ${title}:`, err);
      toast.error(err.response?.data?.message || `Failed to save ${title}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSaving(true);
    try {
      await apiService.remove(deletingItem.id);
      toast.success(`${title} deleted.`);
      setDeletingItem(null);
      fetchData();
    } catch (err) {
      console.error(`Failed to delete ${title}:`, err);
      toast.error(err.response?.data?.message || `Failed to delete ${title}.`);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const codeVal = String(item[codeField] || '').toLowerCase();
    const nameVal = String(item[nameField] || item.title || '').toLowerCase();
    const descVal = String(item.description || '').toLowerCase();
    return codeVal.includes(q) || nameVal.includes(q) || descVal.includes(q);
  });

  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const paginatedItems = filteredItems.slice((page - 1) * perPage, page * perPage);

  return (
    <PageContainer>
      <PageHeader
        title={title}
        subtitle={subtitle || `Manage master records for ${title}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="primary" onClick={handleOpenAdd} className="gap-2 bg-[#0056C9] hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add {title}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard
          title={`Total ${title}`}
          value={items.length}
          icon={Icon}
          variant="primary"
        />
        <KpiCard
          title="Active Records"
          value={items.filter(i => i.is_active !== 0 && i.is_active !== false).length}
          icon={ShieldCheck}
          variant="success"
        />
        <KpiCard
          title="Inactive Records"
          value={items.filter(i => i.is_active === 0 || i.is_active === false).length}
          icon={Icon}
          variant="neutral"
        />
      </div>

      <DataTableContainer
        toolbar={
          <div className="flex items-center gap-4">
            <div className="w-72">
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={`Search ${title}...`}
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Code / ID</th>
                <th className="py-3 px-4">Name / Title</th>
                {extraFields.map(f => (
                  <th key={f.name} className="py-3 px-4">{f.label}</th>
                ))}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4 + extraFields.length} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0056C9]" />
                    Loading {title} from backend API...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={4 + extraFields.length} className="py-8 text-center text-slate-500">
                    No records found in database.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {item[codeField] || `ID-${item.id}`}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {item[nameField] || item.title || 'N/A'}
                      {item.description && (
                        <p className="text-xs text-slate-500 font-normal">{item.description}</p>
                      )}
                    </td>
                    {extraFields.map(f => (
                      <td key={f.name} className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {String(item[f.name] ?? '-')}
                      </td>
                    ))}
                    <td className="py-3 px-4">
                      <Badge variant={item.is_active === 0 || item.is_active === false ? 'neutral' : 'success'}>
                        {item.is_active === 0 || item.is_active === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
                          <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingItem(item)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalEntries={filteredItems.length}
          perPage={perPage}
        />
      </DataTableContainer>

      {/* Add / Edit Modal */}
      {(isAddOpen || editingItem) && (
        <EntityEditModal
          isOpen={true}
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
          onSave={handleSubmit}
          title={editingItem ? `Edit ${title}` : `Add New ${title}`}
          saving={saving}
        >
          <div className="space-y-4">
            <FormField label="Code / Identifier" required>
              <Input
                value={form[codeField]}
                onChange={e => setForm(prev => ({ ...prev, [codeField]: e.target.value }))}
                placeholder="e.g. CODE-01"
              />
            </FormField>
            <FormField label="Name / Title" required>
              <Input
                value={form[nameField]}
                onChange={e => setForm(prev => ({ ...prev, [nameField]: e.target.value }))}
                placeholder={`Enter ${title} name`}
              />
            </FormField>
            {extraFields.map(f => (
              <FormField key={f.name} label={f.label} required={f.required}>
                <Input
                  type={f.type || 'text'}
                  value={form[f.name]}
                  onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                  placeholder={f.placeholder || `Enter ${f.label}`}
                />
              </FormField>
            ))}
            <FormField label="Description">
              <Textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </FormField>
          </div>
        </EntityEditModal>
      )}

      {/* Delete Dialog */}
      {deletingItem && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete ${title}`}
          message={`Are you sure you want to delete "${deletingItem[nameField] || deletingItem[codeField]}"?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
          loading={saving}
          variant="danger"
        />
      )}
    </PageContainer>
  );
}
