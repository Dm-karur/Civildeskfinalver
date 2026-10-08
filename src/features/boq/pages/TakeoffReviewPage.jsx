import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileCheck, ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock,
  ArrowRight, Search, FileText, Plus, Link as LinkIcon
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
import { toast } from '../../../components/composite/Toast';
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
import { FormField } from '../../../components/composite/FormField';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { drawingTakeoffApi, boqApi } from '../../../api/apiservice';

const extractArray = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  if (res?.data?.boq_items && Array.isArray(res.data.boq_items)) return res.data.boq_items;
  if (res?.data?.items && Array.isArray(res.data.items)) return res.data.items;
  if (res?.boq_items && Array.isArray(res.boq_items)) return res.boq_items;
  if (res?.items && Array.isArray(res.items)) return res.items;
  return [];
};

export function TakeoffReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get('job_id') || '1';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Add Item State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    item_code: '',
    description: '',
    quantity: '',
    unit: 'SqM'
  });
  const [boqs, setBoqs] = useState([]);
  const [selectedBoqId, setSelectedBoqId] = useState('');
  const [boqItems, setBoqItems] = useState([]);
  const [selectedBoqItemId, setSelectedBoqItemId] = useState('');

  // Map Item State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapItem, setMapItem] = useState(null);
  const [mapSaving, setMapSaving] = useState(false);
  const [mapBoqId, setMapBoqId] = useState('');
  const [mapBoqItemId, setMapBoqItemId] = useState('');
  const [mapBoqItemsList, setMapBoqItemsList] = useState([]);

  // Fetch BOQs when either modal opens
  useEffect(() => {
    if ((isAddOpen || isMapOpen) && boqs.length === 0) {
      boqApi.list().then(res => {
        const list = extractArray(res?.data?.boqs || res?.boqs || res);
        setBoqs(list);
      }).catch(err => console.error("Failed to load BOQs", err));
    }
  }, [isAddOpen, isMapOpen, boqs.length]);

  // Fetch BOQ Items for Add Modal
  useEffect(() => {
    if (selectedBoqId) {
      boqApi.items.list(selectedBoqId).then(res => {
        setBoqItems(extractArray(res));
      }).catch(err => console.error("Failed to load BOQ items", err));
    } else {
      setBoqItems([]);
      setSelectedBoqItemId('');
    }
  }, [selectedBoqId]);

  // Fetch BOQ Items for Map Modal
  useEffect(() => {
    if (mapBoqId) {
      boqApi.items.list(mapBoqId).then(res => {
        setMapBoqItemsList(extractArray(res));
      }).catch(err => console.error("Failed to load BOQ items", err));
    } else {
      setMapBoqItemsList([]);
      setMapBoqItemId('');
    }
  }, [mapBoqId]);

  const handleBoqItemSelect = (itemId) => {
    setSelectedBoqItemId(itemId);
    const selectedItem = boqItems.find(i => String(i.id) === String(itemId));
    if (selectedItem) {
      setForm(prev => ({
        ...prev,
        item_code: selectedItem.item_code || '',
        description: selectedItem.description || selectedItem.name || '',
        unit: selectedItem.unit || selectedItem.unit_name || prev.unit
      }));
    }
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await drawingTakeoffApi.items.list(jobId);
      setItems(extractArray(res));
    } catch (err) {
      console.error('Failed to load takeoff items:', err);
      toast.error('Failed to load takeoff items.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.item_code || !form.description || !form.quantity) {
      toast.error("Please fill required fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        boq_id: selectedBoqId || null, 
        boq_item_id: selectedBoqItemId || null,
        target_boq_item_id: selectedBoqItemId || null
      };
      const res = await drawingTakeoffApi.items.create(jobId, payload);
      
      const newItemId = res?.data?.item?.id || res?.data?.id || res?.id;
      
      if (newItemId && selectedBoqItemId) {
        try {
          await drawingTakeoffApi.items.map(jobId, newItemId, { 
            boq_id: selectedBoqId, 
            boq_item_id: selectedBoqItemId,
            target_boq_item_id: selectedBoqItemId
          });
        } catch(mapErr) {
          console.warn("Dedicated map call failed", mapErr);
        }
      }

      toast.success("Takeoff item added successfully.");
      setIsAddOpen(false);
      setForm({ item_code: '', description: '', quantity: '', unit: 'SqM' });
      setSelectedBoqId('');
      setSelectedBoqItemId('');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item.");
    } finally {
      setSaving(false);
    }
  };

  const handleMapSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!mapBoqId) {
      toast.error("Please select a Target BOQ.");
      return;
    }
    setMapSaving(true);
    try {
      await drawingTakeoffApi.items.map(jobId, mapItem.id, {
        boq_id: mapBoqId,
        boq_item_id: mapBoqItemId || null,
        target_boq_item_id: mapBoqItemId || null
      });
      toast.success("Item successfully mapped!");
      setIsMapOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to map item.");
    } finally {
      setMapSaving(false);
    }
  };

  const handleApprove = async (itemId) => {
    try {
      await drawingTakeoffApi.items.approve(jobId, itemId, { status: 'approved' });
      toast.success('Takeoff item approved.');
      fetchItems();
    } catch (err) {
      toast.error('Failed to approve item. Ensure it is mapped first.');
    }
  };

  const handleReject = async (itemId) => {
    try {
      await drawingTakeoffApi.items.reject(jobId, itemId);
      toast.success('Takeoff item rejected.');
      fetchItems();
    } catch (err) {
      toast.error('Failed to reject item.');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = search.toLowerCase();
      const code = String(item.item_code || `ITEM-${item.id}`).toLowerCase();
      const desc = String(item.description || item.name || '').toLowerCase();
      const matchesSearch = code.includes(q) || desc.includes(q);
      const matchesStatus = selectedStatus === 'all' || String(item.status || 'Pending').toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [items, search, selectedStatus]);

  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const pagedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [filteredItems, page, perPage]);

  const approvedCount = useMemo(() => items.filter(i => String(i.status).toLowerCase() === 'approved').length, [items]);
  const pendingCount = useMemo(() => items.filter(i => !i.status || String(i.status).toLowerCase() === 'pending').length, [items]);
  const rejectedCount = useMemo(() => items.filter(i => String(i.status).toLowerCase() === 'rejected').length, [items]);

  return (
    <PageContainer className="space-y-4 font-sans text-xs pb-10">
      <PageHeader
        title={`Takeoff Item Review (Job #${jobId})`}
        subtitle="Inspect extracted drawing items, map to BOQ, and approve quantities"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'BOQ & Budget', href: '#' },
          { label: 'Drawing Takeoff', href: '/takeoff' },
          { label: `Review Job #${jobId}` }
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Extracted Items" value={items.length} status="info" icon={<FileCheck className="w-4 h-4 text-sky-500" />} />
        <KpiCard label="Approved Items" value={approvedCount} status="success" icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
        <KpiCard label="Pending Review" value={pendingCount} status="warning" icon={<Clock className="w-4 h-4 text-amber-500" />} />
        <KpiCard label="Rejected / Excluded" value={rejectedCount} status="neutral" icon={<XCircle className="w-4 h-4 text-rose-500" />} />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="w-full sm:w-64">
            <SearchField placeholder="Search item code, description..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={selectedStatus}
              onChange={(val) => { setSelectedStatus(val); setPage(1); }}
              className="text-xs h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => navigate('/takeoff')} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />} className="text-xs h-8">Back to Takeoffs</Button>
          <Button variant="outline" size="sm" onClick={fetchItems} className="text-xs h-8 gap-1.5"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
          <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />} className="text-xs h-8 text-primary border-primary/20 hover:bg-primary/5">Add Item</Button>
          <Button variant="primary" size="sm" onClick={() => navigate(`/takeoff/convert?job_id=${jobId}`)} leftIcon={<ArrowRight className="w-3.5 h-3.5" />} className="text-xs h-8 shadow-xs">Convert to BOQ</Button>
        </div>
      </div>

      <div className="hidden sm:block">
        <DataTableContainer pagination={<Pagination currentPage={page} totalPages={totalPages} totalItems={filteredItems.length} itemsPerPage={perPage} onPageChange={setPage} onItemsPerPageChange={() => {}} />}>
          <table className="w-full text-left text-[12px] table-auto">
            <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
              <tr>
                <th className="px-3 py-2 w-10 text-center">#</th>
                <th className="px-3 py-2 w-32">Item Code</th>
                <th className="px-3 py-2">Description & Specifications</th>
                <th className="px-3 py-2 text-right w-32">Extracted Qty</th>
                <th className="px-3 py-2 text-center w-28">Status</th>
                <th className="px-3 py-2 text-right w-64">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-text-muted text-[12px]">Loading takeoff items...</td></tr>
              ) : pagedItems.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-text-muted text-[12px]">No takeoff items found for Job #{jobId}.</td></tr>
              ) : (
                pagedItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-3 py-2 text-center text-text-muted text-[11px]">{(page - 1) * perPage + idx + 1}</td>
                    <td className="px-3 py-2 font-mono text-[11px] font-semibold text-primary">
                      {item.item_code || `ITEM-${item.id}`}
                      {item.boq_item_id && <Badge variant="info" className="ml-2 text-[8px]">Mapped</Badge>}
                    </td>
                    <td className="px-3 py-2 font-semibold text-text-primary text-[12px]">{item.description || item.name}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-text-primary text-[12px]">{Number(item.quantity || 0).toLocaleString()} {item.unit || 'SqM'}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={String(item.status).toLowerCase() === 'approved' ? 'success' : String(item.status).toLowerCase() === 'rejected' ? 'neutral' : 'warning'} className="text-[8px] px-1.5 py-0.5">
                        {item.status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { setMapItem(item); setIsMapOpen(true); }}><LinkIcon className="w-3 h-3 mr-1" /> Map</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleApprove(item.id)}><CheckCircle2 className="w-3 h-3 mr-1" /> Approve</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => handleReject(item.id)}><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTableContainer>
      </div>

      <div className="sm:hidden space-y-3">
        {loading ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">Loading takeoff items...</div>
        ) : pagedItems.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-xs bg-surface border border-border rounded-lg">No takeoff items found.</div>
        ) : (
          pagedItems.map((item) => (
            <div key={item.id} className="bg-surface border border-border rounded-lg p-3 space-y-2.5 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] text-primary font-bold">{item.item_code || `ITEM-${item.id}`}</span>
                  <h4 className="font-bold text-text-primary text-xs">{item.description || item.name}</h4>
                </div>
                <Badge variant={String(item.status).toLowerCase() === 'approved' ? 'success' : String(item.status).toLowerCase() === 'rejected' ? 'neutral' : 'warning'} className="text-[8px] px-1.5 py-0.5">
                  {item.status || 'Pending'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Extracted Qty</span>
                  <span className="font-mono font-bold text-text-primary text-[11px]">{Number(item.quantity || 0).toLocaleString()} {item.unit || 'SqM'}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/60 text-xs">
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-blue-600" onClick={() => { setMapItem(item); setIsMapOpen(true); }}><LinkIcon className="w-3 h-3 mr-1" /> Map</Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-emerald-600" onClick={() => handleApprove(item.id)}><CheckCircle2 className="w-3 h-3 mr-1" /> Approve</Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-rose-600" onClick={() => handleReject(item.id)}><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAddOpen && (
        <EntityEditModal isOpen={true} onClose={() => setIsAddOpen(false)}>
          <EntityEditModal.Header icon={FileText} title="Add Takeoff Item" subtitle="Select a target BOQ item to auto-fill details, or enter them manually." onClose={() => setIsAddOpen(false)} />
          <form id="add-item-form" onSubmit={handleAddSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EntityEditModal.Body>
              <EntityEditModal.Section title="BOQ Mapping (Optional)">
                <EntityEditModal.Grid>
                  <FormField label="Target BOQ" className="md:col-span-2">
                    <Select 
                      options={[{ value: '', label: 'Select BOQ (Optional)' }, ...boqs.map(b => ({ value: String(b.id), label: `${b.boq_code ? `[${b.boq_code}] ` : ''}${b.title || b.name || `BOQ #${b.id}`}` }))]}
                      value={selectedBoqId}
                      onChange={setSelectedBoqId}
                    />
                  </FormField>
                  {selectedBoqId && (
                    <FormField label="Select BOQ Item to Map" className="md:col-span-2">
                      <Select 
                        options={[{ value: '', label: 'Select Item to auto-fill...' }, ...boqItems.map(i => ({ value: String(i.id), label: `${i.item_code} - ${i.description || i.name}` }))]}
                        value={selectedBoqItemId}
                        onChange={handleBoqItemSelect}
                      />
                    </FormField>
                  )}
                </EntityEditModal.Grid>
              </EntityEditModal.Section>
              <EntityEditModal.Section title="Measurement Details">
                <EntityEditModal.Grid>
                  <FormField label="Item Code" required><Input value={form.item_code} onChange={e => setForm(prev => ({ ...prev, item_code: e.target.value }))} placeholder="e.g. STR-001" /></FormField>
                  <FormField label="Unit" required><Input value={form.unit} onChange={e => setForm(prev => ({ ...prev, unit: e.target.value }))} placeholder="e.g. SqM, CuM, RM" /></FormField>
                  <FormField label="Quantity" className="md:col-span-2" required><Input type="number" step="any" value={form.quantity} onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))} placeholder="Extracted measurement quantity" /></FormField>
                  <FormField label="Description" className="md:col-span-2" required><Textarea rows={3} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Detailed description and specifications..." /></FormField>
                </EntityEditModal.Grid>
              </EntityEditModal.Section>
            </EntityEditModal.Body>
            <EntityEditModal.Footer formId="add-item-form" submitLabel="Add Item" onCancel={() => setIsAddOpen(false)} isSubmitting={saving} />
          </form>
        </EntityEditModal>
      )}

      {isMapOpen && mapItem && (
        <EntityEditModal isOpen={true} onClose={() => setIsMapOpen(false)}>
          <EntityEditModal.Header icon={LinkIcon} title="Map Item to BOQ" subtitle={`Link takeoff item ${mapItem.item_code} to a BOQ.`} onClose={() => setIsMapOpen(false)} />
          <form id="map-item-form" onSubmit={handleMapSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EntityEditModal.Body>
              <EntityEditModal.Section title="Select BOQ Target">
                <EntityEditModal.Grid>
                  <FormField label="Target BOQ" required className="md:col-span-2">
                    <Select 
                      options={[{ value: '', label: 'Select Target BOQ' }, ...boqs.map(b => ({ value: String(b.id), label: `${b.boq_code ? `[${b.boq_code}] ` : ''}${b.title || b.name || `BOQ #${b.id}`}` }))]}
                      value={mapBoqId}
                      onChange={setMapBoqId}
                    />
                  </FormField>
                  {mapBoqId && (
                    <FormField label="Target BOQ Item (Optional)" className="md:col-span-2">
                      <Select 
                        options={[
                          { value: '', label: 'None (Create as New Item during conversion)' }, 
                          ...mapBoqItemsList.map(i => ({ value: String(i.id), label: `${i.item_code} - ${i.description || i.name}` }))
                        ]}
                        value={mapBoqItemId}
                        onChange={setMapBoqItemId}
                      />
                    </FormField>
                  )}
                  {mapBoqId && (
                    <div className="md:col-span-2 pt-2 flex items-center justify-between text-xs">
                      <span className="text-text-muted">Not seeing a recently created item?</span>
                      <Button variant="outline" size="sm" type="button" onClick={() => {
                        boqApi.items.list(mapBoqId).then(res => setMapBoqItemsList(extractArray(res)));
                      }}>Refresh BOQ Items</Button>
                    </div>
                  )}
                </EntityEditModal.Grid>
              </EntityEditModal.Section>
            </EntityEditModal.Body>
            <EntityEditModal.Footer formId="map-item-form" submitLabel="Confirm Mapping" onCancel={() => setIsMapOpen(false)} isSubmitting={mapSaving} />
          </form>
        </EntityEditModal>
      )}
    </PageContainer>
  );
}

export default TakeoffReviewPage;
