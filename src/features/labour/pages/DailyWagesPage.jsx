import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Plus, Wallet, Search, CheckCircle2,
  MapPin, Clock, ArrowRight, ShieldCheck, UserCircle
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
import { EntityEditModal } from '../../../components/composite/EntityEditModal';
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

  // Add Wages Modal State
  const [selectedSite, setSelectedSite] = useState(null);
  const [subcontractors, setSubcontractors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');
  const [wageDate, setWageDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [wageEntries, setWageEntries] = useState({});
  const [dailyWagesList, setDailyWagesList] = useState([]); // Will hold data from backend/localstorage

  useEffect(() => {
    try {
      // Future API calls would go here (e.g. await api.getSubcontractors())
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

  const handleSubmitWages = (e) => {
    e.preventDefault();
    if (!selectedSubcontractorId) {
      toast.error('Please select a subcontractor.');
      return;
    }

    const hasEntries = Object.values(wageEntries).some(val => Number(val) > 0);
    if (!hasEntries) {
      toast.error('Please enter shifts for at least one item.');
      return;
    }

    try {
      // Future API call: await api.submitDailyWages(newEntry)
      const savedWages = JSON.parse(localStorage.getItem('mock_daily_wages') || '[]');
      const newEntry = {
        id: Date.now(),
        site_id: selectedSite.id,
        subcontractor_id: selectedSubcontractorId,
        date: wageDate,
        entries: wageEntries
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
    // Check if there are any submitted wages for this site. 
    // In a real API, the backend might just return { ..., wage_status: 'SUBMITTED' }
    const hasSubmitted = dailyWagesList.some(w => String(w.site_id) === String(siteId));
    return hasSubmitted ? 'SUBMITTED' : 'PENDING';
  };

  const getStatusVariant = (status) => {
    return status === 'SUBMITTED' ? 'success' : 'warning';
  };

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
                        <Button
                          variant="primary"
                          onClick={() => handleOpenWages(site)}
                          className="h-6 text-[12px] px-1.5 shadow-sm font-medium"
                        >
                          Add Wages
                        </Button>
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
          {pagedSites.map((site, idx) => (
            <div key={site.id} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-primary block">{site.site_code}</span>
                  <h4 className="font-semibold text-text-primary text-[14px] leading-snug">{site.site_name}</h4>
                  <span className="text-[11px] text-text-muted block mt-0.5">{site.project_name}</span>
                </div>
                <Badge
                  variant={getStatusVariant(getSiteWageStatus(site.id))}
                  className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                >
                  {getSiteWageStatus(site.id)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                <div className="flex items-center text-text-secondary gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{site.location}</span>
                </div>
                <div className="flex items-center text-text-secondary gap-1.5 justify-end">
                  <UserCircle className="w-3.5 h-3.5" />
                  <span className="truncate">{site.incharge}</span>
                </div>
              </div>

              <div className="pt-2.5">
                <Button
                  variant="primary"
                  className="w-full h-9 text-[13px] font-medium"
                  onClick={() => handleOpenWages(site)}
                >
                  Add Daily Wages
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

      {/* Add Wages Modal */}
      <EntityEditModal
        isOpen={Boolean(selectedSite)}
        onClose={handleCloseWages}
      >
        <EntityEditModal.Header
          icon={Wallet}
          title="Submit Daily Wages"
          subtitle={`Enter shift details for ${selectedSite?.site_name}`}
          onClose={handleCloseWages}
        />
        <form onSubmit={handleSubmitWages} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EntityEditModal.Body>
            <EntityEditModal.Section title="Wage Details">
              <EntityEditModal.Grid>
                <FormField label="Date" required>
                  <Input
                    type="date"
                    value={wageDate}
                    onChange={(e) => setWageDate(e.target.value)}
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="Select Subcontractor" required>
                    <Select
                      options={[
                        { value: '', label: 'Select a subcontractor...' },
                        ...subcontractors.map(sub => ({
                          value: String(sub.id),
                          label: `${sub.contractor_name} (${sub.specialization})`
                        }))
                      ]}
                      value={selectedSubcontractorId}
                      onChange={setSelectedSubcontractorId}
                    />
                  </FormField>
                </div>
              </EntityEditModal.Grid>
            </EntityEditModal.Section>

            {selectedSubcontractorId && (
              <div className="px-4 pb-4">
                {availableTemplates.length === 0 ? (
                  <div className="text-center p-6 bg-surface-muted border border-border rounded-lg text-text-muted text-[13px]">
                    No active templates found for this subcontractor type.
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden shadow-xs">
                    <div className="bg-surface-muted border-b border-border px-4 py-2.5 font-bold text-text-primary text-[11px] uppercase tracking-wider flex justify-between items-center">
                      <span>Template Items</span>
                      <span className="text-center w-24">Add Shift</span>
                    </div>
                    <div className="divide-y divide-border">
                      {availableTemplates.map(t => (
                        <div key={t.id} className="p-3 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="neutral" className="text-[9px] uppercase tracking-wider font-bold">
                                {t.classification}
                              </Badge>
                              <span className="font-semibold text-text-primary text-[13px] truncate">
                                {t.description}
                              </span>
                            </div>
                            <div className="text-[11px] text-text-secondary font-mono">
                              Rate: <span className="font-semibold text-text-primary">₹{t.default_rate}</span>/{t.uom}
                            </div>
                          </div>
                          <div className="w-full sm:w-24 shrink-0">
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="0"
                              className="text-center"
                              value={wageEntries[t.id] || ''}
                              onChange={(e) => setWageEntries(prev => ({ ...prev, [t.id]: e.target.value }))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </EntityEditModal.Body>
          <EntityEditModal.Footer>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseWages}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!selectedSubcontractorId || availableTemplates.length === 0}>
              Submit Wages
            </Button>
          </EntityEditModal.Footer>
        </form>
      </EntityEditModal>
    </PageContainer>
  );
}
