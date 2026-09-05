import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plus, Wallet, Search, CheckCircle2,
  MapPin, Clock, ArrowRight, ShieldCheck, UserCircle, Eye,
  FileText, Trash2, Tag, Calendar, ArrowLeft
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { SearchField } from '../../../components/composite/SearchField';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';

const MOCK_SITES = [
  { id: 1, site_code: 'GOW783', site_name: 'gowtham site 1', project_code: 'GOW-001', project_name: 'gowtham sweets', site_type: 'Main Site', location: 'Site Area', incharge: 'ram', status: 'PLANNED' },
  { id: 2, site_code: 'SITE-020', site_name: 'Gowtham Tea stall', project_code: 'GOW-001', project_name: 'gowtham sweets', site_type: 'Remote Site', location: 'Site Area', incharge: 'Assigned Lead', status: 'ACTIVE' },
  { id: 3, site_code: 'SITE-01', site_name: 'Greenfield Residency Main Site', project_code: 'PRJ-2026-001', project_name: 'Greenfield Residency - Phase 1', site_type: 'Main Site', location: 'Coimbatore, Tamil Nadu', incharge: 'Site Office', status: 'PLANNED' },
  { id: 4, site_code: 'SITE-081', site_name: 'Ajantha theater trichy', project_code: 'PR-2025-26', project_name: 'karur kulathupalayam', site_type: 'Phase Site', location: 'Site Area', incharge: 'Assigned Lead', status: 'ACTIVE' },
  { id: 5, site_code: 'SITE-021', site_name: 'Testing the site from add site', project_code: 'PR-2025-26', project_name: 'karur kulathupalayam', site_type: 'Remote Site', location: 'Site Area', incharge: 'Assigned Lead', status: 'CANCELLED' },
];

export function DailyWagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Add Wages Form State
  const [selectedSite, setSelectedSite] = useState(null);
  const [viewingSite, setViewingSite] = useState(null);
  const [subcontractors, setSubcontractors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');
  const [wageDate, setWageDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [wageEntries, setWageEntries] = useState({});
  const [wageRates, setWageRates] = useState({});
  const [wageRemarks, setWageRemarks] = useState({});
  const [globalRemarks, setGlobalRemarks] = useState('');
  const [customItems, setCustomItems] = useState([]);
  
  const [itemFilter, setItemFilter] = useState('All');
  const [itemSearch, setItemSearch] = useState('');

  const [dailyWagesList, setDailyWagesList] = useState([]); // Will hold data from backend/localstorage

  useEffect(() => {
    try {
      const subs = JSON.parse(localStorage.getItem('mock_subcontractors_master') || '[]');
      setSubcontractors(subs);
      const tmpl = JSON.parse(localStorage.getItem('mock_subcontractor_templates') || '[]');
      setTemplates(tmpl);
      const wages = JSON.parse(localStorage.getItem('mock_daily_wages') || '[]');
      setDailyWagesList(wages);
    } catch {
      setSubcontractors([]);
      setTemplates([]);
      setDailyWagesList([]);
    }
  }, []);

  const handleOpenWages = (site) => {
    setSelectedSite(site);
    setSelectedSubcontractorId('');
    setWageEntries({});
    setWageRates({});
    setWageRemarks({});
    setGlobalRemarks('');
    setCustomItems([]);
    setItemFilter('All');
    setItemSearch('');
    setWageDate(new Date().toISOString().split('T')[0]);
  };

  const handleCloseWages = () => {
    setSelectedSite(null);
  };

  const selectedSub = subcontractors.find(s => String(s.id) === String(selectedSubcontractorId));
  const availableTemplates = useMemo(() => {
    if (!selectedSub) return [];
    return templates.filter(t => String(t.type_id) === String(selectedSub.subcontractor_type_id) && t.is_active);
  }, [selectedSub, templates]);

  // Set default rates when subcontractor changes
  useEffect(() => {
    if (availableTemplates.length > 0) {
      const initialRates = {};
      availableTemplates.forEach(t => {
        initialRates[t.id] = t.default_rate;
      });
      setWageRates(prev => ({ ...prev, ...initialRates }));
    }
  }, [availableTemplates]);

  const handleAddCustomItem = () => {
    const newId = `custom-${Date.now()}`;
    setCustomItems(prev => [...prev, {
      id: newId,
      description: '',
      classification: 'Manpower',
      uom: 'shift',
      default_rate: 0,
      isCustom: true
    }]);
  };

  const handleCustomItemChange = (id, field, value) => {
    setCustomItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id, isCustom) => {
    if (isCustom) {
      setCustomItems(prev => prev.filter(item => item.id !== id));
    }
    setWageEntries(prev => { const next = {...prev}; delete next[id]; return next; });
    setWageRemarks(prev => { const next = {...prev}; delete next[id]; return next; });
    if (!isCustom) {
       // Reset rate to default
       const template = availableTemplates.find(t => t.id === id);
       if (template) {
         setWageRates(prev => ({ ...prev, [id]: template.default_rate }));
       }
    }
  };

  const allTemplates = useMemo(() => {
    return [...availableTemplates, ...customItems];
  }, [availableTemplates, customItems]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(itemSearch.toLowerCase());
      const matchesFilter = itemFilter === 'All' || 
                            (itemFilter === 'Expenses' && (t.classification === 'Expense' || t.classification === 'Expenses')) ||
                            t.classification === itemFilter;
      return matchesSearch && matchesFilter;
    });
  }, [allTemplates, itemSearch, itemFilter]);

  const filledItemsCount = useMemo(() => {
    return allTemplates.filter(t => Number(wageEntries[t.id]) > 0).length;
  }, [allTemplates, wageEntries]);

  const totalWages = useMemo(() => {
    return allTemplates.reduce((acc, t) => {
      const rate = wageRates[t.id] !== undefined && wageRates[t.id] !== '' 
        ? Number(wageRates[t.id]) 
        : Number(t.default_rate || 0);
      const shift = Number(wageEntries[t.id] || 0);
      return acc + (rate * shift);
    }, 0);
  }, [allTemplates, wageRates, wageEntries]);

  const handleSubmitWages = (e) => {
    e.preventDefault();
    if (!selectedSubcontractorId) {
      toast.error('Please select a subcontractor.');
      return;
    }

    if (filledItemsCount === 0) {
      toast.error('Please enter shifts for at least one item.');
      return;
    }

    try {
      const savedWages = JSON.parse(localStorage.getItem('mock_daily_wages') || '[]');
      const newEntry = {
        id: Date.now(),
        site_id: selectedSite.id,
        subcontractor_id: selectedSubcontractorId,
        date: wageDate,
        entries: wageEntries,
        rates: wageRates,
        remarks: wageRemarks,
        globalRemarks,
        customItems
      };
      const updatedWages = [...savedWages, newEntry];
      localStorage.setItem('mock_daily_wages', JSON.stringify(updatedWages));
      setDailyWagesList(updatedWages);

      toast.success('Daily wages submitted successfully.');
      handleCloseWages();
    } catch {
      toast.error('Failed to save daily wages.');
    }
  };

  const filteredSites = useMemo(() => {
    if (!searchQuery) return MOCK_SITES;
    const q = searchQuery.toLowerCase();
    return MOCK_SITES.filter(s =>
      s.site_name.toLowerCase().includes(q) ||
      s.site_code.toLowerCase().includes(q) ||
      s.project_name.toLowerCase().includes(q) ||
      s.project_code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSites.length / perPage));
  const pagedSites = filteredSites.slice((page - 1) * perPage, page * perPage);

  const getSiteWageStatus = (siteId) => {
    const today = new Date().toISOString().split('T')[0];
    const hasSubmittedToday = dailyWagesList.some(w => String(w.site_id) === String(siteId) && w.date === today);
    return hasSubmittedToday ? 'SUBMITTED' : 'PENDING';
  };

  const getStatusVariant = (status) => {
    return status === 'SUBMITTED' ? 'success' : 'warning';
  };

  if (viewingSite) {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntries = dailyWagesList.filter(w => String(w.site_id) === String(viewingSite.id) && w.date === today);

    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => setViewingSite(null)}
            className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">View Submitted Wages</h1>
            <p className="text-[13px] text-text-secondary">For {viewingSite.site_name} on {today}</p>
          </div>
        </div>

        {todaysEntries.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border shadow-sm p-8 text-center text-text-muted">
            No wages submitted for today yet.
          </div>
        ) : (
          <div className="space-y-6">
            {todaysEntries.map((entry, index) => {
              const sub = subcontractors.find(s => String(s.id) === String(entry.subcontractor_id));
              
              const allEntryItems = [];
              if (entry.entries) {
                Object.keys(entry.entries).forEach(itemId => {
                  if (!String(itemId).startsWith('custom-')) {
                    const t = templates.find(temp => String(temp.id) === String(itemId));
                    if (t) {
                      allEntryItems.push({
                        ...t,
                        shift: entry.entries[itemId],
                        rate: entry.rates?.[itemId] || 0,
                        remarks: entry.remarks?.[itemId] || ''
                      });
                    }
                  }
                });
              }
              if (entry.customItems) {
                entry.customItems.forEach(ci => {
                  if (entry.entries?.[ci.id]) {
                    allEntryItems.push({
                      ...ci,
                      shift: entry.entries[ci.id],
                      rate: entry.rates?.[ci.id] || 0,
                      remarks: entry.remarks?.[ci.id] || ''
                    });
                  }
                });
              }

              const entryTotal = allEntryItems.reduce((acc, item) => acc + (Number(item.shift) * Number(item.rate)), 0);

              return (
                <div key={entry.id || index} className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="bg-primary/5 p-4 border-b border-border flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-text-primary">{sub?.contractor_name || 'Unknown Subcontractor'}</h3>
                      <p className="text-[12px] text-text-secondary">{sub?.subcontractor_type_label || 'Trade'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] text-text-secondary font-medium">Total Wages</p>
                      <p className="font-bold text-primary">₹{entryTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                      <thead className="bg-surface-muted text-text-secondary text-[10px] uppercase font-bold border-b border-border">
                        <tr>
                          <th className="px-4 py-3">Item</th>
                          <th className="px-4 py-3 text-center">Type</th>
                          <th className="px-4 py-3 text-center">Unit</th>
                          <th className="px-4 py-3 text-center">Qty</th>
                          <th className="px-4 py-3 text-center">Rate (₹)</th>
                          <th className="px-4 py-3 text-center">Amount (₹)</th>
                          <th className="px-4 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {allEntryItems.map(item => {
                          const amount = Number(item.shift) * Number(item.rate);
                          const isExpense = item.classification === 'Expense' || item.classification === 'Expenses';
                          const isEquipment = item.classification === 'Equipment';
                          const badgeColors = isExpense ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                              isEquipment ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                              'bg-indigo-100 text-indigo-800 border-indigo-200';
                          return (
                            <tr key={item.id} className="hover:bg-surface-muted/30">
                              <td className="px-4 py-2.5 font-bold text-text-primary">{item.description}</td>
                              <td className="px-4 py-2.5 text-center">
                                <Badge className={`text-[9px] uppercase tracking-wider font-bold gap-1 py-0.5 px-2 ${badgeColors}`}>
                                  {item.classification}
                                </Badge>
                              </td>
                              <td className="px-4 py-2.5 text-center text-text-secondary">{item.uom}</td>
                              <td className="px-4 py-2.5 text-center font-bold">{item.shift}</td>
                              <td className="px-4 py-2.5 text-center">{Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-text-primary">
                                ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-2.5 text-text-secondary">{item.remarks || '—'}</td>
                            </tr>
                          );
                        })}
                        {allEntryItems.length === 0 && (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-text-muted text-[13px]">
                              No items recorded for this entry.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {entry.globalRemarks && (
                    <div className="p-4 border-t border-border bg-surface-muted/30">
                      <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-1">Overall Remarks</p>
                      <p className="text-[13px] text-text-primary">{entry.globalRemarks}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    );
  }

  if (selectedSite) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={handleCloseWages}
            className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Submit Daily Wages</h1>
            <p className="text-[13px] text-text-secondary">For {selectedSite.site_name}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm flex flex-col w-full mb-8">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-primary/5 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary shadow-sm border border-border">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">New Daily Entry</h2>
                <p className="text-[13px] text-text-secondary">Select subcontractor & date to auto-load trade items</p>
              </div>
            </div>
            <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1.5 px-3 py-1.5 shadow-sm font-bold">
              <Tag className="w-3.5 h-3.5" />
              {availableTemplates.length} items loaded
            </Badge>
          </div>

          <form onSubmit={handleSubmitWages} className="flex flex-col flex-1">
            <div className="p-4 sm:p-6 space-y-6">
              {/* Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="SUBCONTRACTOR" required>
                  <Select
                    leftIcon={<Search className="w-4 h-4 text-text-muted" />}
                    options={[
                      { value: '', label: 'Select a Subcontractor...' },
                      { value: 'search', label: '🔍 Search Subcontractor...' }, // BACKEND TEAM: Hook up search modal/logic here
                      // BACKEND TEAM: Map your subcontractor API response here
                      ...subcontractors.map(sub => ({
                        value: String(sub.id),
                        label: `${sub.contractor_name} (${sub.subcontractor_type_label || 'Unknown'})`
                      }))
                    ]}
                    value={selectedSubcontractorId}
                    onChange={(val) => {
                      if (val === 'search') {
                        // TODO: Open a search modal or implement searchable dropdown logic
                        toast.info('Search functionality will be implemented by backend team');
                      } else {
                        setSelectedSubcontractorId(val);
                      }
                    }}
                    className="w-full"
                  />
                </FormField>
                <FormField label="LOG DATE" required>
                  <div className="relative">
                    <Input
                      type="date"
                      value={wageDate}
                      onChange={(e) => setWageDate(e.target.value)}
                      className="w-full pl-10 h-11 border-2 focus:border-primary font-medium"
                    />
                    <Calendar className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </FormField>
              </div>
              
              {selectedSubcontractorId && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3.5 flex items-center gap-2.5 text-[13px] text-primary shadow-sm">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                  <span className="font-semibold">Trade: {selectedSub?.subcontractor_type_label}</span>
                  <span className="text-primary/70 px-1">•</span>
                  <span className="font-medium">{availableTemplates.length} trade items auto-loaded</span>
                </div>
              )}

              {/* Filters & Table section */}
              {selectedSubcontractorId && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="w-full lg:w-96">
                      <SearchField
                        placeholder="Filter loaded items (e.g. Mason, Tea)..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="border border-border rounded-xl overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-[12px] table-fixed">
                      <thead className="bg-surface-muted text-text-secondary text-[10px] uppercase font-bold border-b border-border tracking-wider">
                        <tr>
                          <th className="px-2 py-3.5 w-10 text-center">#</th>
                          <th className="px-2 py-3.5 w-[18%]">ITEM</th>
                          <th className="px-2 py-3.5 w-[12%] text-center">TYPE</th>
                          <th className="px-2 py-3.5 w-[8%] text-center">UNIT</th>
                          <th className="px-2 py-3.5 w-[14%] text-center">QTY</th>
                          <th className="px-2 py-3.5 w-[14%] text-center">RATE (₹)</th>
                          <th className="px-2 py-3.5 w-[14%] text-center">AMOUNT (₹)</th>
                          <th className="px-2 py-3.5 w-[16%]">REMARKS</th>
                          <th className="px-2 py-3.5 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface">
                        {filteredTemplates.length === 0 ? (
                          <tr>
                            <td colSpan="9" className="px-4 py-8 text-center text-text-muted text-[13px]">
                              No items found.
                            </td>
                          </tr>
                        ) : (
                          filteredTemplates.map((t, idx) => {
                            const qty = Number(wageEntries[t.id] || 0);
                            const rate = Number(wageRates[t.id] !== undefined ? wageRates[t.id] : (t.default_rate || 0));
                            const amount = qty * rate;
                            const isExpense = t.classification === 'Expense' || t.classification === 'Expenses';
                            const isEquipment = t.classification === 'Equipment';
                            const badgeColors = isExpense ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                isEquipment ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                'bg-indigo-100 text-indigo-800 border-indigo-200';
                            
                            return (
                              <tr key={t.id} className="hover:bg-surface-muted/30 transition-colors group">
                                <td className="px-2 py-3 text-center font-medium text-text-secondary">{idx + 1}</td>
                                <td className="px-2 py-3 font-bold text-text-primary text-[13px]">
                                  {t.isCustom ? (
                                    <Input 
                                      value={t.description} 
                                      onChange={(e) => handleCustomItemChange(t.id, 'description', e.target.value)}
                                      className="h-8 text-[12px] font-bold w-full"
                                      placeholder="Item Name"
                                    />
                                  ) : t.description}
                                </td>
                                <td className="px-2 py-3 text-center align-middle">
                                  {t.isCustom ? (
                                     <Select 
                                       value={t.classification}
                                       onChange={(val) => handleCustomItemChange(t.id, 'classification', val)}
                                       options={[
                                         {value: 'Manpower', label: 'Manpower'},
                                         {value: 'Equipment', label: 'Equipment'},
                                         {value: 'Expense', label: 'Expense'}
                                       ]}
                                       className="h-8 text-[11px] w-full"
                                     />
                                  ) : (
                                    <Badge className={`text-[9px] uppercase tracking-wider font-bold gap-1 py-0.5 px-2 ${badgeColors}`}>
                                      {isExpense ? <Wallet className="w-3 h-3" /> : (isEquipment ? <Building2 className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />)}
                                      {t.classification}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-2 py-3 text-center text-text-secondary font-medium">
                                  {t.isCustom ? (
                                    <Input 
                                      value={t.uom} 
                                      onChange={(e) => handleCustomItemChange(t.id, 'uom', e.target.value)}
                                      className="h-8 text-[12px] text-center w-full"
                                    />
                                  ) : t.uom}
                                </td>
                                <td className="px-2 py-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    className="h-8 text-center font-bold"
                                    value={wageEntries[t.id] || ''}
                                    onChange={(e) => setWageEntries(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    className="h-8 text-center font-medium"
                                    value={wageRates[t.id] !== undefined ? wageRates[t.id] : (t.default_rate || '')}
                                    onChange={(e) => setWageRates(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-3 text-center font-bold text-[14px] text-text-primary">
                                  ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-2 py-3">
                                  <Input
                                    className="h-8 text-[12px]"
                                    placeholder="—"
                                    value={wageRemarks[t.id] || ''}
                                    onChange={(e) => setWageRemarks(prev => ({ ...prev, [t.id]: e.target.value }))}
                                  />
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveItem(t.id, t.isCustom)}
                                    className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-50 group-hover:opacity-100"
                                    title="Clear / Remove"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot className="bg-surface-muted border-t-2 border-border">
                        <tr>
                          <td colSpan="6" className="px-4 py-4 text-right font-extrabold text-[12px] text-text-primary tracking-wider">
                            GRAND TOTAL ({filledItemsCount} ITEMS FILLED)
                          </td>
                          <td className="px-4 py-4 text-center font-black text-[16px] text-emerald-600">
                            ₹{totalWages.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <div className="pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleAddCustomItem} className="gap-2 text-primary border-primary/30 hover:bg-primary/5 font-semibold shadow-sm">
                      <Plus className="w-4 h-4" />
                      Add Custom Item
                    </Button>
                  </div>
                  
                  <div className="pt-4">
                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                      REMARKS (OPTIONAL)
                    </label>
                    <textarea 
                      className="w-full min-h-[80px] rounded-lg border border-border bg-surface p-3.5 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y shadow-sm"
                      placeholder="Any additional site notes for the day..."
                      value={globalRemarks}
                      onChange={(e) => setGlobalRemarks(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="mt-auto border-t border-border bg-surface-muted/30 px-4 sm:px-6 py-4 flex items-center justify-between rounded-b-xl">
              <div className="text-[13px] font-semibold text-text-secondary">
                <span className="text-text-primary font-bold">{filledItemsCount}</span> of {allTemplates.length} items logged
              </div>
              <div className="flex gap-3">
                 <Button type="button" variant="outline" onClick={handleCloseWages} className="font-semibold px-6">
                   Cancel
                 </Button>
                 <Button 
                   type="submit" 
                   variant="primary" 
                   className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 shadow-md"
                   disabled={!selectedSubcontractorId || filledItemsCount === 0}
                 >
                   Submit Daily Log
                 </Button>
              </div>
            </div>
          </form>
        </div>
      </PageContainer>
    );
  }

  // Original list view rendering
  return (
    <PageContainer>
      <PageHeader
        title="Daily Wages"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Labour & Attendance', href: '/labour' },
          { label: 'Daily Wages' }
        ]}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="w-full sm:w-72">
            <SearchField
              placeholder="Search by site or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="hidden sm:block">
          <DataTableContainer
            pagination={
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredSites.length}
                itemsPerPage={perPage}
                onPageChange={setPage}
              />
            }
          >
            <table className="w-full text-left text-[12px] table-auto">
              <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5">Site Details</th>
                  <th className="px-3 py-2.5">Associated Project</th>
                  <th className="px-3 py-2.5">Site Type</th>
                  <th className="px-3 py-2.5">Location & City</th>
                  <th className="px-3 py-2.5">Site Incharge</th>
                  <th className="px-3 py-2.5 text-center w-28">Wages Status</th>
                  <th className="px-3 py-2.5 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedSites.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No sites found.
                    </td>
                  </tr>
                ) : (
                  pagedSites.map((site, idx) => (
                    <tr key={site.id} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2.5 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text-primary text-[13px] leading-tight truncate">
                            {site.site_name}
                          </span>
                          <span className="font-mono text-[10px] text-text-muted">
                            {site.site_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="text-text-primary text-[12px] truncate">
                            {site.project_name}
                          </span>
                          <span className="font-mono text-[10px] text-text-muted">
                            {site.project_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="neutral" className="text-[10px] h-5">
                          {site.site_type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-text-secondary truncate">
                        {site.location}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-text-secondary truncate">
                        {site.incharge}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          variant={getStatusVariant(getSiteWageStatus(site.id))}
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {getSiteWageStatus(site.id)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {getSiteWageStatus(site.id) === 'SUBMITTED' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setViewingSite(site)} 
                              className="text-primary hover:bg-primary/10 h-7 w-7"
                              title="View Submitted Wages"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-7 text-[11px] px-3 font-semibold"
                            onClick={() => handleOpenWages(site)}
                          >
                            Add Wages
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
        <div className="block sm:hidden space-y-3 mt-2">
          {pagedSites.map((site, idx) => (
            <div key={site.id} className="bg-surface border border-border rounded-xl p-3.5 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                      {site.site_code}
                    </span>
                    <span className="text-[11px] text-text-muted truncate">
                      {site.project_name}
                    </span>
                  </div>
                  <h4 className="font-semibold text-text-primary text-[15px] leading-tight truncate">
                    {site.site_name}
                  </h4>
                </div>
                <Badge
                  variant={getStatusVariant(getSiteWageStatus(site.id))}
                  className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center shrink-0"
                >
                  {getSiteWageStatus(site.id)}
                </Badge>
              </div>

              <div className="flex items-center text-[12px] text-text-secondary gap-3 bg-surface-muted/50 p-2 rounded-lg border border-border/50">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                  <span className="truncate">{site.location}</span>
                </div>
                <div className="w-px h-3.5 bg-border shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <UserCircle className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                  <span className="truncate">{site.incharge}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getSiteWageStatus(site.id) === 'SUBMITTED' && (
                  <Button 
                    variant="outline" 
                    className="h-10 px-3 text-primary border-primary/20 shadow-xs"
                    onClick={() => setViewingSite(site)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant={getSiteWageStatus(site.id) === 'SUBMITTED' ? 'outline' : 'primary'}
                  className="flex-1 h-10 text-[13px] font-semibold rounded-lg shadow-xs"
                  onClick={() => handleOpenWages(site)}
                >
                  Add Wages
                </Button>
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredSites.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
