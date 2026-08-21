import { useState, useEffect, useMemo } from 'react';
import {
  Package, CheckCircle2, XCircle, IndianRupee, Layers,
  Search, Filter, Eye, Edit, Trash2, Plus, ArrowRight,
  ShieldCheck, Check, AlertCircle, Sparkles, Tag, Building
} from 'lucide-react';
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
import { materialsApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

/* 
const DEFAULT_MATERIALS = [

  {
    id: 1,
    material_code: 'MAT-CEM-001',
    material_name: 'OPC 53 Grade Cement',
    category_id: 1,
    category_name: 'Cement & Binding Agents',
    specification: 'IS 12269 High Strength Grade',
    brand_preference: 'UltraTech / Dalmia',
    uom: 'Bags (50kg)',
    hsn_code: '252329',
    gst_rate: 28,
    standard_rate: 385,
    is_active: true,
    description: 'High-early strength portland cement for RCC structural elements.'
  },
  {
    id: 2,
    material_code: 'MAT-STL-002',
    material_name: 'Fe 550D TMT Rebar 16mm',
    category_id: 2,
    category_name: 'Steel & Reinforcement',
    specification: 'IS 1786 High Ductility Corrosion Resistant',
    brand_preference: 'Tata Tiscon / JSW Neosteel',
    uom: 'MT',
    hsn_code: '721420',
    gst_rate: 18,
    standard_rate: 58500,
    is_active: true,
    description: 'High yield strength thermo-mechanically treated bar for columns & beams.'
  },
  {
    id: 3,
    material_code: 'MAT-AGG-003',
    material_name: '20mm Blue Metal Coarse Aggregate',
    category_id: 3,
    category_name: 'Sand & Aggregates',
    specification: 'IS 383 Machine Crushed Granite',
    brand_preference: 'Certified Quarry Approved',
    uom: 'Ton / CFT',
    hsn_code: '251710',
    gst_rate: 5,
    standard_rate: 1450,
    is_active: true,
    description: 'Clean angular hard granite aggregate for M25/M30 concrete mixes.'
  },
  {
    id: 4,
    material_code: 'MAT-BLK-004',
    material_name: 'AAC Blocks 600x200x150mm',
    category_id: 4,
    category_name: 'Bricks & Masonry',
    specification: 'Grade 1 Autoclaved Aerated Lightweight',
    brand_preference: 'Siporex / Magicrete',
    uom: 'Nos',
    hsn_code: '681599',
    gst_rate: 12,
    standard_rate: 68,
    is_active: true,
    description: 'Thermal insulating lightweight partition wall blocks.'
  },
  {
    id: 5,
    material_code: 'MAT-ADM-005',
    material_name: 'Polycarboxylate Superplasticizer',
    category_id: 1,
    category_name: 'Cement & Binding Agents',
    specification: 'IS 9103 High Range Water Reducer',
    brand_preference: 'Fosroc / Sika ViscoCrete',
    uom: 'Kg / Litres',
    hsn_code: '382440',
    gst_rate: 18,
    standard_rate: 125,
    is_active: true,
    description: 'High performance water reducing admixture for pumped concrete.'
  },
];
*/

const EMPTY_FORM = {
  material_code: '',
  material_name: '',
  category_name: 'Cement & Binding Agents',
  specification: '',
  brand_preference: '',
  uom: 'Bags (50kg)',
  hsn_code: '',
  gst_rate: '18',
  standard_rate: '0',
  is_active: true,
  description: '',
};

export function MaterialCataloguePage() {
  const { hasPermission } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load API Data if available
  useEffect(() => {
    setLoading(true);
    materialsApi.catalogue.list()
      .then(res => {
        const list = res?.data?.materials ?? res?.data?.data ?? [];
        if (Array.isArray(list) && list.length > 0) {
          setMaterials(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Form Handlers
  const handleOpenAdd = () => {
    setForm({
      ...EMPTY_FORM,
      material_code: `MAT-GEN-00${materials.length + 1}`,
    });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      material_code: item.material_code || '',
      material_name: item.material_name || '',
      category_name: item.category_name || 'Cement & Binding Agents',
      specification: item.specification || '',
      brand_preference: item.brand_preference || '',
      uom: item.uom || 'Nos',
      hsn_code: item.hsn_code || '',
      gst_rate: String(item.gst_rate || '18'),
      standard_rate: String(item.standard_rate || '0'),
      is_active: item.is_active !== false,
      description: item.description || '',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.material_code.trim()) errs.material_code = 'Item code is required';
    if (!form.material_name.trim()) errs.material_name = 'Material name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const newMaterial = {
        id: editingItem?.id || Date.now(),
        material_code: form.material_code,
        material_name: form.material_name,
        category_name: form.category_name,
        specification: form.specification,
        brand_preference: form.brand_preference,
        uom: form.uom,
        hsn_code: form.hsn_code,
        gst_rate: Number(form.gst_rate || 18),
        standard_rate: Number(form.standard_rate || 0),
        is_active: Boolean(form.is_active),
        description: form.description,
      };

      if (editingItem?.id) {
        setMaterials(prev => prev.map(m => m.id === editingItem.id ? newMaterial : m));
        toast.success('Material item updated.');
      } else {
        setMaterials(prev => [newMaterial, ...prev]);
        toast.success('Material item added to catalogue.');
      }

      setIsAddOpen(false);
      setEditingItem(null);
    } catch {
      toast.error('Failed to save material item.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteItem?.id) return;
    setMaterials(prev => prev.filter(m => m.id !== deleteItem.id));
    toast.success('Material item removed.');
    setDeleteItem(null);
  };

  // Filtered List
  const categoriesList = useMemo(() => {
    const set = new Set();
    materials.forEach(m => { if (m.category_name) set.add(m.category_name); });
    return Array.from(set);
  }, [materials]);

  const filtered = useMemo(() => {
    return materials.filter(m => {
      if (categoryFilter !== 'all' && m.category_name !== categoryFilter) return false;
      if (statusFilter !== 'all') {
        const isAct = m.is_active !== false;
        if (statusFilter === 'Active' && !isAct) return false;
        if (statusFilter === 'Inactive' && isAct) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const code = (m.material_code || '').toLowerCase();
        const name = (m.material_name || '').toLowerCase();
        const cat = (m.category_name || '').toLowerCase();
        const spec = (m.specification || '').toLowerCase();
        const brand = (m.brand_preference || '').toLowerCase();
        const hsn = (m.hsn_code || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cat.includes(q) && !spec.includes(q) && !brand.includes(q) && !hsn.includes(q)) return false;
      }
      return true;
    });
  }, [materials, categoryFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // Metrics
  const totalItems = materials.length;
  const activeItems = useMemo(() => materials.filter(m => m.is_active !== false).length, [materials]);
  const avgStdRate = useMemo(() => {
    if (materials.length === 0) return 0;
    return Math.round(materials.reduce((acc, m) => acc + Number(m.standard_rate || 0), 0) / materials.length);
  }, [materials]);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Materials & Inventory', href: '/materials/catalogue' },
    { label: 'Material Catalogue' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Material Master Item Catalogue"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Catalogue Items"
            value={totalItems}
            status="primary"
            icon={<Package className="w-4 h-4" />}
          />
          <KpiCard
            label="Active Master SKUs"
            value={activeItems}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Material Categories"
            value={categoriesList.length}
            status="neutral"
            icon={<Layers className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Average Std Unit Rate"
            value={`₹${avgStdRate.toLocaleString('en-IN')}`}
            status="neutral"
            icon={<IndianRupee className="w-4 h-4 text-sky-500" />}
          />
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categoriesList.map(c => ({ value: c, label: c }))
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-xs h-8"
              />
            </div>

            <div className="w-full sm:w-56">
              <SearchField
                placeholder="Search code, material, brand, HSN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {hasPermission('materials.create') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleOpenAdd}
                className="text-xs h-8 shadow-xs"
              >
                Add Material
              </Button>
            )}
          </div>
        </div>

        {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filtered.length}
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
                  <th className="px-3 py-2 w-28">Item Code</th>
                  <th className="px-3 py-2">Material Name & Category</th>
                  <th className="px-3 py-2 w-36 hidden md:table-cell">Brand & Spec</th>
                  <th className="px-3 py-2 text-center w-24 hidden lg:table-cell">HSN / GST</th>
                  <th className="px-3 py-2 text-right w-28">Std Rate / UOM</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading material catalogue...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No catalogue materials found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paged.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {m.material_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[12px] truncate" title={m.material_name}>
                            {m.material_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {m.category_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] text-text-primary font-medium truncate" title={m.brand_preference}>
                            {m.brand_preference || 'Standard Grade'}
                          </span>
                          <span className="text-[10px] text-text-muted truncate" title={m.specification}>
                            {m.specification}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center hidden lg:table-cell font-mono text-[10px]">
                        <span className="text-text-primary">{m.hsn_code || '—'}</span>
                        <span className="text-text-muted block">{m.gst_rate}% GST</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px]">
                        <span className="font-bold text-primary">₹{Number(m.standard_rate).toLocaleString('en-IN')}</span>
                        <span className="text-text-muted block text-[10px]">/ {m.uom}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={m.is_active !== false ? 'success' : 'neutral'}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {m.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Material 360"
                            onClick={() => setViewingItem(m)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          {hasPermission('materials.update') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Edit Material"
                              onClick={() => handleOpenEdit(m)}
                            >
                              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                            </Button>
                          )}
                          {hasPermission('materials.delete') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Delete"
                              onClick={() => setDeleteItem(m)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </DataTableContainer>
        </div>

        {/* Mobile View - Cards List for Phones (< sm) */}
        <div className="block sm:hidden space-y-3">
          {paged.map((m, idx) => (
            <div key={m.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{m.material_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{m.material_name}</h4>
                  <span className="text-[11px] text-text-muted">{m.category_name}</span>
                </div>
                <Badge
                  variant={m.is_active !== false ? 'success' : 'neutral'}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none shrink-0"
                >
                  {m.is_active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Brand / Spec</span>
                  <span className="text-text-primary text-[11px] truncate block">{m.brand_preference || 'Standard'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Std Rate</span>
                  <span className="font-mono font-bold text-primary text-[12px]">₹{Number(m.standard_rate).toLocaleString('en-IN')} / {m.uom}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingItem(m)}>
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>
                {hasPermission('materials.update') && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEdit(m)}>
                    <Edit className="w-3.5 h-3.5 text-text-secondary" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={() => {}}
            />
          </div>
        </div>
      </div>

      {/* View Material 360 Modal */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{viewingItem.material_name}</h3>
                  <span className="text-[11px] font-mono text-text-muted">{viewingItem.material_code} • {viewingItem.category_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingItem(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Standard Unit Rate</span> <span className="font-bold text-primary font-mono text-sm">₹{Number(viewingItem.standard_rate).toLocaleString('en-IN')} / {viewingItem.uom}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">GST & HSN Code</span> <span className="font-mono text-text-primary">{viewingItem.hsn_code || '—'} ({viewingItem.gst_rate}% GST)</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Approved Brands</span> <span className="font-medium text-text-primary">{viewingItem.brand_preference || 'Open Standard'}</span></div>
                <div><span className="text-text-muted block text-[10px] uppercase font-bold">Catalogue Status</span> <span className="font-semibold text-emerald-600">{viewingItem.is_active !== false ? 'Active Master Item' : 'Inactive'}</span></div>
              </div>

              <div className="border border-border rounded-lg p-3 space-y-1">
                <span className="font-bold text-text-primary block text-[11px]">Technical Specification & Grade:</span>
                <p className="text-text-secondary bg-surface-muted/30 p-2 rounded border border-border/50">{viewingItem.specification || 'Standard Construction Grade Specification'}</p>
              </div>

              {viewingItem.description && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Application Scope & Notes:</span>
                  <p className="text-text-secondary">{viewingItem.description}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      <EntityEditModal
        isOpen={Boolean(isAddOpen || editingItem)}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
      >
        <EntityEditModal.Header
          icon={Package}
          title={editingItem ? 'Edit Material Item' : 'Add Material to Catalogue'}
          subtitle="Define master item specs, unit rates, HSN tax codes, and brand preferences."
          onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        />
        <form id="mat-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Material Master Details">
              <EntityEditModal.Grid>
                <FormField label="Material Code" required error={errors.material_code}>
                  <Input
                    value={form.material_code}
                    onChange={(e) => handleFormChange('material_code', e.target.value)}
                    placeholder="MAT-CEM-001"
                  />
                </FormField>

                <FormField label="Material Name" required error={errors.material_name}>
                  <Input
                    value={form.material_name}
                    onChange={(e) => handleFormChange('material_name', e.target.value)}
                    placeholder="e.g. OPC 53 Grade Cement"
                  />
                </FormField>

                <FormField label="Category" required>
                  <Select
                    options={[
                      { value: 'Cement & Binding Agents', label: 'Cement & Binding Agents' },
                      { value: 'Steel & Reinforcement', label: 'Steel & Reinforcement' },
                      { value: 'Sand & Aggregates', label: 'Sand & Aggregates' },
                      { value: 'Bricks & Masonry', label: 'Bricks & Masonry' },
                      { value: 'Paints & Finishes', label: 'Paints & Finishes' },
                      { value: 'Plumbing & Electrical', label: 'Plumbing & Electrical' },
                    ]}
                    value={form.category_name}
                    onChange={(v) => handleFormChange('category_name', v)}
                  />
                </FormField>

                <FormField label="Unit of Measurement (UOM)" required>
                  <Input
                    value={form.uom}
                    onChange={(e) => handleFormChange('uom', e.target.value)}
                    placeholder="Bags / MT / cum / Nos"
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            <EntityEditModal.Section title="Pricing, Tax & Specification">
              <EntityEditModal.Grid>
                <FormField label="Standard Rate (₹)">
                  <Input
                    type="number"
                    value={form.standard_rate}
                    onChange={(e) => handleFormChange('standard_rate', e.target.value)}
                  />
                </FormField>

                <FormField label="GST Rate (%)">
                  <Select
                    options={[
                      { value: '0', label: '0% (Exempt)' },
                      { value: '5', label: '5%' },
                      { value: '12', label: '12%' },
                      { value: '18', label: '18%' },
                      { value: '28', label: '28%' },
                    ]}
                    value={form.gst_rate}
                    onChange={(v) => handleFormChange('gst_rate', v)}
                  />
                </FormField>

                <FormField label="HSN Code">
                  <Input
                    value={form.hsn_code}
                    onChange={(e) => handleFormChange('hsn_code', e.target.value)}
                    placeholder="e.g. 252329"
                  />
                </FormField>

                <FormField label="Brand Preference">
                  <Input
                    value={form.brand_preference}
                    onChange={(e) => handleFormChange('brand_preference', e.target.value)}
                    placeholder="e.g. UltraTech / Tata Tiscon"
                  />
                </FormField>

                <FormField label="Specification / Grade" className="md:col-span-2">
                  <Input
                    value={form.specification}
                    onChange={(e) => handleFormChange('specification', e.target.value)}
                    placeholder="e.g. IS 12269 High Strength Grade"
                  />
                </FormField>

                <FormField label="Notes & Description" className="md:col-span-2">
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Application details, storage instructions..."
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>

          <EntityEditModal.Footer
            formId="mat-form"
            submitLabel={editingItem ? 'Update Material' : 'Add to Catalogue'}
            onCancel={() => { setIsAddOpen(false); setEditingItem(null); }}
            isSubmitting={saving}
          />
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Material Item"
        message={`Are you sure you want to delete "${deleteItem?.material_name}"?`}
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </PageContainer>
  );
}
