import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, ShieldCheck, Search, RefreshCw, Layers, Clock, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
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
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
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
    setError(null);
    try {
      const res = await apiService.list();
      const list = dataKey ? res?.data?.[dataKey] ?? res?.[dataKey] : (res?.data ?? res);
      const arr = Array.isArray(list) ? list : (Array.isArray(res) ? res : []);
      setItems(arr);
    } catch (err) {
      console.error(`Failed to fetch ${title}:`, err);
      const errMsg = err?.message || err?.data?.message || err?.original?.message || `Failed to load ${title} from backend.`;
      setError(errMsg);
      toast.error(errMsg);
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
      is_active: item.is_active !== 0 && item.is_active !== false ? '1' : '0',
      ...extraFields.reduce((acc, f) => ({ ...acc, [f.name]: String(item[f.name] ?? f.defaultValue ?? '') }), {})
    });
    setEditingItem(item);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!String(form[nameField] || '').trim()) {
      toast.error(`${title} name is required.`);
      return;
    }
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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = search.toLowerCase();
      const codeVal = String(item[codeField] || '').toLowerCase();
      const nameVal = String(item[nameField] || item.title || '').toLowerCase();
      const descVal = String(item.description || '').toLowerCase();
      const matchesSearch = codeVal.includes(q) || nameVal.includes(q) || descVal.includes(q);

      const isActive = item.is_active !== 0 && item.is_active !== false;
      const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'active' ? isActive : !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [items, search, codeField, nameField, selectedStatus]);

  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const pagedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  // KPI Calculations
  const activeCount = useMemo(() => items.filter(i => i.is_active !== 0 && i.is_active !== false).length, [items]);
  const inactiveCount = useMemo(() => items.filter(i => i.is_active === 0 || i.is_active === false).length, [items]);

  return (
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title={title}
        subtitle={subtitle || `Manage master records for ${title}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters', href: '#' },
          { label: title }
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* KPI Stats Bar - Standard Site Team Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label={`Total ${title}`}
          value={items.length}
          status="info"
          icon={Icon ? <Icon className="w-4 h-4 text-sky-500" /> : <Layers className="w-4 h-4 text-sky-500" />}
        />
        <KpiCard
          label="Active Records"
          value={activeCount}
          status="success"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
        />
        <KpiCard
          label="Inactive Records"
          value={inactiveCount}
          status="neutral"
          icon={<Clock className="w-4 h-4 text-slate-500" />}
        />
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="font-medium">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="h-7 text-[11px] border-rose-300 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/30 shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="w-full sm:w-64">
            <SearchField
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val);
                setPage(1);
              }}
              className="text-xs h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenAdd}
            className="text-xs h-8 shadow-xs"
          >
            Add {title}
          </Button>
        </div>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block">
        <DataTableContainer
          pagination={
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          }
        >
          <table className="w-full text-left text-[12px] table-auto">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2 w-36">Code / Ref</th>
                <th className="px-3 py-2">Name / Description</th>
                {extraFields.map(f => (
                  <th key={f.name} className="px-3 py-2">{f.label}</th>
                ))}
                <th className="px-3 py-2 text-center w-28">Status</th>
                <th className="px-3 py-2 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5 + extraFields.length} className="text-center py-8 text-text-muted text-[12px]">
                    Loading {title} from backend API...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5 + extraFields.length} className="text-center py-8 text-rose-500 text-[12px]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-rose-500" />
                      <span className="font-medium">{error}</span>
                      <Button variant="outline" size="sm" onClick={fetchData} className="h-7 text-xs mt-1">
                        <RefreshCw className="w-3 h-3 mr-1" /> Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={5 + extraFields.length} className="text-center py-8 text-text-muted text-[12px]">
                    No records found matching filters.
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, idx) => {
                  const isActive = item.is_active !== 0 && item.is_active !== false;
                  return (
                    <tr key={item.id || idx} className="hover:bg-surface-muted/50 transition-colors">
                      <td className="px-3 py-2 text-center text-text-muted text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] font-semibold text-primary">
                        {item[codeField] || `ID-${item.id}`}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-bold text-text-primary text-[12px]">
                          {item[nameField] || item.title || 'N/A'}
                        </div>
                        {item.description && (
                          <div className="text-[10px] text-text-muted truncate max-w-xs">{item.description}</div>
                        )}
                      </td>
                      {extraFields.map(f => (
                        <td key={f.name} className="px-3 py-2 text-text-secondary text-[11px]">
                          {String(item[f.name] ?? '—')}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={isActive ? 'success' : 'neutral'}
                          className="text-[8px] px-1.5 py-0.5"
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="w-3 h-3" />
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

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">
            Loading {title}...
          </div>
        ) : error ? (
          <div className="text-center py-6 text-rose-500 text-xs bg-rose-500/5 border border-rose-500/20 rounded-lg p-4 space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
            <div className="font-medium">{error}</div>
            <Button variant="outline" size="sm" onClick={fetchData} className="h-7 text-xs mx-auto">
              Retry
            </Button>
          </div>
        ) : pagedItems.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">
            No records found.
          </div>
        ) : (
          pagedItems.map((item) => {
            const isActive = item.is_active !== 0 && item.is_active !== false;
            return (
              <div key={item.id} className="bg-surface border border-border rounded-lg p-3 space-y-2.5 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-primary font-bold">{item[codeField] || `ID-${item.id}`}</span>
                    <h4 className="font-bold text-text-primary text-xs">{item[nameField] || item.title}</h4>
                  </div>
                  <Badge variant={isActive ? 'success' : 'neutral'} className="text-[8px] px-1.5 py-0.5">
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {item.description && (
                  <div className="text-xs pt-1 border-t border-border/60">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Description</span>
                    <span className="text-text-primary text-[11px] truncate block">{item.description}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(item)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-rose-600" onClick={() => setDeletingItem(item)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal - Exact SiteTeamPage Form Structure */}
      {(isAddOpen || editingItem) && (
        <EntityEditModal
          isOpen={true}
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        >
          <EntityEditModal.Header
            icon={Icon || Layers}
            title={editingItem ? `Edit ${title}` : `Add New ${title}`}
            subtitle={`Configure master record parameters for ${title}.`}
            onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
          />
          <form id="master-crud-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EntityEditModal.Body>
              <EntityEditModal.Section title="Record Details & Classification">
                <EntityEditModal.Grid>

                  <FormField label="Name / Title" required>
                    <Input
                      value={form[nameField]}
                      onChange={e => setForm(prev => ({ ...prev, [nameField]: e.target.value }))}
                      placeholder={`Enter ${title.toLowerCase()} name`}
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

                  <FormField label="Status">
                    <Select
                      options={[
                        { value: '1', label: 'Active' },
                        { value: '0', label: 'Inactive' },
                      ]}
                      value={form.is_active}
                      onChange={(val) => setForm(prev => ({ ...prev, is_active: val }))}
                    />
                  </FormField>

                  <FormField label="Description & Remarks" className="md:col-span-2">
                    <Textarea
                      rows={3}
                      value={form.description}
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional notes or remarks..."
                    />
                  </FormField>
                </EntityEditModal.Grid>
              </EntityEditModal.Section>
            </EntityEditModal.Body>

            <EntityEditModal.Footer
              formId="master-crud-form"
              submitLabel={editingItem ? 'Update Record' : 'Save Record'}
              onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
              isSubmitting={saving}
            />
          </form>
        </EntityEditModal>
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <ConfirmDialog
          isOpen={true}
          title={`Delete ${title}`}
          message={`Are you sure you want to delete "${deletingItem[nameField] || deletingItem[codeField]}"?`}
          confirmLabel="Delete Record"
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
          loading={saving}
          variant="danger"
        />
      )}
    </PageContainer>
  );
}

export default MasterCrudPage;
