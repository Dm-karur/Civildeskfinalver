import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, CheckCircle, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';
import { toast } from '../../../components/composite/Toast';
import { labourApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const extract = (res) => res?.data?.labour_workers ?? res?.data?.data ?? [];

const EMPTY_FORM = {
  labour_category_id: '', contractor_id: '', worker_code: '', worker_name: '',
  employment_source_id: '', gender_id: '', date_of_birth: '', phone: '',
  emergency_contact_name: '', emergency_contact_phone: '', blood_group: '',
  address: '', native_place: '', id_type_id: '', id_number_masked: '',
  date_joined: '', date_left: '', wage_basis_id: '', base_wage_rate: '',
  overtime_rate_per_hour: '', bank_name: '', bank_account_name: '',
  bank_account_no_masked: '', bank_ifsc: '', safety_induction_date: '',
  status_id: '', notes: '',
};

const statusVariant = (s) => {
  const v = String(s || '').toLowerCase();
  if (v.includes('active')) return 'success';
  if (v.includes('inactive') || v.includes('left')) return 'neutral';
  if (v.includes('terminated') || v.includes('blacklisted')) return 'error';
  return 'warning';
};

export function LabourRegisterPage() {
  const { hasPermission } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [masters, setMasters] = useState({});

  const fetchItems = useCallback(() => {
    setLoading(true);
    labourApi.workers.list()
      .then((res) => setItems(extract(res)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    labourApi.masters().then((res) => {
      const d = res?.data?.masters ?? res?.data ?? {};
      setMasters(d);
    }).catch(() => {});
  }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setErrors({}); setIsAddOpen(true); };
  const openEdit = (item) => {
    const populated = { ...EMPTY_FORM };
    Object.keys(EMPTY_FORM).forEach((k) => { populated[k] = item[k] != null ? String(item[k]) : ''; });
    setForm(populated); setErrors({}); setEditItem(item);
  };
  const change = (n, v) => { setForm((c) => ({ ...c, [n]: v })); setErrors((c) => ({ ...c, [n]: null })); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    ['worker_code', 'worker_name', 'labour_category_id', 'date_joined', 'status_id'].forEach((f) => {
      if (!String(form[f] || '').trim()) errs[f] = 'Required';
    });
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      ['labour_category_id', 'contractor_id', 'employment_source_id', 'gender_id', 'id_type_id', 'wage_basis_id', 'status_id'].forEach((f) => {
        if (payload[f]) payload[f] = Number(payload[f]);
      });
      ['base_wage_rate', 'overtime_rate_per_hour'].forEach((f) => {
        if (payload[f]) payload[f] = Number(payload[f]);
      });
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });
      if (editItem?.id) await labourApi.workers.update(editItem.id, payload);
      else await labourApi.workers.create(payload);
      toast.success(`Worker ${editItem ? 'updated' : 'created'} successfully.`);
      setIsAddOpen(false); setEditItem(null); fetchItems();
    } catch (err) {
      setErrors(err?.errors ?? {});
      toast.error(err?.message || 'Failed to save worker.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteItem?.id) return;
    try {
      await labourApi.workers.remove(deleteItem.id);
      toast.success('Worker deleted.'); setDeleteItem(null); fetchItems();
    } catch (err) { toast.error(err?.message || 'Cannot delete worker.'); }
  };

  const filtered = items.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [i.worker_code, i.worker_name, i.category_name, i.contractor_name, i.phone].some((v) => String(v || '').toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const isModalOpen = isAddOpen || Boolean(editItem);

  const masterOpts = (key) => (Array.isArray(masters[key]) ? masters[key] : []).map((m) => ({ value: String(m.id), label: m.status_name || m.source_name || m.gender_name || m.type_name || m.basis_name || m.name || m.id }));

  const active = items.filter((i) => String(i.status_name || '').toLowerCase().includes('active')).length;

  return (
    <PageContainer>
      <PageHeader title="Labour Register" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Labour & Attendance' }, { label: 'Labour Register' }]} />

      <div className="flex flex-col gap-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard label="Total Workers" value={items.length} status="primary" icon={<Users className="w-5 h-5" />} />
          <KpiCard label="Active" value={active} status="success" icon={<CheckCircle className="w-5 h-5" />} />
          <KpiCard label="Inactive / Left" value={items.length - active} status="neutral" icon={<Clock className="w-5 h-5" />} />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-1">
          <div className="w-full sm:w-[220px]">
            <SearchField placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            {hasPermission('labour.create') && (
              <Button variant="primary" className="h-9 px-3 text-[13px]" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openAdd}>Add Worker</Button>
            )}
          </div>
        </div>

        {/* Table */}
        <DataTableContainer pagination={<Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={() => {}} />}>
          <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-2 py-1.5 w-10 text-center">#</th>
                <th className="px-2 py-1.5 w-24">Code</th>
                <th className="px-2 py-1.5 w-40">Name</th>
                <th className="px-2 py-1.5 w-28">Category</th>
                <th className="px-2 py-1.5 w-32">Contractor</th>
                <th className="px-2 py-1.5 w-24">Phone</th>
                <th className="px-2 py-1.5 w-24">Joined</th>
                <th className="px-2 py-1.5 w-24 text-right">Wage Rate</th>
                <th className="px-2 py-1.5 w-24 text-center">Status</th>
                <th className="px-2 py-1.5 text-center w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="10" className="text-center py-6 text-text-muted text-[12px]">Loading...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan="10" className="text-center py-6 text-text-muted text-[12px]">No workers found.</td></tr>
              ) : paged.map((item, idx) => (
                <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="px-2 py-1 text-center font-medium text-text-primary text-[11px]">{(page - 1) * perPage + idx + 1}</td>
                  <td className="px-2 py-1 font-mono font-semibold text-text-primary text-[11px]">{item.worker_code || '—'}</td>
                  <td className="px-2 py-1 font-medium text-text-primary text-[11px]">{item.worker_name || '—'}</td>
                  <td className="px-2 py-1 text-[11px]">{item.category_name || '—'}</td>
                  <td className="px-2 py-1 text-[11px]">{item.contractor_name || '—'}</td>
                  <td className="px-2 py-1 text-[11px]">{item.phone || '—'}</td>
                  <td className="px-2 py-1 text-[11px]">{item.date_joined ? item.date_joined.split(' ')[0] : '—'}</td>
                  <td className="px-2 py-1 text-[11px] text-right font-mono">{item.base_wage_rate ? `₹${Number(item.base_wage_rate).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-2 py-1 text-center">
                    <Badge variant={statusVariant(item.status_name)} className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none">{item.status_name || '—'}</Badge>
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-center gap-0.5">
                      {hasPermission('labour.update') && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Edit" onClick={() => openEdit(item)}><Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" /></Button>
                      )}
                      {hasPermission('labour.delete') && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Delete" onClick={() => setDeleteItem(item)}><Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      {/* Add / Edit Modal */}
      <EntityEditModal isOpen={isModalOpen} onClose={() => { setIsAddOpen(false); setEditItem(null); }}>
        <EntityEditModal.Header icon={Users} title={editItem ? 'Edit Worker' : 'Add Worker'} subtitle="Manage labour worker details." onClose={() => { setIsAddOpen(false); setEditItem(null); }} />
        <form id="worker-form" onSubmit={submit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Basic Information">
              <EntityEditModal.Grid>
                <FormField label="Worker Code" required error={errors.worker_code}>
                  <Input value={form.worker_code} onChange={(e) => change('worker_code', e.target.value)} placeholder="W-001" />
                </FormField>
                <FormField label="Worker Name" required error={errors.worker_name}>
                  <Input value={form.worker_name} onChange={(e) => change('worker_name', e.target.value)} />
                </FormField>
                <FormField label="Labour Category" required error={errors.labour_category_id}>
                  <Select options={[{ value: '', label: 'Select Category' }, ...masterOpts('categories')]} value={form.labour_category_id} onChange={(v) => change('labour_category_id', v)} />
                </FormField>
                <FormField label="Contractor" error={errors.contractor_id}>
                  <Select options={[{ value: '', label: 'None' }, ...masterOpts('contractors')]} value={form.contractor_id} onChange={(v) => change('contractor_id', v)} />
                </FormField>
                <FormField label="Gender" error={errors.gender_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('genders')]} value={form.gender_id} onChange={(v) => change('gender_id', v)} />
                </FormField>
                <FormField label="Date of Birth" error={errors.date_of_birth}>
                  <Input type="date" value={form.date_of_birth} onChange={(e) => change('date_of_birth', e.target.value)} />
                </FormField>
                <FormField label="Phone" error={errors.phone}>
                  <Input value={form.phone} onChange={(e) => change('phone', e.target.value)} placeholder="9876543210" />
                </FormField>
                <FormField label="Employment Source" error={errors.employment_source_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('employment_sources')]} value={form.employment_source_id} onChange={(v) => change('employment_source_id', v)} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Identity & Address">
              <EntityEditModal.Grid>
                <FormField label="ID Type" error={errors.id_type_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('id_types')]} value={form.id_type_id} onChange={(v) => change('id_type_id', v)} />
                </FormField>
                <FormField label="ID Number" error={errors.id_number_masked}>
                  <Input value={form.id_number_masked} onChange={(e) => change('id_number_masked', e.target.value)} />
                </FormField>
                <FormField label="Blood Group" error={errors.blood_group}>
                  <Input value={form.blood_group} onChange={(e) => change('blood_group', e.target.value)} />
                </FormField>
                <FormField label="Native Place" error={errors.native_place}>
                  <Input value={form.native_place} onChange={(e) => change('native_place', e.target.value)} />
                </FormField>
                <FormField label="Address" className="md:col-span-2" error={errors.address}>
                  <Textarea value={form.address} onChange={(e) => change('address', e.target.value)} rows={2} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Emergency Contact">
              <EntityEditModal.Grid>
                <FormField label="Emergency Contact Name">
                  <Input value={form.emergency_contact_name} onChange={(e) => change('emergency_contact_name', e.target.value)} />
                </FormField>
                <FormField label="Emergency Contact Phone">
                  <Input value={form.emergency_contact_phone} onChange={(e) => change('emergency_contact_phone', e.target.value)} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Employment & Wages">
              <EntityEditModal.Grid>
                <FormField label="Date Joined" required error={errors.date_joined}>
                  <Input type="date" value={form.date_joined} onChange={(e) => change('date_joined', e.target.value)} />
                </FormField>
                <FormField label="Date Left" error={errors.date_left}>
                  <Input type="date" value={form.date_left} onChange={(e) => change('date_left', e.target.value)} />
                </FormField>
                <FormField label="Wage Basis" error={errors.wage_basis_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('wage_bases')]} value={form.wage_basis_id} onChange={(v) => change('wage_basis_id', v)} />
                </FormField>
                <FormField label="Base Wage Rate (₹)" error={errors.base_wage_rate}>
                  <Input type="number" step="0.01" value={form.base_wage_rate} onChange={(e) => change('base_wage_rate', e.target.value)} />
                </FormField>
                <FormField label="OT Rate/Hour (₹)" error={errors.overtime_rate_per_hour}>
                  <Input type="number" step="0.01" value={form.overtime_rate_per_hour} onChange={(e) => change('overtime_rate_per_hour', e.target.value)} />
                </FormField>
                <FormField label="Safety Induction Date">
                  <Input type="date" value={form.safety_induction_date} onChange={(e) => change('safety_induction_date', e.target.value)} />
                </FormField>
                <FormField label="Status" required error={errors.status_id}>
                  <Select options={[{ value: '', label: 'Select' }, ...masterOpts('statuses')]} value={form.status_id} onChange={(v) => change('status_id', v)} />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Bank Details">
              <EntityEditModal.Grid>
                <FormField label="Bank Name"><Input value={form.bank_name} onChange={(e) => change('bank_name', e.target.value)} /></FormField>
                <FormField label="Account Holder"><Input value={form.bank_account_name} onChange={(e) => change('bank_account_name', e.target.value)} /></FormField>
                <FormField label="Account No."><Input value={form.bank_account_no_masked} onChange={(e) => change('bank_account_no_masked', e.target.value)} /></FormField>
                <FormField label="IFSC Code"><Input value={form.bank_ifsc} onChange={(e) => change('bank_ifsc', e.target.value)} /></FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Notes">
              <FormField label="Notes"><Textarea value={form.notes} onChange={(e) => change('notes', e.target.value)} rows={2} /></FormField>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer formId="worker-form" submitLabel={editItem ? 'Update Worker' : 'Create Worker'} onCancel={() => { setIsAddOpen(false); setEditItem(null); }} isSubmitting={saving} />
        </form>
      </EntityEditModal>

      <ConfirmDialog isOpen={Boolean(deleteItem)} title="Delete Worker" message="Are you sure? This action cannot be undone." variant="danger" confirmLabel="Delete" onConfirm={confirmDelete} onCancel={() => setDeleteItem(null)} />
    </PageContainer>
  );
}
