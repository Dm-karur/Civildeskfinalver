import { useState, useEffect, useMemo } from 'react';
import { Briefcase, Plus, Edit, Trash2, ShieldCheck, FileText, Eye, GripVertical } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { FormField } from '../../../components/composite/FormField';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { ConfirmDialog } from '../../../components/composite/ConfirmDialog';
import { toast } from '../../../components/composite/Toast';

const EMPTY_FORM = {
  type_code: '',
  type_name: '',
  description: '',
  is_active: '1',
};

// Initial mock data to give the user something to see
const INITIAL_DATA = [
  { id: 1, type_code: 'SUB-MAIS', type_name: 'Maistry', description: 'General labor contractor', is_active: 1 },
  { id: 2, type_code: 'SUB-CARP', type_name: 'Carpenter', description: 'Woodwork and formwork', is_active: 1 },
  { id: 3, type_code: 'SUB-CENT', type_name: 'Centering', description: 'Centering and scaffolding', is_active: 1 },
  { id: 4, type_code: 'SUB-BAR', type_name: 'Bar Bender', description: 'Steel reinforcement', is_active: 1 },
];

export function SubcontractorTypesPage() {
  const [types, setTypes] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_subcontractor_types');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  });

  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('mock_subcontractor_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Template Modal state
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    classification: 'Labour',
    description: '',
    trade_category: '',
    uom: 'shift',
    default_rate: '0.00',
    is_active: true,
    calculate_maistry: false
  });

  useEffect(() => {
    localStorage.setItem('mock_subcontractor_types', JSON.stringify(types));
  }, [types]);

  useEffect(() => {
    localStorage.setItem('mock_subcontractor_templates', JSON.stringify(templates));
  }, [templates]);

  // Form Handlers
  const handleOpenAdd = () => {
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      type_code: item.type_code || '',
      type_name: item.type_name || '',
      description: item.description || '',
      is_active: item.is_active ? '1' : '0',
    });
    setErrors({});
    setEditingItem(item);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.type_name.trim()) errs.type_name = 'Type Name is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      type_code: form.type_code || `SUB-${Math.floor(Math.random() * 10000)}`, // Fallback for local testing
      type_name: form.type_name.trim(),
      description: form.description.trim(),
      is_active: form.is_active === '1' ? 1 : 0,
    };

    if (editingItem?.id) {
      setTypes(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...payload } : t));
      toast.success('Subcontractor Type updated successfully.');
    } else {
      const newId = types.length > 0 ? Math.max(...types.map(t => t.id)) + 1 : 1;
      setTypes(prev => [{ id: newId, ...payload }, ...prev]);
      toast.success('Subcontractor Type created successfully.');
    }

    setIsAddOpen(false);
    setEditingItem(null);
  };

  const confirmDelete = () => {
    if (!deletingItem?.id) return;
    setTypes(prev => prev.filter(t => t.id !== deletingItem.id));
    toast.success('Subcontractor Type deleted successfully.');
    setDeletingItem(null);
  };

  // Template Form Handlers
  const handleOpenTemplate = (item) => {
    setSelectedType(item);
    setTemplateForm({
      classification: 'Labour',
      description: '',
      trade_category: item.type_name,
      uom: 'shift',
      default_rate: '0.00',
      is_active: true,
      calculate_maistry: false
    });
    setIsTemplateOpen(true);
  };

  const handleTemplateFormChange = (field, value) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateSubmit = (e) => {
    e.preventDefault();
    if (!templateForm.description.trim()) {
      toast.error('Item Description is required');
      return;
    }
    
    const newId = templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1;
    const newTemplate = {
      id: newId,
      type_id: selectedType.id,
      ...templateForm
    };
    setTemplates(prev => [...prev, newTemplate]);

    toast.success('Template item created successfully.');
    setIsTemplateOpen(false);
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const draggedId = Number(e.dataTransfer.getData('text/plain'));
    if (draggedId === targetId || !draggedId) return;

    setTemplates(prev => {
      const copy = [...prev];
      const dragIdx = copy.findIndex(t => t.id === draggedId);
      const dropIdx = copy.findIndex(t => t.id === targetId);
      
      if (dragIdx > -1 && dropIdx > -1) {
        const [draggedItem] = copy.splice(dragIdx, 1);
        copy.splice(dropIdx, 0, draggedItem);
      }
      return copy;
    });
  };

  // Safe Filtered List
  const filteredTypes = useMemo(() => {
    if (!searchQuery) return types;
    const lower = searchQuery.toLowerCase();
    return types.filter((t) =>
      (t.type_code || '').toLowerCase().includes(lower) ||
      (t.type_name || '').toLowerCase().includes(lower) ||
      (t.description || '').toLowerCase().includes(lower)
    );
  }, [types, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTypes.length / perPage));
  const pagedTypes = filteredTypes.slice((page - 1) * perPage, page * perPage);

  const activeCount = types.filter((t) => t.is_active).length;
  const totalCount = types.length;

  return (
    <PageContainer>
      <PageHeader
        title="Subcontractor Types"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Masters', href: '/masters/project-types' },
          { label: 'Subcontractor Types' },
        ]}
      />

      <div className="flex w-full flex-col gap-3 sm:gap-4">
        {/* KPI Ribbons */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 sm:gap-3">
          <KpiCard label="Total Types" value={totalCount} icon={<Briefcase />} status="info" />
          <KpiCard label="Active Types" value={activeCount} icon={<ShieldCheck className="text-emerald-500" />} status="success" />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-stretch justify-between gap-2.5 rounded-lg border border-border bg-surface p-2.5 shadow-xs sm:flex-row sm:items-center sm:p-3">
          <div className="w-full sm:w-64">
            <SearchField
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={handleOpenAdd}
            className="h-8 text-xs shadow-xs"
          >
            Add Subcontractor Type
          </Button>
        </div>

        {/* Desktop & Tablet Table (No horizontal scroll, 100% fluid) */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredTypes.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
              />
            }
          >
            <table className="w-full table-auto text-left text-[12px]">
              <thead className="border-b border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                <tr>
                  <th className="w-10 px-3 py-2 text-center">#</th>
                  <th className="w-32 px-3 py-2">Code</th>
                  <th className="px-3 py-2">Type Name</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="w-24 px-3 py-2 text-center">Status</th>
                  <th className="w-36 px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-[12px] text-text-muted">
                      Loading...
                    </td>
                  </tr>
                ) : pagedTypes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-[12px] text-text-muted">
                      No subcontractor types found.
                    </td>
                  </tr>
                ) : (
                  pagedTypes.map((item, idx) => (
                    <tr key={item.id} className="group transition-colors hover:bg-surface-muted/30">
                      <td className="px-3 py-2 text-center text-[11px] font-medium text-text-primary">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          {item.type_code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-text-primary text-[12px] truncate" title={item.type_name}>
                          {item.type_name}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="block truncate text-[11px] text-text-secondary" title={item.description}>
                          {item.description || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge 
                          variant={item.is_active ? 'success' : 'neutral'}
                          className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center"
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Templates"
                            onClick={() => setViewingItem(item)}
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Add Template Item"
                            onClick={() => handleOpenTemplate(item)}
                          >
                            <Plus className="h-4 w-4 text-emerald-500 hover:text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="h-3.5 w-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-text-secondary hover:text-red-500" />
                          </Button>
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
          {pagedTypes.map((item, idx) => (
            <div key={item.id} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{item.type_code}</span>
                  <h4 className="font-semibold text-text-primary text-[13px] leading-snug">{item.type_name}</h4>
                </div>
                <Badge 
                  variant={item.is_active ? 'success' : 'neutral'}
                  className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center"
                >
                  {item.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="text-xs pt-1 border-t border-border/60 text-text-secondary">
                <span className="block text-[10px] uppercase font-bold text-text-muted mb-1">Description</span>
                {item.description || 'No description provided'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-blue-600 border-blue-200 bg-blue-50" onClick={() => setViewingItem(item)}>
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-200 bg-emerald-50" onClick={() => handleOpenTemplate(item)}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(item)}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-red-500 hover:text-red-600 border-border" onClick={() => setDeletingItem(item)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {/* Mobile Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredTypes.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <EntityEditModal
        isOpen={isAddOpen || !!editingItem}
        onClose={() => {
          setIsAddOpen(false);
          setEditingItem(null);
        }}
      >
        <EntityEditModal.Header
          icon={Briefcase}
          title={editingItem ? 'Edit Subcontractor Type' : 'Add Subcontractor Type'}
          subtitle="Define subcontractor type categories and their specializations."
          onClose={() => {
            setIsAddOpen(false);
            setEditingItem(null);
          }}
        />
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Type Details">
              <EntityEditModal.Grid>
                <FormField label="Type Code" required>
                  <Input
                    value={editingItem ? form.type_code : 'Auto-generated'}
                    disabled
                    className="font-mono text-text-muted bg-surface-muted cursor-not-allowed"
                  />
                </FormField>
                <FormField label="Type Name" error={errors.type_name} required>
                  <Input
                    placeholder="e.g. Maistry, Carpenter"
                    value={form.type_name}
                    onChange={(e) => handleFormChange('type_name', e.target.value)}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Description">
                    <Textarea
                      placeholder="Enter detailed description..."
                      rows={2}
                      value={form.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                    />
                  </FormField>
                </div>

                <FormField label="Status" error={errors.is_active}>
                  <Select
                    options={[
                      { value: '1', label: 'Active' },
                      { value: '0', label: 'Inactive' },
                    ]}
                    value={form.is_active}
                    onChange={(value) => handleFormChange('is_active', value)}
                  />
                </FormField>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setEditingItem(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItem ? 'Save Changes' : 'Create Type'}
            </Button>
          </EntityEditModal.Footer>
        </form>
      </EntityEditModal>

      {/* View Templates Modal */}
      <EntityEditModal
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
      >
        <EntityEditModal.Header
          icon={Eye}
          title={`Templates for ${viewingItem?.type_name || ''}`}
          subtitle="View associated items (Machinery, Equipment, Labour, Expenses)."
          onClose={() => setViewingItem(null)}
        />
        <EntityEditModal.Body>
          <div className="space-y-4 p-1">
            {templates.filter(t => t.type_id === viewingItem?.id).length === 0 ? (
              <div className="text-center p-6 bg-surface-muted border border-border rounded-lg text-text-muted text-[13px]">
                No templates have been added yet for this type.
              </div>
            ) : (
              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden shadow-xs">
                {templates.filter(t => t.type_id === viewingItem?.id).map(t => (
                  <div 
                    key={t.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, t.id)}
                    className="p-3 bg-surface hover:bg-surface-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-move border-b border-border last:border-0"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="pt-0.5 text-border hover:text-text-secondary transition-colors hidden sm:block">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="neutral" className="text-[9px] uppercase tracking-wider font-bold">
                            {t.classification}
                          </Badge>
                          <span className="font-semibold text-text-primary text-[13px] truncate">
                            {t.description}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-text-secondary">
                          <span className="font-mono">
                            Rate: <span className="font-semibold text-text-primary">₹{t.default_rate}</span>/{t.uom}
                          </span>
                          {t.calculate_maistry && (
                            <span className="text-amber-700 font-sans font-medium text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Maistry Scope
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={t.is_active ? 'success' : 'neutral'} className="text-[9px] h-5 self-start sm:self-auto shrink-0">
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </EntityEditModal.Body>
        <EntityEditModal.Footer>
          <Button variant="outline" onClick={() => setViewingItem(null)}>
            Close
          </Button>
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => {
            handleOpenTemplate(viewingItem);
            setViewingItem(null);
          }}>
            Add Template Item
          </Button>
        </EntityEditModal.Footer>
      </EntityEditModal>

      {/* Add Template Item Modal */}
      <EntityEditModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
      >
        <EntityEditModal.Header
          icon={FileText}
          title="New Template Item"
          subtitle={`Add an item for ${selectedType?.type_name || ''}`}
          onClose={() => setIsTemplateOpen(false)}
        />
        <form onSubmit={handleTemplateSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Item Details">
              <EntityEditModal.Grid>
                <div className="sm:col-span-2">
                  <FormField label="Item Classification" required>
                    <Select
                      options={[
                        { value: 'Labour', label: 'Labour' },
                        { value: 'Equipment', label: 'Equipment / Machinery' },
                        { value: 'Expense', label: 'Expense' },
                      ]}
                      value={templateForm.classification}
                      onChange={(value) => handleTemplateFormChange('classification', value)}
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <FormField label="Item Description / Name" required>
                    <Input
                      placeholder="e.g. Carpenter, Scaffolding Pipe Set, Mixer"
                      value={templateForm.description}
                      onChange={(e) => handleTemplateFormChange('description', e.target.value)}
                    />
                  </FormField>
                </div>

                <div className="sm:col-span-2">
                  <FormField label="Trade Category">
                    <Input
                      value={templateForm.trade_category}
                      onChange={(e) => handleTemplateFormChange('trade_category', e.target.value)}
                      disabled
                      className="bg-surface-muted cursor-not-allowed"
                    />
                  </FormField>
                </div>

                <FormField label="Unit of Measure">
                  <Select
                    options={[
                      { value: 'Shift', label: 'Shift' },
                      { value: 'Hours', label: 'Hours' },
                      { value: 'Day', label: 'Day' }
                    ]}
                    placeholder="Select Unit..."
                    value={templateForm.uom}
                    onChange={(val) => handleTemplateFormChange('uom', val)}
                    className="w-full"
                  />
                </FormField>

                <FormField label="Default Rate (₹)">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={templateForm.default_rate}
                    onChange={(e) => handleTemplateFormChange('default_rate', e.target.value)}
                  />
                </FormField>
                
                <div className="sm:col-span-2 pt-2 border-t border-border mt-2 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer" 
                      checked={templateForm.is_active}
                      onChange={(e) => handleTemplateFormChange('is_active', e.target.checked)}
                    />
                    <span className="text-sm text-text-primary font-medium group-hover:text-primary transition-colors">
                      Active (Available in daily entry quick options)
                    </span>
                  </label>

                 
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTemplateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Item
            </Button>
          </EntityEditModal.Footer>
        </form>
      </EntityEditModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        title="Delete Subcontractor Type"
        message={`Are you sure you want to delete ${deletingItem?.type_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </PageContainer>
  );
}
