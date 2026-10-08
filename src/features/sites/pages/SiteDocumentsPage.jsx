import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText, Upload, Download, Eye, Edit, Trash2, Search, Filter,
  Layers, CheckCircle2, Clock, ShieldCheck, Plus, Building2, Calendar,
  RefreshCw, MapPin, Tag, FileCode, AlertCircle, X
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
import { projectDocumentsApi, sitesApi, projectsApi } from '../../../api/apiservice';

const DOCUMENT_CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'Drawings & Blueprints', name: 'Drawings & Blueprints' },
  { id: 'Permits & Approvals', name: 'Permits & Approvals' },
  { id: 'QA/QC & Test Reports', name: 'QA/QC & Test Reports' },
  { id: 'Safety & HSE', name: 'Safety & HSE Permits' },
  { id: 'Contracts & Specifications', name: 'Contracts & Specifications' },
];

const STATUS_OPTIONS = [
  { id: 'all', name: 'All Statuses' },
  { id: 'Active', name: 'Active' },
  { id: 'Approved', name: 'Approved' },
  { id: 'Under Review', name: 'Under Review' },
  { id: 'Pending', name: 'Pending' },
  { id: 'Archived', name: 'Archived' },
];

const EMPTY_FORM = {
  project_id: '',
  site_id: '',
  document_code: '',
  title: '',
  category: '',
  revision_number: 'R0',
  file_path: '',
  file: null,
  issue_date: new Date().toISOString().split('T')[0],
  issued_by: '',
  status: 'Active',
  remarks: '',
};

export function SiteDocumentsPage() {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Load Projects & Sites
  useEffect(() => {
    Promise.all([
      projectsApi.list().catch(() => ({ data: { projects: [] } })),
      sitesApi.list().catch(() => ({ data: { sites: [] } })),
    ]).then(([pRes, sRes]) => {
      const pList = pRes?.data?.projects ?? pRes?.projects ?? (Array.isArray(pRes?.data) ? pRes.data : []);
      const sList = sRes?.data?.sites ?? sRes?.sites ?? (Array.isArray(sRes?.data) ? sRes.data : []);
      setProjects(Array.isArray(pList) ? pList : []);
      setSites(Array.isArray(sList) ? sList : []);
    });
  }, []);

  // Fetch Site Documents from Real API
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProjectId !== 'all') params.project_id = selectedProjectId;
      if (selectedSiteId !== 'all') params.site_id = selectedSiteId;

      const res = await projectDocumentsApi.list(params);
      const list = res?.data?.project_documents ?? res?.data?.documents ?? res?.project_documents ?? res?.documents ?? res?.data ?? res ?? [];
      const rawArr = Array.isArray(list) ? list : [];

      const normalized = rawArr.map((item, idx) => {
        const proj = projects.find(p => String(p.id) === String(item.project_id));
        const site = sites.find(s => String(s.id) === String(item.site_id));
        return {
          ...item,
          id: item.id || idx + 1,
          document_code: item.document_code || item.document_number || item.code || `DOC-${item.id || idx + 1}`,
          title: item.title || item.document_title || item.document_name || item.name || `Document #${item.id}`,
          category: item.category || item.document_type_name || item.document_type || 'Drawings & Blueprints',
          project_id: item.project_id || proj?.id || '',
          project_name: item.project_name || proj?.project_name || proj?.name || '—',
          site_id: item.site_id || site?.id || '',
          site_name: item.site_name || site?.site_name || site?.name || '—',
          revision_number: item.revision_number || item.revision || 'R0',
          file_path: item.file_path || item.original_file_name || item.file_name || item.url || '',
          issue_date: item.issue_date || item.document_date || (item.created_at ? item.created_at.split('T')[0] : '—'),
          issued_by: item.issued_by || item.created_by_name || '—',
          status: item.status || item.status_name || (item.is_active === 0 || item.is_active === false ? 'Inactive' : 'Active'),
          remarks: item.remarks || item.description || '',
        };
      });

      setDocuments(normalized);
    } catch (err) {
      console.error('Failed to fetch site documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedSiteId, projects, sites]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Sites dropdown filtered by selected project
  const filteredSites = useMemo(() => {
    if (selectedProjectId === 'all') return sites;
    return sites.filter(s => String(s.project_id) === String(selectedProjectId));
  }, [sites, selectedProjectId]);

  // Filtered Documents list
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const q = search.toLowerCase();
      const codeMatch = String(doc.document_code || '').toLowerCase().includes(q);
      const titleMatch = String(doc.title || '').toLowerCase().includes(q);
      const projMatch = String(doc.project_name || '').toLowerCase().includes(q);
      const siteMatch = String(doc.site_name || '').toLowerCase().includes(q);
      const fileMatch = String(doc.file_path || '').toLowerCase().includes(q);
      const categoryMatch = String(doc.category || '').toLowerCase().includes(q);
      const matchesSearch = !q || codeMatch || titleMatch || projMatch || siteMatch || fileMatch || categoryMatch;

      const matchesProject = selectedProjectId === 'all' || String(doc.project_id) === String(selectedProjectId);
      const matchesSite = selectedSiteId === 'all' || String(doc.site_id) === String(selectedSiteId);
      const matchesCat = selectedCategory === 'all' || String(doc.category).toLowerCase() === String(selectedCategory).toLowerCase();
      const matchesStatus = selectedStatus === 'all' || String(doc.status).toLowerCase() === String(selectedStatus).toLowerCase();

      return matchesSearch && matchesProject && matchesSite && matchesCat && matchesStatus;
    });
  }, [documents, search, selectedProjectId, selectedSiteId, selectedCategory, selectedStatus]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  // KPI Calculations
  const activeCount = useMemo(() => documents.filter(d => ['active', 'approved'].includes(String(d.status).toLowerCase())).length, [documents]);
  const drawingsCount = useMemo(() => documents.filter(d => String(d.category).toLowerCase().includes('drawing') || String(d.category).toLowerCase().includes('blueprint')).length, [documents]);
  const pendingCount = useMemo(() => documents.filter(d => ['pending', 'under review', 'draft'].includes(String(d.status).toLowerCase())).length, [documents]);

  // Download Handler
  const handleDownload = async (doc) => {
    if (!doc) return;
    const fileName = doc.original_file_name || doc.file_name || (doc.file_path ? doc.file_path.split('/').pop() : '') || `${doc.title || doc.document_code || 'document'}.pdf`;
    
    toast.info(`Downloading ${fileName}...`);

    try {
      // 1. Attempt backend API download if doc has a real numeric ID
      if (doc.id && typeof doc.id === 'number') {
        try {
          const blob = await projectDocumentsApi.download(doc.id);
          if (blob && (blob.size > 0 || blob.byteLength > 0)) {
            const blobType = blob.type || '';
            if (!blobType.includes('html') && !blobType.includes('text/html')) {
              const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', fileName);
              document.body.appendChild(link);
              link.click();
              link.parentNode.removeChild(link);
              window.URL.revokeObjectURL(url);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('API document download endpoint did not return valid blob, trying direct file URL / blob fallback', apiErr);
        }
      }

      // 2. Handle Data or Blob URIs directly
      const rawPath = doc.file_path || doc.url || doc.original_file_name || '';
      if (rawPath.startsWith('data:') || rawPath.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = rawPath;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        return;
      }

      // 3. Resolve file URL for physical HTTP/HTTPS files
      let fileUrl = rawPath;
      if (fileUrl && !fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
        const serverBase = apiBase.startsWith('http')
          ? apiBase.replace(/\/api\/?$/, '')
          : window.location.origin;
        const cleanPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        fileUrl = `${serverBase}${cleanPath}`;
      }

      if (fileUrl && fileUrl.includes('.')) {
        try {
          const res = await fetch(fileUrl);
          if (res.ok) {
            const blob = await res.blob();
            if (!blob.type.includes('html') && !blob.type.includes('text/html')) {
              const blobUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.setAttribute('download', fileName);
              document.body.appendChild(link);
              link.click();
              link.parentNode.removeChild(link);
              window.URL.revokeObjectURL(blobUrl);
              return;
            }
          }
        } catch (fetchErr) {
          console.warn('Fetch file error:', fetchErr);
        }
      }

      // 4. Generate clean text document fallback when physical file doesn't exist on server
      const fallbackContent = `SITE DOCUMENT & BLUEPRINT SUMMARY
--------------------------------------------------
Document Code / ID : ${doc.document_code || doc.id || 'N/A'}
Title              : ${doc.title || 'N/A'}
Category           : ${doc.category || 'N/A'}
Project            : ${doc.project_name || 'N/A'}
Assigned Site      : ${doc.site_name || 'N/A'}
Revision           : ${doc.revision_number || 'R0'}
Issue Date         : ${doc.issue_date || 'N/A'}
Issued By          : ${doc.issued_by || 'N/A'}
Status             : ${doc.status || 'Active'}
File Reference     : ${doc.file_path || fileName}
--------------------------------------------------
Technical Remarks:
${doc.remarks || 'No additional technical remarks provided.'}
`;
      const fallbackBlob = new Blob([fallbackContent], { type: 'text/plain;charset=utf-8' });
      const fallbackUrl = window.URL.createObjectURL(fallbackBlob);
      const link = document.createElement('a');
      link.href = fallbackUrl;
      const downloadName = fileName.includes('.') ? fileName.replace(/\.[^/.]+$/, '.txt') : `${fileName}.txt`;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(fallbackUrl);

    } catch (error) {
      console.error('Failed to download site document:', error);
      toast.error(error?.message || 'Failed to download document.');
    }
  };

  // Modal Handlers
  const handleOpenAdd = () => {
    const defaultProj = selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id ? String(projects[0].id) : '');
    const availableSites = sites.filter(s => String(s.project_id) === String(defaultProj));
    const defaultSite = selectedSiteId !== 'all' ? selectedSiteId : (availableSites[0]?.id ? String(availableSites[0].id) : '');
    const defaultProjObj = projects.find(p => String(p.id) === String(defaultProj));
    const defaultSiteObj = sites.find(s => String(s.id) === String(defaultSite));

    setForm({
      ...EMPTY_FORM,
      project_id: defaultProj,
      project_name: defaultProjObj?.project_name || '',
      site_id: defaultSite,
      site_name: defaultSiteObj?.site_name || '',
      document_code: `DOC-SITE-${String(documents.length + 1).padStart(3, '0')}`,
      issue_date: new Date().toISOString().split('T')[0],
      file: null,
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (doc) => {
    setForm({
      project_id: String(doc.project_id || ''),
      project_name: doc.project_name || '',
      site_id: String(doc.site_id || ''),
      site_name: doc.site_name || '',
      document_code: doc.document_code || '',
      title: doc.title || '',
      category: doc.category || 'Drawings & Blueprints',
      revision_number: doc.revision_number || 'R0',
      file_path: doc.file_path || '',
      file: null,
      issue_date: doc.issue_date || new Date().toISOString().split('T')[0],
      issued_by: doc.issued_by || '',
      status: doc.status || 'Active',
      remarks: doc.remarks || '',
    });
    setEditingDoc(doc);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Document title is required.');
      return;
    }
    setSaving(true);
    try {
      const selectedProj = projects.find(p => String(p.id) === String(form.project_id));
      const selectedSite = sites.find(s => String(s.id) === String(form.site_id));

      let payload;
      if (form.file) {
        payload = new FormData();
        payload.append('project_id', form.project_id);
        if (form.site_id) payload.append('site_id', form.site_id);
        payload.append('document_code', form.document_code);
        payload.append('document_number', form.document_code);
        payload.append('title', form.title);
        payload.append('document_title', form.title);
        payload.append('category', form.category);
        payload.append('revision_number', form.revision_number || 'R0');
        payload.append('file_path', form.file.name);
        payload.append('original_file_name', form.file.name);
        payload.append('issue_date', form.issue_date);
        payload.append('issued_by', form.issued_by);
        payload.append('status', form.status);
        payload.append('remarks', form.remarks || '');
        payload.append('project_name', selectedProj?.project_name || form.project_name || '');
        payload.append('site_name', selectedSite?.site_name || form.site_name || '');
        payload.append('file', form.file);
        payload.append('document_file', form.file);
      } else {
        payload = {
          ...form,
          project_name: selectedProj?.project_name || form.project_name,
          site_name: selectedSite?.site_name || form.site_name,
        };
      }

      if (editingDoc) {
        await projectDocumentsApi.update(editingDoc.id, payload);
        toast.success('Site document updated successfully.');
        setEditingDoc(null);
      } else {
        await projectDocumentsApi.create(payload);
        toast.success('New site document created successfully.');
        setIsAddOpen(false);
      }
      fetchDocuments();
    } catch (err) {
      toast.error(err?.message || 'Failed to save site document.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    setSaving(true);
    try {
      await projectDocumentsApi.remove(deletingDoc.id);
      toast.success('Document deleted successfully.');
      setDeletingDoc(null);
      fetchDocuments();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete document.');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Sites & Locations', href: '/sites' },
    { label: 'Site Documents' }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Site Documents & Blueprints"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col gap-3 sm:gap-4 w-full">
        {/* KPI Summary Ribbon - Matched with Site Team Assignment */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KpiCard
            label="Total Site Documents"
            value={documents.length}
            status="primary"
            icon={<FileText className="w-4 h-4 text-primary" />}
          />
          <KpiCard
            label="Active & Approved"
            value={activeCount}
            status="success"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          />
          <KpiCard
            label="Drawings & Blueprints"
            value={drawingsCount}
            status="info"
            icon={<Layers className="w-4 h-4 text-sky-500" />}
          />
          <KpiCard
            label="Pending Review"
            value={pendingCount}
            status="neutral"
            icon={<Clock className="w-4 h-4 text-amber-500" />}
          />
        </div>

        {/* Clean Filter and Selector Bar - Matched with Site Team Assignment */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-surface border border-border rounded-lg p-2.5 sm:p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Project Selector */}
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Projects' },
                  ...projects.map(p => ({ value: String(p.id), label: `${p.project_code || 'PRJ'} - ${p.project_name || p.name}` }))
                ]}
                value={selectedProjectId}
                onChange={(val) => {
                  setSelectedProjectId(val);
                  setSelectedSiteId('all');
                  setPage(1);
                }}
                className="text-xs h-8"
              />
            </div>

            {/* Site Selector */}
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Sites (Consolidated)' },
                  ...filteredSites.map(s => ({ value: String(s.id), label: `${s.site_code || 'SITE'} - ${s.site_name || s.name}` }))
                ]}
                value={selectedSiteId}
                onChange={(val) => {
                  setSelectedSiteId(val);
                  setPage(1);
                }}
                className="text-xs h-8"
              />
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-52">
              <SearchField
                placeholder="Search document code, title, project, site, file..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-40">
              <Select
                options={DOCUMENT_CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setPage(1);
                }}
                className="text-xs h-8"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-36">
              <Select
                options={STATUS_OPTIONS.map(s => ({ value: s.id, label: s.name }))}
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
              onClick={fetchDocuments}
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
              Add Site Document
            </Button>
          </div>
        </div>

        {/* Desktop & Tablet Table (Hidden on small screens) */}
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
                  <th className="px-3 py-2">Document Code / ID</th>
                  <th className="px-3 py-2">Title & Category</th>
                  <th className="px-3 py-2 hidden md:table-cell">Assigned Site</th>
                  <th className="px-3 py-2 hidden lg:table-cell">File Reference / Path</th>
                  <th className="px-3 py-2 hidden md:table-cell">Issue Date</th>
                  <th className="px-3 py-2 text-center w-24">Status</th>
                  <th className="px-3 py-2 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      Loading site documents...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-text-muted text-[12px]">
                      No site documents found matching your selection.
                    </td>
                  </tr>
                ) : (
                  paged.map((doc, idx) => (
                    <tr key={doc.id || idx} className="hover:bg-surface-muted/30 transition-colors group">
                      <td className="px-3 py-2 text-center font-medium text-text-primary text-[11px]">
                        {(page - 1) * perPage + idx + 1}
                      </td>

                      {/* Code / ID */}
                      <td className="px-3 py-2 font-mono font-semibold text-primary text-[11px] whitespace-nowrap">
                        {doc.document_code}
                      </td>

                      {/* Title & Category */}
                      <td className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary text-[12px]">
                            {doc.title}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-text-muted font-medium">
                              {doc.category}
                            </span>
                            {doc.revision_number && (
                              <span className="text-[10px] text-text-muted font-mono">
                                &bull; Rev: {doc.revision_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Assigned Site */}
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col">
                          <span className="text-text-primary text-[11px] font-medium truncate" title={doc.site_name}>
                            {doc.site_name}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {doc.project_name}
                          </span>
                        </div>
                      </td>

                      {/* File Reference / Path - Compact & Downloadable */}
                      <td className="px-3 py-2 hidden lg:table-cell">
                        {doc.file_path ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline font-medium max-w-[220px] truncate text-left cursor-pointer"
                            title={`Click to download ${doc.file_path}`}
                          >
                            <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{doc.file_path.split('/').pop() || doc.file_path}</span>
                            <Download className="w-3 h-3 text-text-muted shrink-0 ml-0.5" />
                          </button>
                        ) : (
                          <span className="text-text-muted text-[11px] font-mono">—</span>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td className="px-3 py-2 hidden md:table-cell">
                        <div className="flex flex-col text-[11px]">
                          <span className="font-medium text-text-primary">{doc.issue_date || '—'}</span>
                          {doc.issued_by && <span className="text-[10px] text-text-muted">{doc.issued_by}</span>}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2 text-center">
                        <Badge
                          variant={
                            ['active', 'approved'].includes(String(doc.status).toLowerCase())
                              ? 'success'
                              : ['pending', 'under review', 'draft'].includes(String(doc.status).toLowerCase())
                              ? 'warning'
                              : 'neutral'
                          }
                          className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                        >
                          {doc.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="View Document Details"
                            onClick={() => setViewingDoc(doc)}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Download Document"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-3.5 h-3.5 text-text-secondary hover:text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Edit Document"
                            onClick={() => handleOpenEdit(doc)}
                          >
                            <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Delete Document"
                            onClick={() => setDeletingDoc(doc)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-text-secondary hover:text-error" />
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

        {/* Mobile View - Cards List (< sm) */}
        <div className="block sm:hidden space-y-3">
          {loading ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              Loading site documents...
            </div>
          ) : paged.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-xs bg-surface border border-border rounded-lg">
              No site documents found.
            </div>
          ) : (
            paged.map((doc, idx) => (
              <div key={doc.id || idx} className="bg-surface border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">{doc.document_code}</span>
                    <h4 className="font-semibold text-text-primary text-[13px] mt-0.5">{doc.title}</h4>
                    <span className="text-[11px] text-text-secondary">{doc.category}</span>
                  </div>
                  <Badge
                    variant={
                      ['active', 'approved'].includes(String(doc.status).toLowerCase())
                        ? 'success'
                        : 'warning'
                    }
                    className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center leading-none"
                  >
                    {doc.status}
                  </Badge>
                </div>

                <div className="text-xs pt-1 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-text-muted block">Site</span>
                  <span className="font-medium text-text-primary text-[11px] truncate block">{doc.site_name}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <span className="text-[10px] text-text-muted font-mono">{doc.issue_date || '—'}</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setViewingDoc(doc)}>
                      <Eye className="w-3 h-3 mr-1" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50" onClick={() => handleDownload(doc)}>
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleOpenEdit(doc)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit Modal - Exact SiteTeamPage Form Structure */}
      {(isAddOpen || editingDoc) && (
        <EntityEditModal
          isOpen={true}
          onClose={() => { setIsAddOpen(false); setEditingDoc(null); }}
        >
          <EntityEditModal.Header
            icon={FileText}
            title={editingDoc ? 'Edit Site Document' : 'Add New Site Document'}
            subtitle="Upload, link, and manage technical drawings, permits, and site documents."
            onClose={() => { setIsAddOpen(false); setEditingDoc(null); }}
          />
          <form id="site-document-form" onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <EntityEditModal.Body>
              <EntityEditModal.Section title="Document Mapping & Classification">
                <EntityEditModal.Grid>
                  <FormField label="Project" required>
                    <Select
                      options={[
                        { value: '', label: 'Select Project' },
                        ...projects.map(p => ({ value: String(p.id), label: `${p.project_code || 'PRJ'} - ${p.project_name || p.name}` }))
                      ]}
                      value={form.project_id}
                      onChange={(val) => {
                        const pObj = projects.find(p => String(p.id) === String(val));
                        setForm(prev => ({
                          ...prev,
                          project_id: val,
                          project_name: pObj?.project_name || '',
                          site_id: '',
                        }));
                      }}
                    />
                  </FormField>

                  <FormField label="Site" required>
                    <Select
                      options={[
                        { value: '', label: 'Select Site' },
                        ...filteredSites.map(s => ({ value: String(s.id), label: `${s.site_code || 'SITE'} - ${s.site_name || s.name}` }))
                      ]}
                      value={form.site_id}
                      onChange={(val) => {
                        const sObj = sites.find(s => String(s.id) === String(val));
                        setForm(prev => ({
                          ...prev,
                          site_id: val,
                          site_name: sObj?.site_name || '',
                        }));
                      }}
                    />
                  </FormField>

                  <FormField label="Document Code / Ref No." required>
                    <Input
                      value={form.document_code}
                      onChange={e => setForm(prev => ({ ...prev, document_code: e.target.value }))}
                      placeholder="e.g. DOC-SITE-001"
                    />
                  </FormField>

                  <FormField label="Document Category" required>
                    <Select
                      options={[
                        { value: '', label: 'Select Category' },
                        ...DOCUMENT_CATEGORIES.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: c.name }))
                      ]}
                      value={form.category}
                      onChange={(val) => setForm(prev => ({ ...prev, category: val }))}
                    />
                  </FormField>

                  <FormField label="Document Title / Name" required className="md:col-span-2">
                    <Input
                      value={form.title}
                      onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Structural Blueprint Sheet 04"
                    />
                  </FormField>
                </EntityEditModal.Grid>
              </EntityEditModal.Section>

              <EntityEditModal.Section title="Revision & File Specifications">
                <EntityEditModal.Grid>
                  <FormField label="Revision Number">
                    <Input
                      value={form.revision_number}
                      onChange={e => setForm(prev => ({ ...prev, revision_number: e.target.value }))}
                      placeholder="e.g. R0, R1, v2.0"
                    />
                  </FormField>

                  <FormField label="Issue / Upload Date">
                    <Input
                      type="date"
                      value={form.issue_date}
                      onChange={e => setForm(prev => ({ ...prev, issue_date: e.target.value }))}
                    />
                  </FormField>

                  <FormField label="File Reference / Path">
                    <Input
                      value={form.file_path}
                      onChange={e => setForm(prev => ({ ...prev, file_path: e.target.value }))}
                      placeholder="e.g. /uploads/blueprints/sheet_04.pdf"
                    />
                  </FormField>

                  <FormField label="Upload New File">
                    <input
                      type="file"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                          setForm(prev => ({
                            ...prev,
                            file: selectedFile,
                            file_path: selectedFile.name
                          }));
                        }
                      }}
                      className="text-xs text-text-secondary border border-border rounded-md p-1.5 w-full bg-surface"
                    />
                  </FormField>

                  <FormField label="Issued By / Authority">
                    <Input
                      value={form.issued_by}
                      onChange={e => setForm(prev => ({ ...prev, issued_by: e.target.value }))}
                      placeholder="e.g. Structural Lead / City Authority"
                    />
                  </FormField>

                  <FormField label="Document Status">
                    <Select
                      options={[
                        { value: 'Active', label: 'Active' },
                        { value: 'Approved', label: 'Approved' },
                        { value: 'Under Review', label: 'Under Review' },
                        { value: 'Pending', label: 'Pending' },
                        { value: 'Archived', label: 'Archived' },
                      ]}
                      value={form.status}
                      onChange={(val) => setForm(prev => ({ ...prev, status: val }))}
                    />
                  </FormField>

                  <FormField label="Technical Remarks / Description" className="md:col-span-2">
                    <Textarea
                      rows={3}
                      value={form.remarks}
                      onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Notes, drawing changes, permit conditions..."
                    />
                  </FormField>
                </EntityEditModal.Grid>
              </EntityEditModal.Section>
            </EntityEditModal.Body>

            <EntityEditModal.Footer
              formId="site-document-form"
              submitLabel={editingDoc ? 'Update Document' : 'Save Document'}
              onCancel={() => { setIsAddOpen(false); setEditingDoc(null); }}
              isSubmitting={saving}
            />
          </form>
        </EntityEditModal>
      )}

      {/* View Document Details Modal - Exact SiteTeamPage Modal Structure */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface border border-border rounded-xl shadow-level-3 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    {viewingDoc.title}
                  </h3>
                  <span className="text-[11px] text-text-muted">
                    {viewingDoc.category} &bull; Rev: {viewingDoc.revision_number || 'R0'}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingDoc(null)}>✕</Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded-lg border border-border">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Document Code</span>
                  <span className="font-mono font-semibold text-primary">{viewingDoc.document_code}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Status</span>
                  <Badge
                    variant={
                      ['active', 'approved'].includes(String(viewingDoc.status).toLowerCase())
                        ? 'success'
                        : ['pending', 'under review', 'draft', 'submitted'].includes(String(viewingDoc.status).toLowerCase())
                        ? 'warning'
                        : 'neutral'
                    }
                    className="text-[8px] px-1.5 py-0.5"
                  >
                    {viewingDoc.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Project</span>
                  <span className="font-medium text-text-primary">{viewingDoc.project_name || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Assigned Site</span>
                  <span className="font-medium text-text-primary">{viewingDoc.site_name || '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Issue Date</span>
                  <span className="font-mono">{viewingDoc.issue_date ? viewingDoc.issue_date.split(' ')[0] : '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Issued By</span>
                  <span className="font-medium text-text-primary">{viewingDoc.issued_by && viewingDoc.issued_by !== '—' ? viewingDoc.issued_by : 'Project Site Engineer'}</span>
                </div>
              </div>

              {/* File Attachment Link */}
              {viewingDoc.file_path && (
                <div className="border border-border rounded-lg p-3 space-y-1 bg-surface-muted/20">
                  <span className="font-bold text-text-primary block text-[11px]">File Reference Path:</span>
                  <button
                    type="button"
                    onClick={() => handleDownload(viewingDoc)}
                    className="font-mono text-xs text-primary hover:underline break-all inline-flex items-center gap-1.5 mt-0.5 cursor-pointer text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{viewingDoc.file_path.split('/').pop() || viewingDoc.file_path}</span>
                    <Download className="w-3.5 h-3.5 ml-1 text-emerald-600 shrink-0" />
                  </button>
                </div>
              )}

              {/* Technical Remarks */}
              {viewingDoc.remarks && (
                <div className="border border-border rounded-lg p-3 space-y-1">
                  <span className="font-bold text-text-primary block text-[11px]">Technical Remarks & Notes:</span>
                  <p className="text-text-secondary whitespace-pre-wrap text-[11px]">{viewingDoc.remarks}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border bg-surface-muted/20 flex justify-between items-center">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleDownload(viewingDoc)}
              >
                Download File
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewingDoc(null)}>Close</Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const doc = viewingDoc;
                    setViewingDoc(null);
                    handleOpenEdit(doc);
                  }}
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingDoc && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Site Document"
          message={`Are you sure you want to delete "${deletingDoc.title || deletingDoc.document_code}"?`}
          confirmLabel="Delete Document"
          onConfirm={handleDelete}
          onCancel={() => setDeletingDoc(null)}
          loading={saving}
          variant="danger"
        />
      )}
    </PageContainer>
  );
}

export default SiteDocumentsPage;
